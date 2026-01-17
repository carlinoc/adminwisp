import { getServerSession } from "next-auth"
import { authOptions } from "./auth"
import { redirect } from "next/navigation"

// Helper para obtener la sesión del servidor
export async function getSession() {
  return await getServerSession(authOptions)
}

// Helper para obtener el usuario actual
export async function getCurrentUser() {
  const session = await getSession()
  return session?.user
}

// Helper para verificar si el usuario está autenticado
export async function requireAuth() {
  const session = await getSession()
  
  if (!session) {
    redirect("/login")
  }
  
  return session
}

// Helper para verificar si el usuario tiene un rol específico
export async function requireRole(allowedRoles: string[]) {
  const session = await requireAuth()
  
  if (!allowedRoles.includes(session.user.role)) {
    redirect("/dashboard") // O a una página de "no autorizado"
  }
  
  return session
}

// Helper para verificar si el usuario es admin
export async function requireAdmin() {
  return await requireRole(["ADMIN"])
}