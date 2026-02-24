/**
 * Utilidades de cifrado simétrico para campos sensibles.
 * Usa AES-256-GCM (autenticado) vía la API Web Crypto nativa de Node.js / Edge.
 *
 * La clave se toma de la variable de entorno ENCRYPTION_KEY (hex de 64 chars = 32 bytes).
 * Si no está definida, lanza un error en runtime para forzar su configuración.
 */

const ALGORITHM = "AES-GCM"
const KEY_LENGTH = 256 // bits
const IV_LENGTH = 12 // bytes recomendados para GCM

/** Convierte una cadena hexadecimal a ArrayBuffer */
function hexToBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, 2 + i), 16)
  }
  return bytes.buffer
}

/** Convierte ArrayBuffer a string hexadecimal */
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

/** Importa la clave de cifrado desde la variable de entorno */
async function getKey(): Promise<CryptoKey> {
  const hexKey = process.env.ENCRYPTION_KEY
  if (!hexKey || hexKey.length !== 64) {
    throw new Error(
      "ENCRYPTION_KEY no está configurada o no tiene 64 caracteres hex (32 bytes). " +
      "Genera una con: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    )
  }
  return crypto.subtle.importKey(
    "raw",
    hexToBuffer(hexKey),
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  )
}

/**
 * Cifra un texto plano con AES-256-GCM.
 * Retorna una cadena con formato: iv_hex:ciphertext_hex
 */
export async function encrypt(plaintext: string): Promise<string> {
  const key = await getKey()
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const encoded = new TextEncoder().encode(plaintext)

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoded
  )

  return `${bufferToHex(iv.buffer)}:${bufferToHex(cipherBuffer)}`
}

/**
 * Descifra un texto cifrado con AES-256-GCM.
 * Espera formato: iv_hex:ciphertext_hex
 */
export async function decrypt(ciphertext: string): Promise<string> {
  const [ivHex, dataHex] = ciphertext.split(":")
  if (!ivHex || !dataHex) {
    throw new Error("Formato de ciphertext inválido. Se esperaba: iv_hex:data_hex")
  }

  const key = await getKey()
  const iv = new Uint8Array(hexToBuffer(ivHex))
  const data = hexToBuffer(dataHex)

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    data
  )

  return new TextDecoder().decode(decryptedBuffer)
}

/**
 * Verifica si un valor ya está cifrado (tiene el formato iv:ciphertext).
 * Útil para evitar doble cifrado al actualizar registros.
 */
export function isEncrypted(value: string): boolean {
  const parts = value.split(":")
  return parts.length === 2 && parts[0].length === IV_LENGTH * 2
}
