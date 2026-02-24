"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, Loader2, CheckCircle2, AlertTriangle } from "lucide-react"
import { registrarPago } from "@/server/actions/pagos"
import { formatCurrency, formatDate } from "@/lib/utils"
import { toast } from "sonner"

const TIPOS_PAGO = ["EFECTIVO", "TRANSFERENCIA", "TARJETA", "YAPE", "PLIN"] as const

type Factura = {
  id: string
  periodoFacturado: string
  fechaVencimiento: string
  montoTotal: number
  saldoPendiente: number
}

type Contrato = {
  id: string
  plan: string
  montoActual: number
  facturasPendientes: Factura[]
}

type Cliente = {
  id: string
  nombre: string
  codigo: string | null
  saldoFavor: number
  contratos: Contrato[]
}

type AplicacionFactura = { facturaId: string; monto: number }

export default function PagoForm({
  clientes,
  defaultClienteId,
  defaultContratoId,
}: {
  clientes:           Cliente[]
  defaultClienteId?:  string
  defaultContratoId?: string
}) {
  const router = useRouter()

  const [isLoading,   setIsLoading]   = useState(false)
  const [error,       setError]       = useState("")
  const [clienteId,   setClienteId]   = useState(defaultClienteId  || "none")
  const [contratoId,  setContratoId]  = useState(defaultContratoId || "none")
  const [monto,       setMonto]       = useState("")
  const [aplicaciones, setAplicaciones] = useState<AplicacionFactura[]>([])

  const clienteSel  = clientes.find((c) => c.id === clienteId)
  const contratoSel = clienteSel?.contratos.find((c) => c.id === contratoId)

  // Al cambiar contrato, limpiar aplicaciones y pre-llenar monto
  useEffect(() => {
    setAplicaciones([])
    if (contratoSel) setMonto(contratoSel.montoActual.toString())
  }, [contratoId])

  // Auto-distribuir el monto pagado entre las facturas pendientes (más antigua primero)
  const autoDistribuir = () => {
    const m = parseFloat(monto)
    if (isNaN(m) || m <= 0 || !contratoSel) return
    let restante = m
    const nuevasApp: AplicacionFactura[] = []
    for (const f of contratoSel.facturasPendientes) {
      if (restante <= 0) break
      const aplicar = Math.min(restante, f.saldoPendiente)
      nuevasApp.push({ facturaId: f.id, monto: aplicar })
      restante -= aplicar
    }
    setAplicaciones(nuevasApp)
  }

  const updateAplicacion = (facturaId: string, value: string) => {
    const m = parseFloat(value) || 0
    setAplicaciones((prev) => {
      const exists = prev.find((a) => a.facturaId === facturaId)
      if (exists) return prev.map((a) => a.facturaId === facturaId ? { ...a, monto: m } : a)
      return [...prev, { facturaId, monto: m }]
    })
  }

  const getAplicacion = (facturaId: string) =>
    aplicaciones.find((a) => a.facturaId === facturaId)?.monto || 0

  const totalAplicado = aplicaciones.reduce((s, a) => s + a.monto, 0)
  const montoNum      = parseFloat(monto) || 0
  const sobrante      = montoNum - totalAplicado

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    const fd = new FormData(e.currentTarget)
    fd.set("facturasAplicar", JSON.stringify(aplicaciones.filter((a) => a.monto > 0)))

    const result = await registrarPago(fd)
    if (result.error) { setError(result.error); setIsLoading(false); return }
    toast.success("Pago registrado correctamente")
    router.push(`/dashboard/facturacion/pagos/${result.data?.id}`)
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
          <h3 className="font-semibold text-sm uppercase tracking-wider">Cliente y Contrato</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Cliente *</Label>
            <Select name="clienteId" value={clienteId}
              onValueChange={(v) => { setClienteId(v); setContratoId("none") }}>
              <SelectTrigger className="dark:bg-slate-950">
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none"><span className="text-muted-foreground italic">— Seleccionar —</span></SelectItem>
                {clientes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nombre}
                    {c.codigo && <span className="text-xs text-muted-foreground ml-1">({c.codigo})</span>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {clienteSel && clienteSel.saldoFavor > 0 && (
              <p className="text-xs text-green-600 dark:text-green-400">
                Saldo a favor disponible: {formatCurrency(clienteSel.saldoFavor)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Contrato *</Label>
            <Select name="contratoId" value={contratoId} onValueChange={setContratoId}
              disabled={!clienteSel || clienteSel.contratos.length === 0}>
              <SelectTrigger className="dark:bg-slate-950">
                <SelectValue placeholder={!clienteSel ? "Selecciona un cliente" : "Seleccionar contrato"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none"><span className="text-muted-foreground italic">— Seleccionar —</span></SelectItem>
                {clienteSel?.contratos.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.plan} — {formatCurrency(c.montoActual)}/mes
                    <span className="text-xs text-muted-foreground ml-1">
                      ({c.facturasPendientes.length} factura(s) pendiente(s))
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Sección 2: Monto y Tipo */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">2</span>
          <h3 className="font-semibold text-sm uppercase tracking-wider">Datos del Pago</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fechaPago">Fecha de Pago</Label>
            <Input id="fechaPago" name="fechaPago" type="date"
              defaultValue={new Date().toISOString().split("T")[0]}
              className="dark:bg-slate-950" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="montoPagado">Monto Recibido (S/.) *</Label>
            <Input id="montoPagado" name="montoPagado" type="number"
              min="0.01" step="0.01" required
              value={monto} onChange={(e) => setMonto(e.target.value)}
              className="dark:bg-slate-950 text-lg font-semibold" />
          </div>
          <div className="space-y-2">
            <Label>Tipo de Pago *</Label>
            <Select name="tipoPago" defaultValue="EFECTIVO">
              <SelectTrigger className="dark:bg-slate-950"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIPOS_PAGO.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="masDetalles">Referencia / Detalles adicionales</Label>
          <Textarea id="masDetalles" name="masDetalles" rows={2}
            placeholder="Número de operación, observaciones…"
            className="dark:bg-slate-950 resize-none" />
        </div>
      </section>

      {/* Sección 3: Aplicar a facturas */}
      {contratoSel && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">3</span>
              <h3 className="font-semibold text-sm uppercase tracking-wider">Aplicar a Facturas Pendientes</h3>
            </div>
            {contratoSel.facturasPendientes.length > 0 && (
              <Button type="button" variant="outline" size="sm" onClick={autoDistribuir}>
                Auto-distribuir
              </Button>
            )}
          </div>

          {contratoSel.facturasPendientes.length === 0 ? (
            <div className="flex items-center gap-2 p-3 rounded-md bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 text-sm text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              No hay facturas pendientes para este contrato.
              {montoNum > 0 && " El pago se registrará como saldo a favor."}
            </div>
          ) : (
            <div className="space-y-2">
              {contratoSel.facturasPendientes.map((f) => {
                const aplicado = getAplicacion(f.id)
                const vencida  = new Date(f.fechaVencimiento) < new Date()
                return (
                  <div key={f.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      vencida ? "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/10"
                              : "border-border bg-muted/20"}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">
                          Período: {new Date(f.periodoFacturado + "T12:00:00").toLocaleDateString("es-PE", { year: "numeric", month: "long" })}
                        </p>
                        {vencida && (
                          <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                            <AlertTriangle className="h-3 w-3" />Vencida
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Vence: {formatDate(f.fechaVencimiento)} ·{" "}
                        Saldo pendiente: <span className="font-semibold text-foreground">{formatCurrency(f.saldoPendiente)}</span>
                      </p>
                    </div>
                    <div className="w-28 flex-shrink-0">
                      <Input
                        type="number" min="0" step="0.01"
                        max={f.saldoPendiente}
                        value={aplicado || ""}
                        onChange={(e) => updateAplicacion(f.id, e.target.value)}
                        placeholder="0.00"
                        className="dark:bg-slate-950 text-right text-sm h-8" />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Resumen de distribución */}
          {montoNum > 0 && (
            <div className="p-3 rounded-md border border-border bg-muted/30 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monto recibido:</span>
                <span className="font-semibold">{formatCurrency(montoNum)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Aplicado a facturas:</span>
                <span className="font-semibold text-blue-600">{formatCurrency(totalAplicado)}</span>
              </div>
              {sobrante > 0.005 && (
                <div className="flex justify-between border-t border-border pt-1.5">
                  <span className="text-muted-foreground">Saldo a favor:</span>
                  <span className="font-bold text-green-600">{formatCurrency(sobrante)}</span>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      <div className="flex gap-3 pt-2 border-t border-border">
        <Button type="submit"
          disabled={isLoading || clienteId === "none" || contratoId === "none"}
          className="bg-blue-600 hover:bg-blue-700 text-white">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Registrar Pago
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
      </div>
    </form>
  )
}
