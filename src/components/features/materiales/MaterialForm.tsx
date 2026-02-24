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
import { crearMaterial, actualizarMaterial } from "@/server/actions/materiales"
import { AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"

const CATEGORIAS = ["Equipos", "Cables", "Conectores", "Herramientas", "Accesorios", "Consumibles", "Otros"]
const UNIDADES   = ["Unidad", "Metros", "Rollo", "Caja", "Kit", "Par", "Litro", "Kilogramo"]

type InitialData = {
  id: string
  nombre: string
  descripcion: string | null
  marca: string | null
  modelo: string | null
  unidadMedida: string
  categoria: string
  requiereDevolucion: boolean
}

export default function MaterialForm({ initialData }: { initialData?: InitialData }) {
  const router = useRouter()
  const isEditing = !!initialData
  const [isLoading, setIsLoading] = useState(false)
  const [error,     setError]     = useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    const fd = new FormData(e.currentTarget)
    const result = isEditing
      ? await actualizarMaterial(initialData.id, fd)
      : await crearMaterial(fd)

    if (result.error) { setError(result.error); setIsLoading(false); return }
    toast.success(isEditing ? "Material actualizado" : "Material creado correctamente")
    router.push("/dashboard/materiales/lista")
    router.refresh()
  }

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input id="nombre" name="nombre" required defaultValue={initialData?.nombre}
              placeholder="ONT Huawei HG8245H" className="dark:bg-slate-950" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="marca">Marca</Label>
            <Input id="marca" name="marca" defaultValue={initialData?.marca ?? ""}
              placeholder="Huawei" className="dark:bg-slate-950" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="modelo">Modelo</Label>
            <Input id="modelo" name="modelo" defaultValue={initialData?.modelo ?? ""}
              placeholder="HG8245H" className="dark:bg-slate-950" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Input id="descripcion" name="descripcion" defaultValue={initialData?.descripcion ?? ""}
              placeholder="Descripción detallada del material..." className="dark:bg-slate-950" />
          </div>
        </div>
      </section>

      {/* Clasificación */}
      <section className="space-y-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Clasificación</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Categoría *</Label>
            <Select name="categoria" defaultValue={initialData?.categoria || "none"}>
              <SelectTrigger className="dark:bg-slate-950"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none"><span className="text-muted-foreground italic">— Seleccionar —</span></SelectItem>
                {CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Unidad de Medida *</Label>
            <Select name="unidadMedida" defaultValue={initialData?.unidadMedida || "Unidad"}>
              <SelectTrigger className="dark:bg-slate-950"><SelectValue /></SelectTrigger>
              <SelectContent>
                {UNIDADES.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>¿Requiere Devolución?</Label>
            <Select name="requiereDevolucion" defaultValue={initialData?.requiereDevolucion ? "true" : "false"}>
              <SelectTrigger className="dark:bg-slate-950"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="false">No (consumible)</SelectItem>
                <SelectItem value="true">Sí (debe devolver)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Stock inicial — solo en creación */}
      {!isEditing && (
        <section className="space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Stock Inicial en Almacén</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cantidadInicial">Cantidad Inicial</Label>
              <Input id="cantidadInicial" name="cantidadInicial" type="number" min="0"
                defaultValue="0" className="dark:bg-slate-950" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="puntoReorden">Punto de Reorden</Label>
              <Input id="puntoReorden" name="puntoReorden" type="number" min="0"
                defaultValue="0" className="dark:bg-slate-950" />
              <p className="text-xs text-muted-foreground">Stock mínimo antes de reponer</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ubicacionAlmacen">Ubicación en Almacén</Label>
              <Input id="ubicacionAlmacen" name="ubicacionAlmacen"
                placeholder="Estante A-1" className="dark:bg-slate-950" />
            </div>
          </div>
        </section>
      )}

      <div className="flex gap-3 pt-2 border-t border-border">
        <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Guardar Cambios" : "Crear Material"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/dashboard/materiales/lista")}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
