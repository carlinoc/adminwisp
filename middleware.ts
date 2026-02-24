import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

// Rutas del dashboard y qué roles pueden acceder
const ROUTE_ROLES: Record<string, string[]> = {
  "/dashboard/clientes":      ["ADMIN", "VENDEDOR", "SOPORTE"],
  "/dashboard/contratos":     ["ADMIN", "VENDEDOR", "CONTADOR"],
  "/dashboard/zonas":         ["ADMIN", "TECNICO"],
  "/dashboard/personal":      ["ADMIN"],
  "/dashboard/infraestructura":["ADMIN", "TECNICO"],
  "/dashboard/facturacion":          ["ADMIN", "CONTADOR"],
  "/dashboard/facturacion/facturas": ["ADMIN", "CONTADOR"],
  "/dashboard/facturacion/pagos":    ["ADMIN", "CONTADOR"],
  "/dashboard/pedidos":       ["ADMIN", "SOPORTE", "TECNICO"],
  "/dashboard/pedidos/tipos":  ["ADMIN"],
  "/dashboard/materiales":    ["ADMIN", "TECNICO"],
  "/dashboard/reportes":      ["ADMIN", "CONTADOR"],
  "/dashboard/usuarios":      ["ADMIN"],
  "/dashboard/configuracion": ["ADMIN"],
}

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAuth = !!token
    const pathname = req.nextUrl.pathname
    const isAuthPage = pathname.startsWith("/login")

    // Si está en página de auth y ya está autenticado, redirigir al dashboard
    if (isAuthPage && isAuth) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    // Si no está autenticado y no está en una ruta pública, redirigir al login
    if (!isAuthPage && !isAuth) {
      const from = req.nextUrl.pathname + (req.nextUrl.search || "")
      return NextResponse.redirect(
        new URL(`/login?from=${encodeURIComponent(from)}`, req.url)
      )
    }

    // Verificar roles para rutas protegidas del dashboard
    if (isAuth && token) {
      const userRole = token.role as string

      // Buscar la ruta más específica que coincida
      const matchedRoute = Object.keys(ROUTE_ROLES).find((route) =>
        pathname.startsWith(route)
      )

      if (matchedRoute) {
        const allowedRoles = ROUTE_ROLES[matchedRoute]
        if (!allowedRoles.includes(userRole)) {
          // Redirigir a página de acceso denegado o al dashboard principal
          return NextResponse.redirect(new URL("/dashboard?error=unauthorized", req.url))
        }
      }

      // Verificar que el usuario tenga estadoAcceso ACTIVO (se verifica en el token)
      if (token.estadoAcceso && token.estadoAcceso !== "ACTIVO") {
        return NextResponse.redirect(new URL("/login?error=account_blocked", req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      // Retornamos true para que el middleware se ejecute siempre
      // La lógica real de auth está en la función de arriba
      authorized: () => true,
    },
  }
)

// Configurar qué rutas intercepta el middleware
export const config = {
  matcher: [
    /*
     * Interceptar todas las rutas EXCEPTO:
     * - api/auth (endpoints de NextAuth)
     * - _next/static (archivos estáticos de Next.js)
     * - _next/image (optimización de imágenes)
     * - favicon.ico
     * - archivos con extensión (imágenes, fuentes, etc.)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*$).*)",
  ],
}