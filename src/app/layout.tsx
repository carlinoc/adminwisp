import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import SessionProvider from "@/components/providers/SessionProvider"
import { ThemeProvider } from "@/components/providers/themeProvider" // Asegúrate de crearlo (paso 2)

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ISP Admin - Sistema de Gestión",
  description: "Sistema de administración para proveedores de internet",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // suppressHydrationWarning es vital en la etiqueta html
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}