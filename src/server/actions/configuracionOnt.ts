"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { encrypt, decrypt, isEncrypted } from "@/lib/crypto"

// ─── CRUD ConfiguracionOnt ────────────────────────────────────────────────────

export async function crearConfiguracionOnt(
  ubicacionInstalacionId: string,
  formData: FormData
) {
  try {
    const macOnt = formData.get("macOnt") as string
    const vlanGestion = parseInt(formData.get("vlanGestion") as string, 10)
    const pppoeUsuario = formData.get("pppoeUsuario") as string
    const pppoePasswordRaw = formData.get("pppoePassword") as string
    const configWifi = formData.get("configWifi") as string

    if (!macOnt || !pppoeUsuario || !pppoePasswordRaw || isNaN(vlanGestion)) {
      return { error: "Todos los campos obligatorios son requeridos" }
    }

    // Verificar si ya existe configuración para esa ubicación
    const existe = await prisma.configuracionOnt.findUnique({
      where: { ubicacionInstalacionId },
    })
    if (existe) {
      return { error: "Ya existe una configuración ONT para esta ubicación" }
    }

    // Cifrar la contraseña PPPoE antes de guardar
    const pppoePasswordCifrado = await encrypt(pppoePasswordRaw)

    const config = await prisma.configuracionOnt.create({
      data: {
        ubicacionInstalacionId,
        macOnt,
        vlanGestion,
        pppoeUsuario,
        pppoePassword: pppoePasswordCifrado,
        configWifi: configWifi || null,
      },
    })

    revalidatePath("/dashboard/clientes")
    return { success: true, data: config }
  } catch (error) {
    console.error("Error al crear configuración ONT:", error)
    return { error: "Error al crear la configuración ONT" }
  }
}

export async function actualizarConfiguracionOnt(
  configId: string,
  formData: FormData
) {
  try {
    const macOnt = formData.get("macOnt") as string
    const vlanGestion = parseInt(formData.get("vlanGestion") as string, 10)
    const pppoeUsuario = formData.get("pppoeUsuario") as string
    const pppoePasswordRaw = formData.get("pppoePassword") as string
    const configWifi = formData.get("configWifi") as string

    if (!macOnt || !pppoeUsuario || isNaN(vlanGestion)) {
      return { error: "Todos los campos obligatorios son requeridos" }
    }

    // Solo cifrar si se proporcionó una nueva contraseña
    let pppoePasswordFinal: string | undefined
    if (pppoePasswordRaw && pppoePasswordRaw.trim() !== "") {
      // Si ya está cifrado (viene del form oculto), no volver a cifrar
      if (isEncrypted(pppoePasswordRaw)) {
        pppoePasswordFinal = pppoePasswordRaw
      } else {
        pppoePasswordFinal = await encrypt(pppoePasswordRaw)
      }
    }

    const updateData: Record<string, unknown> = {
      macOnt,
      vlanGestion,
      pppoeUsuario,
      configWifi: configWifi || null,
    }
    if (pppoePasswordFinal) {
      updateData.pppoePassword = pppoePasswordFinal
    }

    const config = await prisma.configuracionOnt.update({
      where: { id: configId },
      data: updateData,
    })

    revalidatePath("/dashboard/clientes")
    return { success: true, data: config }
  } catch (error) {
    console.error("Error al actualizar configuración ONT:", error)
    return { error: "Error al actualizar la configuración ONT" }
  }
}

export async function eliminarConfiguracionOnt(configId: string) {
  try {
    await prisma.configuracionOnt.delete({ where: { id: configId } })
    revalidatePath("/dashboard/clientes")
    return { success: true }
  } catch (error) {
    console.error("Error al eliminar configuración ONT:", error)
    return { error: "Error al eliminar la configuración ONT" }
  }
}

/**
 * Descifra la contraseña PPPoE de una configuración (solo para uso autorizado).
 * Nunca exponer esto directamente en una ruta pública.
 */
export async function obtenerPasswordDescifrada(configId: string): Promise<string | null> {
  try {
    const config = await prisma.configuracionOnt.findUnique({
      where: { id: configId },
      select: { pppoePassword: true },
    })
    if (!config) return null
    return await decrypt(config.pppoePassword)
  } catch {
    return null
  }
}
