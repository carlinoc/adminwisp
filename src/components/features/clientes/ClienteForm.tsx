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
import { crearCliente } from "@/server/actions/clientes"
import { AlertCircle, Loader2 } from "lucide-react"

type Zona = {
  id: string
  nombre: string
}

type Vendedor = {
  id: string
  nombres: string
  apellidos: string | null
}

type Persona = {
  id: string
  nombres: string
  apellidos: string | null
  dni: string | null
}

export default function ClienteForm({
  zonas,
  vendedores,
  personas,
}: {
  zonas: Zona[]
  vendedores: Vendedor[]
  personas: Persona[]
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [tipoEntidad, setTipoEntidad] = useState<"NATURAL" | "JURIDICO">("NATURAL")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    const formData = new FormData(e.currentTarget)

    try {
      const result = await crearCliente(formData)
      if (result.error) {
        setError(result.error)
        setIsLoading(false)
        return
      }
      router.push("/dashboard/clientes")
      router.refresh()
    } catch (err) {
      setError("Error al crear el cliente")
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-md">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Tipo de Entidad */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="tipoEntidad" className="text-foreground">Tipo de Entidad *</Label>
          <Select
            name="tipoEntidad"
            value={tipoEntidad}
            onValueChange={(value) => setTipoEntidad(value as "NATURAL" | "JURIDICO")}
            required
          >
            <SelectTrigger className="bg-background dark:bg-slate-950">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NATURAL">Persona Natural</SelectItem>
              <SelectItem value="JURIDICO">Persona Jurídica</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Formulario para Persona Natural */}
      {tipoEntidad === "NATURAL" && (
        <>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
              Información Personal
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombres" className="text-foreground">Nombres *</Label>
                <Input
                  id="nombres"
                  name="nombres"
                  required
                  placeholder="Juan Carlos"
                  className="bg-background dark:bg-slate-950"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellidos" className="text-foreground">Apellidos *</Label>
                <Input
                  id="apellidos"
                  name="apellidos"
                  required
                  placeholder="Pérez García"
                  className="bg-background dark:bg-slate-950"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dni" className="text-foreground">DNI *</Label>
                <Input
                  id="dni"
                  name="dni"
                  required
                  placeholder="12345678"
                  maxLength={8}
                  className="bg-background dark:bg-slate-950"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fechaNacimiento" className="text-foreground">Fecha de Nacimiento</Label>
                <Input
                  id="fechaNacimiento"
                  name="fechaNacimiento"
                  type="date"
                  className="bg-background dark:bg-slate-950"
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Formulario para Persona Jurídica */}
      {tipoEntidad === "JURIDICO" && (
        <>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
              Información de la Empresa
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="razonSocial" className="text-foreground">Razón Social *</Label>
                <Input
                  id="razonSocial"
                  name="razonSocial"
                  required
                  placeholder="Empresa SAC"
                  className="bg-background dark:bg-slate-950"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ruc" className="text-foreground">RUC *</Label>
                <Input
                  id="ruc"
                  name="ruc"
                  required
                  placeholder="20123456789"
                  maxLength={11}
                  className="bg-background dark:bg-slate-950"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefonoEmpresa" className="text-foreground">Teléfono Empresa</Label>
                <Input
                  id="telefonoEmpresa"
                  name="telefonoEmpresa"
                  placeholder="987654321"
                  maxLength={9}
                  className="bg-background dark:bg-slate-950"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="representanteLegalId" className="text-foreground">Representante Legal *</Label>
                <Select name="representanteLegalId" required>
                  <SelectTrigger className="bg-background dark:bg-slate-950">
                    <SelectValue placeholder="Seleccionar representante legal" />
                  </SelectTrigger>
                  <SelectContent>
                    {personas.map((persona) => (
                      <SelectItem key={persona.id} value={persona.id}>
                        {persona.nombres} {persona.apellidos} - DNI: {persona.dni}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Si no encuentra el representante, créelo primero como Persona Natural
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Información de Contacto (Común para ambos) */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
          Información de Contacto
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="cliente@email.com"
              className="bg-background dark:bg-slate-950"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefono" className="text-foreground">
              Teléfono {tipoEntidad === "NATURAL" ? "*" : ""}
            </Label>
            <Input
              id="telefono"
              name="telefono"
              required={tipoEntidad === "NATURAL"}
              placeholder="987654321"
              maxLength={9}
              className="bg-background dark:bg-slate-950"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="direccion" className="text-foreground">Dirección *</Label>
            <Input
              id="direccion"
              name="direccion"
              required
              placeholder="Av. Principal 123"
              className="bg-background dark:bg-slate-950"
            />
          </div>
        </div>
      </div>

      {/* Información del Servicio */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
          Información del Servicio
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-foreground">Zona *</Label>
            <Select name="zonaId" required>
              <SelectTrigger className="bg-background dark:bg-slate-950">
                <SelectValue placeholder="Seleccionar zona" />
              </SelectTrigger>
              <SelectContent>
                {zonas.map((zona) => (
                  <SelectItem key={zona.id} value={zona.id}>
                    {zona.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label className="text-foreground">Vendedor *</Label>
            <Select name="vendedorId" required>
              <SelectTrigger className="bg-background dark:bg-slate-950">
                <SelectValue placeholder="Seleccionar vendedor" />
              </SelectTrigger>
              <SelectContent>
                {vendedores.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.nombres} {v.apellidos}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Estado de Conexión *</Label>
            <Select name="estadoConexion" defaultValue="PENDIENTE" required>
              <SelectTrigger className="bg-background dark:bg-slate-950">
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

      {/* Acciones */}
      <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-border">
        <Button 
          type="submit" 
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-500 w-full sm:w-auto"
        >
          {isLoading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</>
          ) : (
            "Guardar Cliente"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/clientes")}
          disabled={isLoading}
          className="w-full sm:w-auto dark:border-gray-700 dark:hover:bg-gray-800"
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}