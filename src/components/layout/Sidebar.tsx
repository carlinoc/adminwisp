"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  MapPin, 
  DollarSign, 
  ClipboardList, 
  Package,
  Wifi,
  X,
  ChevronDown,
  Layers,
  Inbox
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

interface SidebarProps {
  user: {
    name?: string | null
    email?: string | null
    role?: string
  }
  isOpen: boolean
  onClose: () => void
}

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN", "VENDEDOR", "TECNICO", "SOPORTE", "CONTADOR"],
  },
  {
    name: "Clientes",
    href: "/dashboard/clientes",
    icon: Users,
    roles: ["ADMIN", "VENDEDOR", "SOPORTE"],
  },
  {
    name: "Contratos",
    href: "/dashboard/contratos",
    icon: FileText,
    roles: ["ADMIN", "VENDEDOR", "CONTADOR"],
  },
  {
    name: "Infraestructura",
    href: "/dashboard/infraestructura",
    icon: MapPin,
    roles: ["ADMIN", "TECNICO"],
  },
  {
    name: "Facturación",
    href: "/dashboard/facturacion",
    icon: DollarSign,
    roles: ["ADMIN", "CONTADOR"],
  },
  {
    name: "Pedidos",
    href: "/dashboard/pedidos",
    icon: ClipboardList,
    roles: ["ADMIN", "SOPORTE", "TECNICO"],
  },
  {
    name: "Materiales",
    href: "/dashboard/materiales",
    icon: Package,
    roles: ["ADMIN", "TECNICO"],
    children: [
      { name: "Inventario", href: "/dashboard/materiales/inventario", icon: Inbox },
      { name: "Materiales", href: "/dashboard/materiales/lista", icon: Layers },
    ],
  },
]

export default function Sidebar({ user, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [openMenus, setOpenMenus] = useState<string[]>([])

  // Efecto para abrir el menú automáticamente si la ruta actual es un hijo
  useEffect(() => {
    navigation.forEach(item => {
      if (item.children?.some(child => pathname === child.href)) {
        if (!openMenus.includes(item.name)) {
          setOpenMenus(prev => [...prev, item.name])
        }
      }
    })
  }, [pathname])

  const toggleMenu = (name: string) => {
    setOpenMenus((prev) =>
      prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name]
    )
  }

  // Filtrar navegación según rol del usuario
  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(user.role || "")
  )

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Wifi className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 dark:text-white">ISP Admin</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Sistema de Gestión</p>
            </div>
          </div>
          {/* Botón cerrar en móvil */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {filteredNavigation.map((item) => {
            const Icon = item.icon
            const hasChildren = !!item.children
            const isChildActive = item.children?.some(child => pathname === child.href)
            const isActive = pathname === item.href || isChildActive
            const isMenuOpen = openMenus.includes(item.name)

            return (
              <div key={item.name} className="space-y-1">
                {hasChildren ? (
                  <>
                    <button
                      onClick={() => toggleMenu(item.name)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                        // Fondo suave para el padre activo
                        isActive 
                          ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" 
                          : "text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800/50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={cn("h-5 w-5", isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600")} />
                        <span>{item.name}</span>
                      </div>
                      <ChevronDown className={cn("h-4 w-4 transition-transform", isMenuOpen && "rotate-180")} />
                    </button>

                    {/* Submenu */}
                    {isMenuOpen && (
                      <div className="ml-5 mt-1 border-l border-gray-100 dark:border-gray-800 space-y-1">
                        {item.children?.map((child) => {
                          const ChildIcon = child.icon
                          const isSubActive = pathname === child.href
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={cn(
                                "flex items-center gap-3 ml-4 px-3 py-2 rounded-lg text-sm transition-all relative",
                                isSubActive
                                  ? "text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-500/5 font-semibold"
                                  : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                              )}
                            >
                              {/* Indicador visual de punto si está activo */}
                              {isSubActive && (
                                <span className="absolute -left-[17px] w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                              )}
                              {ChildIcon && <ChildIcon className="h-4 w-4" />}
                              {child.name}
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative",
                      // Cambio aquí: azul suave en lugar de fondo sólido fuerte
                      pathname === item.href
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                        : "text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800/50"
                    )}
                  >
                    {/* Barra lateral acentuada solo cuando está activo */}
                    {pathname === item.href && (
                      <span className="absolute left-0 w-1 h-6 bg-blue-600 dark:bg-blue-400 rounded-r-full" />
                    )}
                    
                    <Icon className={cn("h-5 w-5", pathname === item.href ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600")} />
                    {item.name}
                  </Link>
                )}
              </div>
            )
          })}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
              {user.name?.charAt(0) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user.role}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}