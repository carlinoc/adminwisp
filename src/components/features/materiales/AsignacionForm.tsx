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
import { crearAsignacion } from "@/server/actions/asignaciones"
import { AlertCircle, Loader2, Package2 } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

type Empleado = { id: string; personaId: string; nombres: string; apellidos: string | null; rol: string }
type MaterialStock = { id: string; nombre: string; categoria: string; unidadMedida: string; stock: number; requiereDevolucion: boolean }

export default function AsignacionForm({
  tecnicos,
  personal,
  materiales,
  defaultMaterialId,
}: {
  tecnicos:  Empleado[]
  personal:  Empleado[]
  materiales: MaterialStock[]
  defaultMaterialId?: string
}) {
  const router = useRouter()
  const [isLoading,   setIsLoading]   = useState(false)
  const [error,       setError]       = useState("")
  const [materialSel, setMaterialSel] = useState(defaultMaterialId || "none")
  const [cantidad,    setCantidad]    = useState("")

  const matActual = materiales.find((m) => m.id === materialSel)
  const cantNum   = parseInt(cantidad, 10)
  const sinStock  = matActual && !isNaN(cantNum) && cantNum > matActual.stock

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    const fd = new FormData(e.currentTarget)
    const result = await crearAsignacion(fd)
    if (result.error) { setError(result.error); setIsLoading(false); return }
    toast.success("Asignación registrada correctamente")
    router.push("/dashboard/materiales/asignaciones")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
        </div>
      )}

      {/* Material */}
      <section className="space-y-3">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Material a Asignar</h3>
        <div className="space-y-2">
          <Label>Material *</Label>
          <Select name="materialId" value={materialSel} onValueChange={setMaterialSel}>
            <SelectTrigger className="dark:bg-slate-950"><SelectValue placeholder="Seleccionar material" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none"><span className="text-muted-foreground italic">— Seleccionar —</span></SelectItem>
              {materiales.map((m) => (
                <SelectItem key={m.id} value={m.id} disabled={m.stock === 0}>
                  <span className="flex items-center gap-2">
                    <Package2 className="h-3.5 w-3.5" />
                    {m.nombre}
                    <span className={`text-xs ml-1 ${m.stock === 0 ? "text-red-500" : "text-muted-foreground"}`}>
                      (stock: {m.stock})
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {matActual && (
          <div className="flex gap-3 flex-wrap">
            <Badge variant="secondary">{matActual.categoria}</Badge>
            <Badge variant="secondary">{matActual.unidadMedida}</Badge>
            {matActual.requiereDevolucion && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">Requiere devolución</Badge>
            )}
            <span className={`text-sm font-medium ${matActual.stock === 0 ? "text-red-600" : "text-green-600"}`}>
              Stock disponible: {matActual.stock}
            </span>
          </div>
        )}
      </section>

      {/* Cantidad y serial */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cantidad">Cantidad *</Label>
          <Input
            id="cantidad" name="cantidad" type="number" min="1" required
            value={cantidad} onChange={(e) => setCantidad(e.target.value)}
            placeholder="1" className="dark:bg-slate-950"
          />
          {sinStock && (
            <p className="text-xs text-red-600">⚠ Supera el stock disponible ({matActual?.stock})</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="serial">N° de Serie / Serial <span className="text-muted-foreground">(opcional)</span></Label>
          <Input id="serial" name="serial" placeholder="SN-12345678" className="dark:bg-slate-950" />
          <p className="text-xs text-muted-foreground">Para equipos individuales con serial único</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="fechaAsignacion">Fecha de Asignación</Label>
          <Input id="fechaAsignacion" name="fechaAsignacion" type="date"
            defaultValue={new Date().toISOString().split("T")[0]} className="dark:bg-slate-950" />
        </div>
      </div>

      {/* Personal */}
      <section className="space-y-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Personal Involucrado</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Técnico Receptor *</Label>
            <Select name="tecnicoId" defaultValue="none">
              <SelectTrigger className="dark:bg-slate-950"><SelectValue placeholder="Seleccionar técnico" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none"><span className="text-muted-foreground italic">— Seleccionar —</span></SelectItem>
                {tecnicos.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nombres} {t.apellidos ?? ""} <span className="text-muted-foreground text-xs">({t.rol})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Empleado que recibe el material</p>
          </div>
          <div className="space-y-2">
            <Label>Entregado por *</Label>
            <Select name="personalEntregaId" defaultValue="none">
              <SelectTrigger className="dark:bg-slate-950"><SelectValue placeholder="Seleccionar quien entrega" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none"><span className="text-muted-foreground italic">— Seleccionar —</span></SelectItem>
                {personal.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nombres} {p.apellidos ?? ""} <span className="text-muted-foreground text-xs">({p.rol})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Quien entrega desde el almacén</p>
          </div>
        </div>
      </section>

      <div className="flex gap-3 pt-2 border-t border-border">
        <Button type="submit" disabled={isLoading || !!sinStock}
          className="bg-blue-600 hover:bg-blue-700 text-white">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Registrar Asignación
        </Button>
        <Button type="button" variant="outline"
          onClick={() => router.push("/dashboard/materiales/asignaciones")}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
