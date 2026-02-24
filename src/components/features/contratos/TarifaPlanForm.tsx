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
import { AlertCircle, Loader2, Tv, Zap } from "lucide-react"
import { crearTarifaPlan, actualizarTarifaPlan } from "@/server/actions/tarifaPlan"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/utils"

type InitialData = {
  id: string
  nombrePlan: string
  velocidadDescarga: string
  velocidadSubida: string
  tarifaMensual: number
  comisionVenta: number
  incluyeTv: boolean
  nroTvsBase: number
}

export default function TarifaPlanForm({ initialData }: { initialData?: InitialData }) {
  const router    = useRouter()
  const isEditing = !!initialData
  const [isLoading, setIsLoading] = useState(false)
  const [error,     setError]     = useState("")
  const [incluyeTv, setIncluyeTv] = useState(initialData?.incluyeTv ?? false)
  const [tarifa,    setTarifa]    = useState(initialData?.tarifaMensual?.toString() ?? "")
  const [comision,  setComision]  = useState(initialData?.comisionVenta?.toString()  ?? "0")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    const fd = new FormData(e.currentTarget)
    const result = isEditing
      ? await actualizarTarifaPlan(initialData.id, fd)
      : await crearTarifaPlan(fd)

    if (result.error) { setError(result.error); setIsLoading(false); return }
    toast.success(isEditing ? "Plan actualizado" : "Plan creado correctamente")
    router.push("/dashboard/contratos/planes")
    router.refresh()
  }

  const tarifaNum  = parseFloat(tarifa)
  const comisionNum = parseFloat(comision)
  const pctComision = !isNaN(tarifaNum) && !isNaN(comisionNum) && tarifaNum > 0
    ? ((comisionNum / tarifaNum) * 100).toFixed(1)
    : null

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
        </div>
      )}

      {/* Identificación */}
      <section className="space-y-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Identificación</h3>
        <div className="space-y-2">
          <Label htmlFor="nombrePlan">Nombre del Plan *</Label>
          <Input id="nombrePlan" name="nombrePlan" required
            defaultValue={initialData?.nombrePlan}
            placeholder="Plan Básico 20 Mbps" className="dark:bg-slate-950" />
        </div>
      </section>

      {/* Velocidades */}
      <section className="space-y-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Zap className="h-4 w-4" />Velocidades
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="velocidadDescarga">Descarga *</Label>
            <Input id="velocidadDescarga" name="velocidadDescarga" required
              defaultValue={initialData?.velocidadDescarga}
              placeholder="20 Mbps" className="dark:bg-slate-950" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="velocidadSubida">Subida *</Label>
            <Input id="velocidadSubida" name="velocidadSubida" required
              defaultValue={initialData?.velocidadSubida}
              placeholder="10 Mbps" className="dark:bg-slate-950" />
          </div>
        </div>
      </section>

      {/* Precios */}
      <section className="space-y-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Precios</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tarifaMensual">Tarifa Mensual (S/.) *</Label>
            <Input id="tarifaMensual" name="tarifaMensual" type="number"
              min="0.01" step="0.01" required
              value={tarifa} onChange={(e) => setTarifa(e.target.value)}
              placeholder="50.00" className="dark:bg-slate-950" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="comisionVenta">Comisión por Venta (S/.)</Label>
            <Input id="comisionVenta" name="comisionVenta" type="number"
              min="0" step="0.01"
              value={comision} onChange={(e) => setComision(e.target.value)}
              placeholder="10.00" className="dark:bg-slate-950" />
            {pctComision && (
              <p className="text-xs text-muted-foreground">{pctComision}% de la tarifa mensual</p>
            )}
          </div>
        </div>
        {!isNaN(tarifaNum) && tarifaNum > 0 && (
          <div className="p-3 rounded-md bg-muted/30 border text-sm flex items-center justify-between">
            <span className="text-muted-foreground">Precio mensual al cliente:</span>
            <span className="text-xl font-bold text-green-600">{formatCurrency(tarifaNum)}</span>
          </div>
        )}
      </section>

      {/* TV */}
      <section className="space-y-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Tv className="h-4 w-4" />Televisión
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>¿Incluye TV?</Label>
            <Select name="incluyeTv"
              value={incluyeTv ? "true" : "false"}
              onValueChange={(v) => setIncluyeTv(v === "true")}>
              <SelectTrigger className="dark:bg-slate-950"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="false">No incluye TV</SelectItem>
                <SelectItem value="true">Sí incluye TV</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {incluyeTv && (
            <div className="space-y-2">
              <Label htmlFor="nroTvsBase">Cantidad de TVs base</Label>
              <Input id="nroTvsBase" name="nroTvsBase" type="number" min="1" max="10"
                defaultValue={initialData?.nroTvsBase ?? 1}
                className="dark:bg-slate-950" />
            </div>
          )}
        </div>
      </section>

      <div className="flex gap-3 pt-2 border-t border-border">
        <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Guardar Cambios" : "Crear Plan"}
        </Button>
        <Button type="button" variant="outline"
          onClick={() => router.push("/dashboard/contratos/planes")}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
