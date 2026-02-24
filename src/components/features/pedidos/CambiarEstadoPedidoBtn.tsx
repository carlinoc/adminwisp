"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Loader2, ChevronDown, Clock, PlayCircle, CheckCircle2, XCircle,
} from "lucide-react"
import { cambiarEstadoPedido } from "@/server/actions/pedidos"
import { toast } from "sonner"

const ESTADOS = [
  { value: "PENDIENTE",  label: "Pendiente",   Icon: Clock,        color: "text-blue-600"   },
  { value: "EN_PROCESO", label: "En Proceso",  Icon: PlayCircle,   color: "text-yellow-600" },
  { value: "COMPLETADO", label: "Completado",  Icon: CheckCircle2, color: "text-green-600"  },
  { value: "CANCELADO",  label: "Cancelado",   Icon: XCircle,      color: "text-red-600"    },
] as const

export default function CambiarEstadoPedidoBtn({
  pedidoId,
  estadoActual,
}: {
  pedidoId: string
  estadoActual: string
}) {
  const [loading,       setLoading]       = useState(false)
  const [showCancelar,  setShowCancelar]  = useState(false)
  const [motivo,        setMotivo]        = useState("")

  const actual = ESTADOS.find((e) => e.value === estadoActual)

  const handleCambiar = async (estado: typeof ESTADOS[number]["value"]) => {
    if (estado === "CANCELADO") { setShowCancelar(true); return }
    setLoading(true)
    const result = await cambiarEstadoPedido(pedidoId, estado)
    setLoading(false)
    result.success ? toast.success("Estado actualizado") : toast.error(result.error ?? "Error")
  }

  const handleConfirmarCancelacion = async () => {
    if (!motivo.trim()) return
    setLoading(true)
    const result = await cambiarEstadoPedido(pedidoId, "CANCELADO", motivo)
    setLoading(false)
    setShowCancelar(false)
    setMotivo("")
    result.success ? toast.success("Pedido cancelado") : toast.error(result.error ?? "Error")
  }

  return (
    <>
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

      <Dialog open={showCancelar} onOpenChange={(o) => { if (!o) { setShowCancelar(false); setMotivo("") } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar pedido</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Motivo de cancelación *</Label>
            <Textarea rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)}
              placeholder="Describe el motivo…"
              className="dark:bg-slate-950 resize-none" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCancelar(false); setMotivo("") }}>
              Volver
            </Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white"
              disabled={!motivo.trim() || loading}
              onClick={handleConfirmarCancelacion}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Confirmar cancelación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
