"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Loader2, Wifi, WifiOff, AlertTriangle, Ban } from "lucide-react"
import { cambiarEstadoConexion } from "@/server/actions/clientes"
import { toast } from "sonner"
import { EstadoConexion } from "@prisma/client"

const ESTADOS: {
  value: EstadoConexion
  label: string
  icon: React.ElementType
  color: string
}[] = [
  { value: "ACTIVO", label: "Activo", icon: Wifi, color: "text-green-600" },
  { value: "SUSPENDIDO", label: "Suspendido", icon: AlertTriangle, color: "text-yellow-600" },
  { value: "CORTADO", label: "Cortado", icon: WifiOff, color: "text-red-600" },
  { value: "BAJA", label: "Baja", icon: Ban, color: "text-gray-600" },
]

export default function CambiarEstadoCliente({
  clienteId,
  estadoActual,
}: {
  clienteId: string
  estadoActual: string
}) {
  const [isLoading, setIsLoading] = useState(false)

  const handleCambiar = async (nuevoEstado: EstadoConexion) => {
    if (nuevoEstado === estadoActual) return
    setIsLoading(true)
    try {
      const result = await cambiarEstadoConexion(clienteId, nuevoEstado)
      if (result.success) {
        toast.success(`Estado cambiado a ${nuevoEstado}`)
      } else {
        toast.error(result.error ?? "Error al cambiar estado")
      }
    } catch {
      toast.error("Error de conexión")
    } finally {
      setIsLoading(false)
    }
  }

  const estadoInfo = ESTADOS.find((e) => e.value === estadoActual)
  const Icon = estadoInfo?.icon ?? Wifi

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isLoading} className="gap-2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Icon className={`h-4 w-4 ${estadoInfo?.color}`} />
          )}
          {estadoActual}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Cambiar estado</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {ESTADOS.map((estado) => {
          const E = estado.icon
          return (
            <DropdownMenuItem
              key={estado.value}
              onClick={() => handleCambiar(estado.value)}
              className={estado.value === estadoActual ? "font-semibold bg-muted" : ""}
            >
              <E className={`mr-2 h-4 w-4 ${estado.color}`} />
              {estado.label}
              {estado.value === estadoActual && (
                <span className="ml-auto text-xs text-muted-foreground">actual</span>
              )}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
