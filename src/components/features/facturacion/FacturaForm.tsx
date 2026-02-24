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
import { AlertCircle, Loader2, ArrowDown, ArrowUp } from "lucide-react"
import { crearFactura, actualizarFactura } from "@/server/actions/facturas"
import { formatCurrency } from "@/lib/utils"
import { toast } from "sonner"

type Contrato = {
  id: string
  plan: string
  velocidades: string
  montoActual: number
  cliente: string
  codigoCliente: string | null
}

type InitialData = {
  id: string
  contratoId: string
  periodoFacturado: string // YYYY-MM
  fechaVencimiento: string // YYYY-MM-DD
  montoTotal: number
}

export default function FacturaForm({
  contratos,
  initialData,
  defaultContratoId,
}: {
  contratos:         Contrato[]
  initialData?:      InitialData
  defaultContratoId?: string
}) {
  const router    = useRouter()
  const isEditing = !!initialData

  const [isLoading, setIsLoading] = useState(false)
  const [error,     setError]     = useState("")
  const [contratoId, setContratoId] = useState(
    initialData?.contratoId || defaultContratoId || "none"
  )
  const [monto, setMonto] = useState(initialData?.montoTotal?.toString() || "")

  const contratoSel = contratos.find((c) => c.id === contratoId)

  const handleContratoChange = (id: string) => {
    setContratoId(id)
    const c = contratos.find((ct) => ct.id === id)
    if (c) setMonto(c.montoActual.toString())
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    const fd = new FormData(e.currentTarget)
    const result = isEditing
      ? await actualizarFactura(initialData.id, fd)
      : await crearFactura(fd)

    if (result.error) { setError(result.error); setIsLoading(false); return }
    toast.success(isEditing ? "Factura actualizada" : "Factura creada correctamente")
    router.push("/dashboard/facturacion/facturas")
    router.refresh()
  }

  // Calcular vencimiento sugerido (30 días después del inicio del período)
  const getSuggestedVencimiento = () => {
    const periodo = (document.querySelector("input[name='periodoFacturado']") as HTMLInputElement)?.value
    if (!periodo) return ""
    const [y, m] = periodo.split("-").map(Number)
    const venc = new Date(y, m, 0) // último día del mes
    return venc.toISOString().split("T")[0]
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
        </div>
      )}

      {/* Contrato */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">1</span>
          <h3 className="font-semibold text-sm uppercase tracking-wider">Contrato</h3>
        </div>
        {isEditing ? (
          <>
            <input type="hidden" name="contratoId" value={initialData.contratoId} />
            <div className="p-3 rounded-md border bg-muted/30 text-sm space-y-1">
              <p className="font-medium">{contratoSel?.cliente ?? "—"}</p>
              <p className="text-muted-foreground">{contratoSel?.plan}</p>
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <Label>Contrato *</Label>
            <Select name="contratoId" value={contratoId} onValueChange={handleContratoChange}>
              <SelectTrigger className="dark:bg-slate-950">
                <SelectValue placeholder="Seleccionar contrato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="text-muted-foreground italic">— Seleccionar —</span>
                </SelectItem>
                {contratos.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="font-medium">{c.cliente}</span>
                    <span className="text-muted-foreground text-xs ml-2">
                      {c.plan} · {formatCurrency(c.montoActual)}/mes
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Preview del contrato */}
        {contratoSel && (
          <div className="p-3 rounded-lg bg-muted/30 border text-sm flex items-center gap-4">
            <div className="flex-1">
              <p className="font-medium">{contratoSel.plan}</p>
              <div className="flex gap-3 mt-0.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-0.5">
                  <ArrowDown className="h-3 w-3 text-green-500" />
                  {contratoSel.velocidades.split("/")[0]}
                </span>
                <span className="flex items-center gap-0.5">
                  <ArrowUp className="h-3 w-3 text-blue-500" />
                  {contratoSel.velocidades.split("/")[1]}
                </span>
              </div>
            </div>
            <p className="font-bold text-green-600">{formatCurrency(contratoSel.montoActual)}/mes</p>
          </div>
        )}
      </section>

      {/* Período y Fechas */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">2</span>
          <h3 className="font-semibold text-sm uppercase tracking-wider">Período y Vencimiento</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="periodoFacturado">Período Facturado *</Label>
            <Input id="periodoFacturado" name="periodoFacturado" type="month" required
              disabled={isEditing}
              defaultValue={initialData?.periodoFacturado ?? ""}
              className="dark:bg-slate-950" />
            {isEditing && <p className="text-xs text-muted-foreground">El período no puede modificarse.</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="fechaVencimiento">Fecha de Vencimiento *</Label>
            <Input id="fechaVencimiento" name="fechaVencimiento" type="date" required
              defaultValue={initialData?.fechaVencimiento ?? ""}
              className="dark:bg-slate-950" />
          </div>
        </div>
      </section>

      {/* Monto */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">3</span>
          <h3 className="font-semibold text-sm uppercase tracking-wider">Monto</h3>
        </div>
        <div className="space-y-2">
          <Label htmlFor="montoTotal">Monto Total (S/.) *</Label>
          <Input id="montoTotal" name="montoTotal" type="number"
            min="0.01" step="0.01" required
            value={monto} onChange={(e) => setMonto(e.target.value)}
            className="dark:bg-slate-950 text-lg font-semibold" />
          <p className="text-xs text-muted-foreground">
            Por defecto usa el monto del contrato. Puede ajustarse por descuentos o cargos extra.
          </p>
        </div>
        {monto && !isNaN(parseFloat(monto)) && (
          <div className="p-3 rounded-md bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total a cobrar:</span>
            <span className="text-xl font-bold text-green-600">{formatCurrency(parseFloat(monto))}</span>
          </div>
        )}
      </section>

      <div className="flex gap-3 pt-2 border-t border-border">
        <Button type="submit" disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Guardar Cambios" : "Crear Factura"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
      </div>
    </form>
  )
}
