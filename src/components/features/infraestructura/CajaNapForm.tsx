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
import { crearCajaNap, actualizarCajaNap } from "@/server/actions/cajaNap"
import { AlertCircle, Loader2, Info } from "lucide-react"
import { toast } from "sonner"

const SPLITTERS = ["1:2", "1:4", "1:8", "1:16", "1:32", "1:64"]

type Zona = { id: string; codigo: string; nombre: string; cabecera: { nombre: string } }
type PuertoLibre = {
  id: string; numeroPuerto: number
  cajaNap: { direccion: string | null; zona: { nombre: string } }
}

type InitialData = {
  id: string
  zonaId: string
  splitterInstalado: string | null
  capacidadPuertosTotal: number
  direccion: string | null
  latitud: number | null
  longitud: number | null
  puertoAlimentadorId: string | null
}

export default function CajaNapForm({
  zonas,
  puertosLibres,
  initialData,
}: {
  zonas: Zona[]
  puertosLibres: PuertoLibre[]
  initialData?: InitialData
}) {
  const router = useRouter()
  const isEditing = !!initialData
  const [isLoading, setIsLoading] = useState(false)
  const [error,     setError]     = useState("")
  const [capacidad, setCapacidad] = useState(initialData?.capacidadPuertosTotal?.toString() ?? "8")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    const fd = new FormData(e.currentTarget)
    const result = isEditing
      ? await actualizarCajaNap(initialData.id, fd)
      : await crearCajaNap(fd)

    if (result.error) { setError(result.error); setIsLoading(false); return }
    toast.success(isEditing ? "Caja NAP actualizada" : "Caja NAP creada con sus puertos")
    router.push(isEditing
      ? `/dashboard/infraestructura/cajas/${initialData.id}`
      : "/dashboard/infraestructura/cajas")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
        </div>
      )}

      {/* Ubicación en red */}
      <section className="space-y-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Ubicación en la Red</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Zona *</Label>
            <Select name="zonaId" defaultValue={initialData?.zonaId || "none"}>
              <SelectTrigger className="dark:bg-slate-950"><SelectValue placeholder="Seleccionar zona" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none"><span className="text-muted-foreground italic">— Seleccionar —</span></SelectItem>
                {zonas.map((z) => (
                  <SelectItem key={z.id} value={z.id}>
                    [{z.codigo}] {z.nombre}
                    <span className="text-muted-foreground text-xs ml-1">— {z.cabecera.nombre}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Puerto Alimentador <span className="text-muted-foreground text-xs">(opcional)</span></Label>
            <Select
              name="puertoAlimentadorId"
              defaultValue={initialData?.puertoAlimentadorId || "none"}
              disabled={isEditing}
            >
              <SelectTrigger className="dark:bg-slate-950"><SelectValue placeholder="Ninguno (caja raíz)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ninguno — caja raíz / principal</SelectItem>
                {puertosLibres.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    Puerto {p.numeroPuerto} — {p.cajaNap.zona.nombre} · {p.cajaNap.direccion ?? "sin dirección"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isEditing && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3" />El puerto alimentador no se puede cambiar después de crear la caja.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Características técnicas */}
      <section className="space-y-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Características Técnicas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Splitter Instalado</Label>
            <Select name="splitterInstalado" defaultValue={initialData?.splitterInstalado || "1:8"}>
              <SelectTrigger className="dark:bg-slate-950"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none_str">Sin splitter</SelectItem>
                {SPLITTERS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacidadPuertosTotal">
              Capacidad de Puertos *
              {!isEditing && <span className="text-muted-foreground text-xs ml-1">(se crearán automáticamente)</span>}
            </Label>
            <Input
              id="capacidadPuertosTotal"
              name="capacidadPuertosTotal"
              type="number" min="1" max="64"
              value={capacidad}
              onChange={(e) => setCapacidad(e.target.value)}
              disabled={isEditing}
              className="dark:bg-slate-950"
            />
            {isEditing && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3" />Para ampliar puertos usa el botón "Agregar puertos" en el detalle.
              </p>
            )}
            {!isEditing && capacidad && (
              <p className="text-xs text-green-600 dark:text-green-400">
                Se crearán {capacidad} puertos numerados del 1 al {capacidad}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Ubicación física */}
      <section className="space-y-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Ubicación Física</h3>
        <div className="space-y-2">
          <Label htmlFor="direccion">Dirección / Referencia</Label>
          <Input id="direccion" name="direccion"
            defaultValue={initialData?.direccion ?? ""}
            placeholder="Esquina Av. El Sol con Av. Tullumayo, poste #12"
            className="dark:bg-slate-950" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="latitud" className="text-xs text-muted-foreground">Latitud GPS</Label>
            <Input id="latitud" name="latitud" type="number" step="any"
              defaultValue={initialData?.latitud ?? ""}
              placeholder="-13.5239" className="dark:bg-slate-950" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="longitud" className="text-xs text-muted-foreground">Longitud GPS</Label>
            <Input id="longitud" name="longitud" type="number" step="any"
              defaultValue={initialData?.longitud ?? ""}
              placeholder="-71.9675" className="dark:bg-slate-950" />
          </div>
        </div>
      </section>

      <div className="flex gap-3 pt-2 border-t border-border">
        <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Guardar Cambios" : "Crear Caja NAP"}
        </Button>
        <Button type="button" variant="outline"
          onClick={() => router.push("/dashboard/infraestructura/cajas")}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
