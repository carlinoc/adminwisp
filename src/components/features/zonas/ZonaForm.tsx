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
import { crearZona, actualizarZona } from "@/server/actions/zonas"
import { AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"

type Cabecera = { id: string; codigo: string; nombre: string }

type InitialData = {
  id: string
  codigo: string
  nombre: string
  descripcion: string | null
  cabeceraId: string
  esActivo: boolean
}

export default function ZonaForm({
  cabeceras,
  initialData,
  defaultCabeceraId,
}: {
  cabeceras: Cabecera[]
  initialData?: InitialData
  defaultCabeceraId?: string
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
        ? await actualizarZona(initialData.id, formData)
        : await crearZona(formData)

      if (result.error) {
        setError(result.error)
        setIsLoading(false)
        return
      }

      toast.success(isEditing ? "Zona actualizada correctamente" : "Zona creada correctamente")
      router.push("/dashboard/zonas")
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

      {/* Cabecera y Código */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Cabecera *</Label>
          <Select
            name="cabeceraId"
            defaultValue={initialData?.cabeceraId || defaultCabeceraId || "none"}
          >
            <SelectTrigger className="dark:bg-slate-950">
              <SelectValue placeholder="Seleccionar cabecera" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                <span className="text-muted-foreground italic">— Seleccionar cabecera —</span>
              </SelectItem>
              {cabeceras.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  [{c.codigo}] {c.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="codigo">Código *</Label>
          <Input
            id="codigo"
            name="codigo"
            required
            defaultValue={initialData?.codigo}
            placeholder="ZONA-001"
            className="dark:bg-slate-950 uppercase"
            style={{ textTransform: "uppercase" }}
          />
          <p className="text-xs text-muted-foreground">Se guardará en mayúsculas. Debe ser único.</p>
        </div>
      </div>

      {/* Nombre */}
      <div className="space-y-2">
        <Label htmlFor="nombre">Nombre de la Zona *</Label>
        <Input
          id="nombre"
          name="nombre"
          required
          defaultValue={initialData?.nombre}
          placeholder="Zona Centro Histórico"
          className="dark:bg-slate-950"
        />
      </div>

      {/* Descripción */}
      <div className="space-y-2">
        <Label htmlFor="descripcion">Descripción</Label>
        <Input
          id="descripcion"
          name="descripcion"
          defaultValue={initialData?.descripcion ?? ""}
          placeholder="Descripción opcional de la zona..."
          className="dark:bg-slate-950"
        />
      </div>

      {/* Estado */}
      <div className="space-y-2">
        <Label>Estado</Label>
        <Select name="esActivo" defaultValue={initialData?.esActivo === false ? "false" : "true"}>
          <SelectTrigger className="dark:bg-slate-950 w-full md:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">✅ Activa</SelectItem>
            <SelectItem value="false">⏸ Inactiva</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Botones */}
      <div className="flex gap-3 pt-4 border-t border-border">
        <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Actualizar Zona" : "Crear Zona"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
