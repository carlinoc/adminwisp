"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertCircle, Loader2, TrendingUp, TrendingDown, RefreshCw } from "lucide-react"
import { ajustarStock } from "@/server/actions/inventario"
import { toast } from "sonner"

type Props = {
  inventarioId: string
  materialId: string
  materialNombre: string
  stockActual: number
  puntoReorden: number
  ubicacion: string | null
}

export default function AjusteStockModal({
  inventarioId, materialId, materialNombre,
  stockActual, puntoReorden, ubicacion,
}: Props) {
  const [open,      setOpen]      = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error,     setError]     = useState("")
  const [tipo,      setTipo]      = useState("ENTRADA")
  const [cantidad,  setCantidad]  = useState("")

  // Preview del nuevo stock
  const cantNum    = parseInt(cantidad, 10)
  const preview    = !isNaN(cantNum) && cantNum > 0
    ? tipo === "ENTRADA"      ? stockActual + cantNum
    : tipo === "SALIDA"       ? stockActual - cantNum
    : cantNum
    : null

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    const fd = new FormData(e.currentTarget)
    const result = await ajustarStock(inventarioId, materialId, fd)
    setIsLoading(false)
    if (result.error) { setError(result.error); return }
    toast.success(`Stock actualizado correctamente`)
    setOpen(false)
    setCantidad("")
    setTipo("ENTRADA")
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
        <RefreshCw className="h-4 w-4 mr-2" />
        Ajustar Stock
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Ajustar Stock — {materialNombre}</AlertDialogTitle>
          </AlertDialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {error && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
              </div>
            )}

            {/* Stock actual */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border">
              <span className="text-sm text-muted-foreground">Stock actual</span>
              <span className="text-2xl font-bold">{stockActual}</span>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Ajuste</Label>
              <Select name="tipo" value={tipo} onValueChange={setTipo}>
                <SelectTrigger className="dark:bg-slate-950"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ENTRADA">
                    <span className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-green-600" />Entrada (suma)</span>
                  </SelectItem>
                  <SelectItem value="SALIDA">
                    <span className="flex items-center gap-2"><TrendingDown className="h-4 w-4 text-red-600" />Salida (resta)</span>
                  </SelectItem>
                  <SelectItem value="AJUSTE_MANUAL">
                    <span className="flex items-center gap-2"><RefreshCw className="h-4 w-4 text-blue-600" />Ajuste Manual (fija valor)</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cantidad">Cantidad *</Label>
              <Input
                id="cantidad" name="cantidad" type="number" min="1" required
                value={cantidad} onChange={(e) => setCantidad(e.target.value)}
                placeholder="0" className="dark:bg-slate-950" />
            </div>

            {/* Preview */}
            {preview !== null && (
              <div className={`flex items-center justify-between p-3 rounded-lg border ${
                preview < 0 ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                : preview <= puntoReorden ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800"
                : "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
              }`}>
                <span className="text-sm font-medium">Nuevo stock:</span>
                <span className={`text-2xl font-bold ${
                  preview < 0 ? "text-red-600"
                  : preview <= puntoReorden ? "text-yellow-600"
                  : "text-green-600"
                }`}>{preview < 0 ? "⚠ Insuficiente" : preview}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="puntoReorden">Punto de Reorden</Label>
              <Input id="puntoReorden" name="puntoReorden" type="number" min="0"
                defaultValue={puntoReorden} className="dark:bg-slate-950" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ubicacionAlmacen">Ubicación en Almacén</Label>
              <Input id="ubicacionAlmacen" name="ubicacionAlmacen"
                defaultValue={ubicacion ?? ""} placeholder="Estante A-1" className="dark:bg-slate-950" />
            </div>

            <AlertDialogFooter className="pt-2">
              <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
              <Button type="submit" disabled={isLoading || preview === null || preview < 0}
                className="bg-blue-600 hover:bg-blue-700 text-white">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar Ajuste
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
