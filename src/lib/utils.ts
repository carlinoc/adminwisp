import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Utilidad para combinar clases de Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formatear moneda en soles peruanos
export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(num)
}

// Formatear fecha
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d)
}

// Formatear fecha y hora
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d)
}

// Generar código único (para clientes, contratos, etc.)
export function generateCode(prefix: string, length: number = 6): string {
  const timestamp = Date.now().toString().slice(-4)
  const random = Math.random().toString(36).substring(2, 2 + length - 4).toUpperCase()
  return `${prefix}${timestamp}${random}`
}

// Validar DNI peruano (8 dígitos)
export function isValidDNI(dni: string): boolean {
  return /^\d{8}$/.test(dni)
}

// Validar RUC peruano (11 dígitos)
export function isValidRUC(ruc: string): boolean {
  if (!/^\d{11}$/.test(ruc)) return false
  
  // RUC debe empezar con 10 (persona jurídica) o 20 (empresa)
  const firstTwoDigits = ruc.substring(0, 2)
  return firstTwoDigits === "10" || firstTwoDigits === "20"
}

// Validar email
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Validar teléfono peruano (9 dígitos)
export function isValidPhone(phone: string): boolean {
  return /^9\d{8}$/.test(phone)
}

// Capitalizar primera letra
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

// Obtener iniciales de un nombre
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

// Calcular días entre fechas
export function daysBetween(date1: Date, date2: Date): number {
  const diff = Math.abs(date2.getTime() - date1.getTime())
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// Verificar si una fecha está vencida
export function isOverdue(date: Date): boolean {
  return new Date(date) < new Date()
}

// Truncar texto con puntos suspensivos
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + "..."
}

// Esperar X milisegundos (útil para simular delays)
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Convertir enum a opciones para select
export function enumToOptions<T extends Record<string, string>>(
  enumObj: T,
  labels?: Record<keyof T, string>
): { value: string; label: string }[] {
  return Object.keys(enumObj).map((key) => ({
    value: enumObj[key as keyof T],
    label: labels ? labels[key as keyof T] : key,
  }))
}

// Labels para enums del sistema
export const ESTADO_CONEXION_LABELS = {
  ACTIVO: "Activo",
  SUSPENDIDO: "Suspendido",
  CORTADO: "Cortado",
  BAJA: "Baja",
}

export const ESTADO_CONTRATO_LABELS = {
  ACTIVO: "Activo",
  SUSPENDIDO: "Suspendido",
  CANCELADO: "Cancelado",
  PENDIENTE: "Pendiente",
}

export const ROL_LABELS = {
  ADMIN: "Administrador",
  VENDEDOR: "Vendedor",
  TECNICO: "Técnico",
  SOPORTE: "Soporte",
  CONTADOR: "Contador",
}

export const TIPO_PAGO_LABELS = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
  TARJETA: "Tarjeta",
  YAPE: "Yape",
  PLIN: "Plin",
}

export const ESTADO_PEDIDO_LABELS = {
  PENDIENTE: "Pendiente",
  EN_PROCESO: "En Proceso",
  COMPLETADO: "Completado",
  CANCELADO: "Cancelado",
}

// Colores para estados (para badges)
export const ESTADO_COLORS = {
  ACTIVO: "bg-green-100 text-green-800",
  SUSPENDIDO: "bg-yellow-100 text-yellow-800",
  CORTADO: "bg-red-100 text-red-800",
  BAJA: "bg-gray-100 text-gray-800",
  PENDIENTE: "bg-blue-100 text-blue-800",
  EN_PROCESO: "bg-purple-100 text-purple-800",
  COMPLETADO: "bg-green-100 text-green-800",
  CANCELADO: "bg-red-100 text-red-800",
}