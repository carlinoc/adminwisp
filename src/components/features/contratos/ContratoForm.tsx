"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { AlertCircle, Loader2, ArrowDown, ArrowUp, Tv } from "lucide-react"
import { crearContrato, actualizarContrato } from "@/server/actions/contratos"
import { formatCurrency } from "@/lib/utils"
import { toast } from "sonner"

type Plan = {
  id: string; nombrePlan: string
  velocidadDescarga: string; velocidadSubida: string
  tarifaMensual: number; comisionVenta: number
  incluyeTv: boolean; nroTvsBase: number
}
type Cliente = {
  id: string; nombre: string; codigo: string | null
  ubicaciones: { id: string; direccion: string }[]
}
type InitialData = {
  id: string
  clienteId: string
  tarifaPlanId: string
  ubicacionInstalacionId: string
  fechaInicioServicio: string | null
  cicloFacturacion: number
  montoActual: number
  estado: string
}

export default function ContratoForm({
  planes,
  clientes,
  initialData,
  defaultClienteId,
}: {
  planes: Plan[]
  clientes: Cliente[]
  initialData?: InitialData
  defaultClienteId?: string
}) {
  const router    = useRouter()
  const isEditing = !!initialData

  const [isLoading,   setIsLoading]   = useState(false)
  const [error,       setError]       = useState("")
  const [planId,      setPlanId]      = useState(initialData?.tarifaPlanId  || "none")
  const [clienteId,   setClienteId]   = useState(initialData?.clienteId     || defaultClienteId || "none")
  const [monto,       setMonto]       = useState(initialData?.montoActual?.toString() || "")

  const planSel    = planes.find((p) => p.id === planId)
  const clienteSel = clientes.find((c) => c.id === clienteId)

  // Al seleccionar plan, pre-rellenar el monto con la tarifa
  const handlePlanChange = (id: string) => {
    setPlanId(id)
    const p = planes.find((pl) => pl.id === id)
    if (p) setMonto(p.tarifaMensual.toString())
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    const fd = new FormData(e.currentTarget)
    const result = isEditing
      ? await actualizarContrato(initialData.id, fd)
      : await crearContrato(fd)

    if (result.error) { setError(result.error); setIsLoading(false); return }
    toast.success(isEditing ? "Contrato actualizado" : "Contrato creado")
    if (isEditing) {
      router.push(`/dashboard/contratos/${initialData.id}`)
    } else if (clienteId && clienteId !== "none") {
      router.push(`/dashboard/clientes/${clienteId}`)
    } else {
      router.push("/dashboard/contratos")
    }
    router.refresh()
  }

  const ESTADOS = ["PENDIENTE", "ACTIVO", "SUSPENDIDO", "CANCELADO"]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
        </div>
      )}

      {/* Sección 1: Cliente */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">1</span>
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
                <p className="text-xs text-muted-foreground">El cliente no puede cambiar.</p>
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
                      {c.nombre}
                      {c.codigo && <span className="text-muted-foreground text-xs ml-1">({c.codigo})</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label>Ubicación de Instalación *</Label>
            <Select name="ubicacionInstalacionId"
              defaultValue={initialData?.ubicacionInstalacionId || "none"}
              disabled={isEditing || (!clienteSel || clienteSel.ubicaciones.length === 0)}>
              <SelectTrigger className="dark:bg-slate-950">
                <SelectValue placeholder={
                  !clienteSel ? "Primero selecciona un cliente"
                  : clienteSel.ubicaciones.length === 0 ? "Sin ubicaciones"
                  : "Seleccionar ubicación"
                } />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none"><span className="text-muted-foreground italic">— Seleccionar —</span></SelectItem>
                {clienteSel?.ubicaciones.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.direccion}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isEditing && (
              <p className="text-xs text-muted-foreground">La ubicación no puede cambiar.</p>
            )}
            {!isEditing && clienteSel && clienteSel.ubicaciones.length === 0 && (
              <p className="text-xs text-red-600">Este cliente no tiene ubicaciones de instalación.</p>
            )}
          </div>
        </div>
      </section>

      {/* Sección 2: Plan */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">2</span>
          <h3 className="font-semibold text-sm uppercase tracking-wider">Plan de Tarifa</h3>
        </div>
        <div className="space-y-2">
          <Label>Plan *</Label>
          <Select name="tarifaPlanId" value={planId} onValueChange={handlePlanChange}>
            <SelectTrigger className="dark:bg-slate-950"><SelectValue placeholder="Seleccionar plan" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none"><span className="text-muted-foreground italic">— Seleccionar —</span></SelectItem>
              {planes.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nombrePlan} — {formatCurrency(p.tarifaMensual)}/mes
                  <span className="text-muted-foreground text-xs ml-1">
                    ({p.velocidadDescarga}↓/{p.velocidadSubida}↑)
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Preview del plan */}
        {planSel && (
          <div className="p-3 rounded-lg bg-muted/30 border border-border text-sm space-y-2">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                <ArrowDown className="h-3.5 w-3.5" />{planSel.velocidadDescarga}
              </span>
              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                <ArrowUp className="h-3.5 w-3.5" />{planSel.velocidadSubida}
              </span>
              {planSel.incluyeTv && (
                <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                  <Tv className="h-3.5 w-3.5" />{planSel.nroTvsBase} TV{planSel.nroTvsBase !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Tarifa base: <strong className="text-foreground">{formatCurrency(planSel.tarifaMensual)}</strong></span>
              <span>Comisión vendedor: <strong className="text-foreground">{formatCurrency(planSel.comisionVenta)}</strong></span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="montoActual">Monto a Cobrar (S/.) *</Label>
            <Input id="montoActual" name="montoActual" type="number"
              min="0.01" step="0.01" required
              value={monto} onChange={(e) => setMonto(e.target.value)}
              placeholder="50.00" className="dark:bg-slate-950" />
            <p className="text-xs text-muted-foreground">Puede diferir de la tarifa base (descuentos, etc.)</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cicloFacturacion">Día de Corte (ciclo de facturación)</Label>
            <Input id="cicloFacturacion" name="cicloFacturacion" type="number"
              min="1" max="28"
              defaultValue={initialData?.cicloFacturacion ?? 1}
              className="dark:bg-slate-950" />
            <p className="text-xs text-muted-foreground">Día del mes (1–28)</p>
          </div>
        </div>
      </section>

      {/* Sección 3: Fechas y Estado */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">3</span>
          <h3 className="font-semibold text-sm uppercase tracking-wider">Fechas y Estado</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="fechaContrato">Fecha del Contrato</Label>
              <Input id="fechaContrato" name="fechaContrato" type="date"
                defaultValue={new Date().toISOString().split("T")[0]}
                className="dark:bg-slate-950" />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="fechaInicioServicio">Inicio de Servicio</Label>
            <Input id="fechaInicioServicio" name="fechaInicioServicio" type="date"
              defaultValue={initialData?.fechaInicioServicio ?? ""}
              className="dark:bg-slate-950" />
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select name="estado" defaultValue={initialData?.estado || "PENDIENTE"}>
              <SelectTrigger className="dark:bg-slate-950"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ESTADOS.map((e) => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <div className="flex gap-3 pt-2 border-t border-border">
        <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Guardar Cambios" : "Crear Contrato"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
      </div>
    </form>
  )
}
