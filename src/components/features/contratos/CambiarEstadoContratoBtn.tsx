"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Loader2, ChevronDown, CheckCircle, PauseCircle, XCircle, Clock } from "lucide-react"
import { cambiarEstadoContrato } from "@/server/actions/contratos"
import { toast } from "sonner"

const ESTADOS = [
  { value: "ACTIVO",     label: "Activo",      Icon: CheckCircle, color: "text-green-600" },
  { value: "PENDIENTE",  label: "Pendiente",   Icon: Clock,       color: "text-blue-600"  },
  { value: "SUSPENDIDO", label: "Suspendido",  Icon: PauseCircle, color: "text-yellow-600"},
  { value: "CANCELADO",  label: "Cancelado",   Icon: XCircle,     color: "text-red-600"   },
]

export default function CambiarEstadoContratoBtn({
  contratoId,
  estadoActual,
}: {
  contratoId: string
  estadoActual: string
}) {
  const [loading, setLoading] = useState(false)

  const handleCambiar = async (estado: string) => {
    setLoading(true)
    const result = await cambiarEstadoContrato(
      contratoId,
      estado as "ACTIVO" | "SUSPENDIDO" | "CANCELADO" | "PENDIENTE"
    )
    setLoading(false)
    result.success ? toast.success("Estado actualizado") : toast.error(result.error ?? "Error")
  }

  const actual = ESTADOS.find((e) => e.value === estadoActual)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={loading}>
          {loading
            ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
            : actual && <actual.Icon className={`h-4 w-4 mr-2 ${actual.color}`} />}
          {actual?.label ?? estadoActual}
          <ChevronDown className="h-3.5 w-3.5 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="text-xs">Cambiar estado a…</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {ESTADOS.filter((e) => e.value !== estadoActual).map(({ value, label, Icon, color }) => (
          <DropdownMenuItem key={value} onClick={() => handleCambiar(value)}>
            <Icon className={`mr-2 h-4 w-4 ${color}`} />{label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
