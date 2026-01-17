import { AuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email y contraseña son requeridos")
        }

        // Buscar usuario por email
        const persona = await prisma.persona.findUnique({
          where: { email: credentials.email },
          include: {
            personaUsuario: true,
            personaEmpleado: true,
            cliente: true,
          }
        })

        if (!persona || !persona.personaUsuario) {
          throw new Error("Credenciales inválidas")
        }

        // Verificar estado de acceso
        if (persona.personaUsuario.estadoAcceso !== "ACTIVO") {
          throw new Error("Usuario bloqueado o inactivo")
        }

        // Verificar contraseña
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          persona.personaUsuario.password
        )

        if (!isPasswordValid) {
          throw new Error("Credenciales inválidas")
        }

        // Retornar datos del usuario
        return {
          id: persona.id,
          email: persona.email!,
          name: `${persona.nombres} ${persona.apellidos || ""}`.trim(),
          role: persona.personaUsuario.rolPrincipal,
          image: null,
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id && token.role) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    }
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  secret: process.env.NEXTAUTH_SECRET,
}

// Helper para verificar roles
export function hasRole(userRole: string, allowedRoles: string[]) {
  return allowedRoles.includes(userRole)
}

// Helper para verificar si es admin
export function isAdmin(userRole: string) {
  return userRole === "ADMIN"
}