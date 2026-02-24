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
import { crearCliente, actualizarCliente } from "@/server/actions/clientes"
import { AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function ClienteForm({
  zonas,
  vendedores,
  personas,
  initialData,
}: {
  zonas: any[]
  vendedores: any[]
  personas: any[]
  initialData?: any
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  
  // Estado para alternar entre Natural y Jurídico
  const [tipoEntidad, setTipoEntidad] = useState(initialData?.persona?.tipoEntidad || "NATURAL")
  const isEditing = !!initialData

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    
    const formData = new FormData(e.currentTarget)

    const camposObligatorios = {
      tipoEntidad: formData.get("tipoEntidad"),
      zonaId: formData.get("zonaId")
    }
    
    if (!camposObligatorios.zonaId || camposObligatorios.zonaId === "none") {
      setError("Debes seleccionar una Zona obligatoriamente.")
      setIsLoading(false)
      return
    }

    try {
      const result = isEditing 
        ? await actualizarCliente(initialData.id, formData)
        : await crearCliente(formData)

      if (result.error) {
        console.log(result.error)
        setError(result.error)
        setIsLoading(false)
        return
      }

      toast.success(isEditing ? "Cliente actualizado" : "Cliente creado")
      router.push("/dashboard/clientes")
      router.refresh()
    } catch (err) {
      setError("Ocurrió un error inesperado")
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* --- TIPO DE ENTIDAD --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="tipoEntidad">Tipo de Entidad *</Label>
          <Select
            name="tipoEntidad"
            value={tipoEntidad}
            onValueChange={(value) => setTipoEntidad(value as any)}
            disabled={isEditing} 
          >
            <SelectTrigger className="bg-background dark:bg-slate-950">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NATURAL">Persona Natural</SelectItem>
              <SelectItem value="JURIDICO">Persona Jurídica</SelectItem>
            </SelectContent>
          </Select>
          {/* Si estamos editando, mandamos el tipo en un hidden porque el Select está disabled */}
          {isEditing && <input type="hidden" name="tipoEntidad" value={tipoEntidad} />}
        </div>
      </div>

      {/* --- CAMPOS PARA PERSONA NATURAL --- */}
      {tipoEntidad === "NATURAL" && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2 text-foreground">Información Personal</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombres">Nombres *</Label>
              <Input 
                id="nombres" name="nombres" required 
                defaultValue={initialData?.persona?.nombres} 
                className="dark:bg-slate-950" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apellidos">Apellidos *</Label>
              <Input 
                id="apellidos" name="apellidos" required 
                defaultValue={initialData?.persona?.apellidos} 
                className="dark:bg-slate-950" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dni">DNI *</Label>
              <Input 
                id="dni" name="dni" required 
                defaultValue={initialData?.persona?.dni} 
                disabled={isEditing}
                className="dark:bg-slate-950" 
              />
            </div>
          </div>
        </div>
      )}

      {/* --- CAMPOS PARA PERSONA JURÍDICA (RECUPERADOS) --- */}
      {tipoEntidad === "JURIDICO" && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2 text-foreground">Información de la Empresa</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="razonSocial">Razón Social *</Label>
              <Input 
                id="razonSocial" name="razonSocial" required 
                defaultValue={initialData?.persona?.nombres} // En Jurídico, nombres suele ser la Razón Social
                className="dark:bg-slate-950" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ruc">RUC *</Label>
              <Input 
                id="ruc" name="ruc" required 
                defaultValue={initialData?.persona?.personaJuridica?.ruc || ""} // O el campo donde guardes el RUC
                disabled={isEditing}
                className="dark:bg-slate-950" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="representanteLegalId">Representante Legal *</Label>
              <Select 
                name="representanteLegalId" 
                // Si no hay representante (null), usamos "none"
                defaultValue={initialData?.persona?.personaJuridica?.representanteLegalId || "none"}
              >
                <SelectTrigger className="dark:bg-slate-950">
                  <SelectValue placeholder="Seleccionar representante" />
                </SelectTrigger>
                <SelectContent>
                  {/* Opción neutra para evitar el error de string vacío */}
                  <SelectItem value="none">
                    <span className="text-muted-foreground">--- Seleccionar Representante ---</span>
                  </SelectItem>

                  {personas.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombres} {p.apellidos} - DNI: {p.dni}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Si no encuentra el representante, créelo primero como Persona Natural.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* --- INFORMACIÓN DE CONTACTO (COMÚN) --- */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-foreground">Contacto y Ubicación</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" name="email" type="email" defaultValue={initialData?.persona?.email} className="dark:bg-slate-950" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono *</Label>
            <Input id="telefono" name="telefono" required defaultValue={initialData?.persona?.telefono} className="dark:bg-slate-950" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="direccion">Dirección *</Label>
            <Input id="direccion" name="direccion" required defaultValue={initialData?.persona?.direccion} className="dark:bg-slate-950" />
          </div>
        </div>
      </div>

      {/* --- INFORMACIÓN DEL SERVICIO (COMÚN) --- */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-foreground">Servicio</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Zona *</Label>
            {/* Cambiamos "" por "none" en el defaultValue */}
            <Select name="zonaId" defaultValue={initialData?.zonaId || "none"}>
              <SelectTrigger className="dark:bg-slate-950">
                <SelectValue placeholder="Zona" />
              </SelectTrigger>
              <SelectContent>
                {/* NUNCA uses value="" aquí, Radix lo prohíbe */}
                <SelectItem value="none">
                  <span className="text-muted-foreground italic">--- Seleccionar Zona ---</span>
                </SelectItem>
                
                {zonas.map((z) => (
                  <SelectItem key={z.id} value={z.id}>
                    {z.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Vendedor</Label>
            <Select 
              name="vendedorId" 
              defaultValue={initialData?.vendedorId || "none"}
            >
              <SelectTrigger className="dark:bg-slate-950">
                <SelectValue placeholder="Seleccionar vendedor" />
              </SelectTrigger>
              <SelectContent>
                {/* Usamos un string descriptivo en lugar de vacío para evitar el error de Radix */}
                <SelectItem value="none">
                  <span className="text-muted-foreground italic">--- Seleccionar Vendedor ---</span>
                </SelectItem>
                
                {vendedores.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.nombres} {v.apellidos}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Estado *</Label>
            <Select name="estadoConexion" defaultValue={initialData?.estadoConexion || "PENDIENTE"}>
              <SelectTrigger className="dark:bg-slate-950">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                <SelectItem value="ACTIVO">Activo</SelectItem>
                <SelectItem value="SUSPENDIDO">Suspendido</SelectItem>
                <SelectItem value="CORTADO">Cortado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* --- BOTONES DE ACCIÓN --- */}
      <div className="flex gap-4 pt-6 border-t">
        <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            isEditing ? "Actualizar Cliente" : "Guardar Cliente"
          )}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}