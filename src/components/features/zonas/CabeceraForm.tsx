"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { crearCabecera, actualizarCabecera } from "@/server/actions/zonas"
import { AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"

type Persona = {
  id: string
  nombres: string
  apellidos: string | null
  dni: string | null
}

type InitialData = {
  id: string
  codigo: string
  nombre: string
  ubicacion: string | null
  latitud: number | null
  longitud: number | null
  arrendadorId: string
}

export default function CabeceraForm({
  personas,
  initialData,
}: {
  personas: Persona[]
  initialData?: InitialData
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const isEditing = !!initialData

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)

    try {
      const result = isEditing
        ? await actualizarCabecera(initialData.id, formData)
        : await crearCabecera(formData)

      if (result.error) {
        setError(result.error)
        setIsLoading(false)
        return
      }

      toast.success(isEditing ? "Cabecera actualizada" : "Cabecera creada")
      // Siempre volver al listado de cabeceras
      router.push("/dashboard/zonas/cabeceras")
      router.refresh()
    } catch {
      setError("Ocurrió un error inesperado")
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Código y Nombre */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="codigo">Código *</Label>
          <Input
            id="codigo"
            name="codigo"
            required
            defaultValue={initialData?.codigo}
            placeholder="CAB-001"
            className="dark:bg-slate-950 uppercase"
            style={{ textTransform: "uppercase" }}
          />
          <p className="text-xs text-muted-foreground">Identificador único. Ej: CAB-001</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre *</Label>
          <Input
            id="nombre"
            name="nombre"
            required
            defaultValue={initialData?.nombre}
            placeholder="Cabecera Principal Cusco"
            className="dark:bg-slate-950"
          />
        </div>
      </div>

      {/* Arrendador */}
      <div className="space-y-2">
        <Label>Arrendador / Propietario *</Label>
        <Select
          name="arrendadorId"
          defaultValue={initialData?.arrendadorId || "none"}
        >
          <SelectTrigger className="dark:bg-slate-950">
            <SelectValue placeholder="Seleccionar arrendador" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">
              <span className="text-muted-foreground italic">— Seleccionar persona —</span>
            </SelectItem>
            {personas.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.nombres} {p.apellidos ?? ""}{p.dni ? ` — DNI: ${p.dni}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Persona propietaria o responsable del local donde está la cabecera.
        </p>
      </div>

      {/* Ubicación */}
      <div className="space-y-2">
        <Label htmlFor="ubicacion">Dirección / Ubicación</Label>
        <Input
          id="ubicacion"
          name="ubicacion"
          defaultValue={initialData?.ubicacion ?? ""}
          placeholder="Av. de la Cultura 1234, Cusco"
          className="dark:bg-slate-950"
        />
      </div>

      {/* Coordenadas */}
      <div className="space-y-2">
        <Label>Coordenadas GPS <span className="text-muted-foreground text-xs">(opcional)</span></Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="latitud" className="text-xs text-muted-foreground">Latitud</Label>
            <Input
              id="latitud"
              name="latitud"
              type="number"
              step="any"
              defaultValue={initialData?.latitud ?? ""}
              placeholder="-13.5319"
              className="dark:bg-slate-950"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="longitud" className="text-xs text-muted-foreground">Longitud</Label>
            <Input
              id="longitud"
              name="longitud"
              type="number"
              step="any"
              defaultValue={initialData?.longitud ?? ""}
              placeholder="-71.9675"
              className="dark:bg-slate-950"
            />
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="flex gap-3 pt-4 border-t border-border">
        <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Actualizar Cabecera" : "Crear Cabecera"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/zonas/cabeceras")}
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}
