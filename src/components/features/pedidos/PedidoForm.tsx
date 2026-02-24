"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { AlertCircle, Loader2, ShieldCheck } from "lucide-react"
import { crearPedido, actualizarPedido } from "@/server/actions/pedidos"
import { toast } from "sonner"

const PRIORIDAD_COLOR: Record<string, string> = {
  BAJA:    "text-slate-500",
  NORMAL:  "text-blue-500",
  MEDIA:   "text-yellow-500",
  ALTA:    "text-orange-500",
  URGENTE: "text-red-500",
}

const ESTADOS = ["PENDIENTE", "EN_PROCESO", "COMPLETADO", "CANCELADO"]

type TipoPedido = {
  id: string
  nombre: string
  prioridadDefault: string
  requiereAprobacion: boolean
}
type Cliente = {
  id: string
  nombre: string
  codigo: string | null
  contratos: { id: string; plan: string; estado: string }[]
}
type Empleado = {
  id: string
  nombre: string
  esTecnico: boolean
}
type InitialData = {
  id: string
  clienteId: string
  contratoId: string | null
  empleadoReceptorId: string
  tipoPedidoId: string
  fechaSolicitud: string
  estado: string
  motivoCancelacion: string | null
}

export default function PedidoForm({
  tipos,
  clientes,
  empleados,
  initialData,
  defaultClienteId,
}: {
  tipos:             TipoPedido[]
  clientes:          Cliente[]
  empleados:         Empleado[]
  initialData?:      InitialData
  defaultClienteId?: string
}) {
  const router    = useRouter()
  const isEditing = !!initialData

  const [isLoading,  setIsLoading]  = useState(false)
  const [error,      setError]      = useState("")
  const [clienteId,  setClienteId]  = useState(initialData?.clienteId || defaultClienteId || "none")
  const [tipoId,     setTipoId]     = useState(initialData?.tipoPedidoId || "none")
  const [estado,     setEstado]     = useState(initialData?.estado || "PENDIENTE")
  const [showMotivo, setShowMotivo] = useState(initialData?.estado === "CANCELADO")

  const clienteSel = clientes.find((c) => c.id === clienteId)
  const tipoSel    = tipos.find((t) => t.id === tipoId)

  const handleEstadoChange = (v: string) => {
    setEstado(v)
    setShowMotivo(v === "CANCELADO")
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    const fd = new FormData(e.currentTarget)
    const result = isEditing
      ? await actualizarPedido(initialData.id, fd)
      : await crearPedido(fd)

    if (result.error) { setError(result.error); setIsLoading(false); return }
    toast.success(isEditing ? "Pedido actualizado" : "Pedido creado correctamente")

    if (!isEditing && result.data?.id) {
      router.push(`/dashboard/pedidos/${result.data.id}`)
    } else if (isEditing) {
      router.push(`/dashboard/pedidos/${initialData.id}`)
    } else {
      router.push("/dashboard/pedidos")
    }
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
        </div>
      )}

      {/* Sección 1: Cliente y Contrato */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">1</span>
          <h3 className="font-semibold text-sm uppercase tracking-wider">Cliente</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Cliente *</Label>
            {isEditing ? (
              <>
                <input type="hidden" name="clienteId" value={initialData.clienteId} />
                <p className="h-9 flex items-center px-3 rounded-md border bg-muted/30 text-sm">
                  {clienteSel?.nombre ?? "—"}
                </p>
              </>
            ) : (
              <Select name="clienteId" value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger className="dark:bg-slate-950">
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none"><span className="text-muted-foreground italic">— Seleccionar —</span></SelectItem>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre}{c.codigo && <span className="text-muted-foreground text-xs ml-1">({c.codigo})</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label>Contrato asociado <span className="text-muted-foreground text-xs">(opcional)</span></Label>
            <Select name="contratoId"
              defaultValue={initialData?.contratoId ?? "none"}
              disabled={isEditing || !clienteSel || clienteSel.contratos.length === 0}>
              <SelectTrigger className="dark:bg-slate-950">
                <SelectValue placeholder={
                  !clienteSel ? "Selecciona un cliente primero"
                  : clienteSel.contratos.length === 0 ? "Sin contratos activos"
                  : "Sin contrato (opcional)"
                } />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin contrato asociado</SelectItem>
                {clienteSel?.contratos.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.plan}
                    <span className="text-muted-foreground text-xs ml-1">({c.estado})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Sección 2: Tipo y Receptor */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">2</span>
          <h3 className="font-semibold text-sm uppercase tracking-wider">Tipo y Asignación</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tipo de Pedido *</Label>
            <Select name="tipoPedidoId" value={tipoId} onValueChange={setTipoId}>
              <SelectTrigger className="dark:bg-slate-950"><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none"><span className="text-muted-foreground italic">— Seleccionar —</span></SelectItem>
                {tipos.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nombre}
                    <span className={`text-xs ml-1 ${PRIORIDAD_COLOR[t.prioridadDefault]}`}>
                      ● {t.prioridadDefault}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {tipoSel?.requiereAprobacion && (
              <p className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                <ShieldCheck className="h-3 w-3" />Este tipo requiere aprobación previa.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Empleado Receptor *</Label>
            <Select name="empleadoReceptorId"
              defaultValue={initialData?.empleadoReceptorId || "none"}>
              <SelectTrigger className="dark:bg-slate-950"><SelectValue placeholder="Seleccionar empleado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none"><span className="text-muted-foreground italic">— Seleccionar —</span></SelectItem>
                {empleados.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.nombre}
                    {e.esTecnico && <span className="text-xs text-blue-500 ml-1">· Técnico</span>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Sección 3: Fecha y Estado */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">3</span>
          <h3 className="font-semibold text-sm uppercase tracking-wider">Fecha y Estado</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fechaSolicitud">Fecha de Solicitud</Label>
            <Input id="fechaSolicitud" name="fechaSolicitud" type="date"
              defaultValue={
                initialData?.fechaSolicitud
                  ? initialData.fechaSolicitud.split("T")[0]
                  : new Date().toISOString().split("T")[0]
              }
              className="dark:bg-slate-950" />
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select name="estado" value={estado} onValueChange={handleEstadoChange}>
              <SelectTrigger className="dark:bg-slate-950"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ESTADOS.map((e) => (
                  <SelectItem key={e} value={e}>{e.replace("_", " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {showMotivo && (
          <div className="space-y-2">
            <Label htmlFor="motivoCancelacion">Motivo de cancelación *</Label>
            <Textarea id="motivoCancelacion" name="motivoCancelacion" rows={2} required
              defaultValue={initialData?.motivoCancelacion ?? ""}
              placeholder="Describe el motivo de la cancelación…"
              className="dark:bg-slate-950 resize-none" />
          </div>
        )}
      </section>

      <div className="flex gap-3 pt-2 border-t border-border">
        <Button type="submit" disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Guardar Cambios" : "Crear Pedido"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
      </div>
    </form>
  )
}
