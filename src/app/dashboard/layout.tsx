"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import Sidebar from "@/components/layout/Sidebar"
import Header from "@/components/layout/Header"
import { Menu } from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Nos aseguramos de que el componente esté montado para evitar 
  // errores de hidratación con los temas
  useEffect(() => {
    setMounted(true)
  }, [])

  if (status === "loading" || !mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    redirect("/login")
  }

  return (
    // bg-gray-100 para modo claro y dark:bg-gray-950 para modo oscuro
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300 overflow-hidden">
      
      {/* Sidebar */}
      <Sidebar 
        user={session.user} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header - Aquí es donde está tu botón de toggle */}
        <Header 
          user={session.user} 
          onMenuClick={() => setIsSidebarOpen(true)} 
        />

        {/* Content con scroll independiente */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-transparent">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Botón flotante para móvil (opcional si ya tienes el del Header) */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="fixed bottom-6 right-6 lg:hidden z-30 p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all active:scale-95"
          aria-label="Abrir menú"
        >
          <Menu className="w-6 h-6" />
        </button>
      )}
    </div>
  )
}