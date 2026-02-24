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
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, Loader2 } from "lucide-react"
import { crearTipoPedido, actualizarTipoPedido } from "@/server/actions/tipoPedido"
import { toast } from "sonner"

const PRIORIDADES = [
  { value: "BAJA",    label: "Baja",    color: "text-slate-500" },
  { value: "NORMAL",  label: "Normal",  color: "text-blue-500"  },
  { value: "MEDIA",   label: "Media",   color: "text-yellow-500"},
  { value: "ALTA",    label: "Alta",    color: "text-orange-500"},
  { value: "URGENTE", label: "Urgente", color: "text-red-500"   },
]

type InitialData = {
  id: string
  nombre: string
  descripcion: string | null
  prioridadDefault: string
  requiereAprobacion: boolean
}

export default function TipoPedidoForm({ initialData }: { initialData?: InitialData }) {
  const router    = useRouter()
  const isEditing = !!initialData

  const [isLoading, setIsLoading] = useState(false)
  const [error,     setError]     = useState("")
  const [aprobacion, setAprobacion] = useState(initialData?.requiereAprobacion ?? false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    const fd = new FormData(e.currentTarget)
    const result = isEditing
      ? await actualizarTipoPedido(initialData.id, fd)
      : await crearTipoPedido(fd)

    if (result.error) { setError(result.error); setIsLoading(false); return }
    toast.success(isEditing ? "Tipo actualizado" : "Tipo creado correctamente")
    router.push("/dashboard/pedidos/tipos")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="nombre">Nombre *</Label>
        <Input id="nombre" name="nombre" required
          defaultValue={initialData?.nombre}
          placeholder="Instalación Nueva, Soporte Técnico…"
          className="dark:bg-slate-950" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="descripcion">Descripción</Label>
        <Textarea id="descripcion" name="descripcion" rows={2}
          defaultValue={initialData?.descripcion ?? ""}
          placeholder="Descripción del tipo de pedido…"
          className="dark:bg-slate-950 resize-none" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Prioridad por defecto</Label>
          <Select name="prioridadDefault"
            defaultValue={initialData?.prioridadDefault ?? "NORMAL"}>
            <SelectTrigger className="dark:bg-slate-950"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PRIORIDADES.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  <span className={p.color}>●</span> {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Se usará como prioridad inicial al crear pedidos de este tipo.
          </p>
        </div>

        <div className="space-y-2">
          <Label>¿Requiere aprobación?</Label>
          <Select name="requiereAprobacion"
            value={aprobacion ? "true" : "false"}
            onValueChange={(v) => setAprobacion(v === "true")}>
            <SelectTrigger className="dark:bg-slate-950"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="false">No requiere aprobación</SelectItem>
              <SelectItem value="true">Sí requiere aprobación</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Si activo, el pedido iniciará en estado PENDIENTE hasta ser aprobado.
          </p>
        </div>
      </div>

      <div className="flex gap-3 pt-2 border-t border-border">
        <Button type="submit" disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Guardar Cambios" : "Crear Tipo"}
        </Button>
        <Button type="button" variant="outline"
          onClick={() => router.push("/dashboard/pedidos/tipos")}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
