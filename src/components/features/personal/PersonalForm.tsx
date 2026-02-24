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
import { crearPersonal, actualizarPersonal } from "@/server/actions/personal"
import { AlertCircle, Loader2, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

const ROLES = [
  { value: "ADMIN",    label: "Administrador" },
  { value: "VENDEDOR", label: "Vendedor" },
  { value: "TECNICO",  label: "Técnico" },
  { value: "SOPORTE",  label: "Soporte" },
  { value: "CONTADOR", label: "Contador" },
]

const ESTADOS_LABORAL = [
  { value: "ACTIVO",      label: "Activo" },
  { value: "VACACIONES",  label: "Vacaciones" },
  { value: "SUSPENDIDO",  label: "Suspendido" },
  { value: "INACTIVO",    label: "Inactivo" },
]

const ESTADOS_ACCESO = [
  { value: "ACTIVO",   label: "Activo — puede iniciar sesión" },
  { value: "PENDIENTE","label": "Pendiente — aún no activado" },
  { value: "BLOQUEADO","label": "Bloqueado — acceso denegado" },
]

type InitialData = {
  personaId:        string
  nombres:          string
  apellidos:        string | null
  dni:              string | null
  email:            string | null
  telefono:         string | null
  direccion:        string | null
  fechaNacimiento:  Date | null
  fechaContratacion: Date
  esTecnico:        boolean
  estadoLaboral:    string
  rolPrincipal:     string
  estadoAcceso:     string
}

export default function PersonalForm({ initialData }: { initialData?: InitialData }) {
  const router = useRouter()
  const isEditing = !!initialData

  const [isLoading,    setIsLoading]    = useState(false)
  const [error,        setError]        = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm,  setShowConfirm]  = useState(false)

  const fmt = (date: Date | null | undefined) => {
    if (!date) return ""
    return new Date(date).toISOString().split("T")[0]
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)

    const result = isEditing
      ? await actualizarPersonal(initialData.personaId, formData)
      : await crearPersonal(formData)

    if (result.error) {
      setError(result.error)
      setIsLoading(false)
      return
    }

    toast.success(isEditing ? "Personal actualizado correctamente" : "Personal creado correctamente")
    router.push("/dashboard/personal")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="flex items-start gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* ── Sección 1: Datos personales ─────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 pb-2 border-b border-border">
          <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">1</div>
          <h3 className="font-semibold text-foreground">Datos Personales</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nombres">Nombres *</Label>
            <Input id="nombres" name="nombres" required
              defaultValue={initialData?.nombres}
              placeholder="Juan Carlos" className="dark:bg-slate-950" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="apellidos">Apellidos *</Label>
            <Input id="apellidos" name="apellidos" required
              defaultValue={initialData?.apellidos ?? ""}
              placeholder="García López" className="dark:bg-slate-950" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dni">DNI *</Label>
            <Input id="dni" name="dni" required maxLength={8}
              defaultValue={initialData?.dni ?? ""}
              placeholder="12345678" className="dark:bg-slate-950" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fechaNacimiento">Fecha de Nacimiento</Label>
            <Input id="fechaNacimiento" name="fechaNacimiento" type="date"
              defaultValue={fmt(initialData?.fechaNacimiento)}
              className="dark:bg-slate-950" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" name="email" type="email" required
              defaultValue={initialData?.email ?? ""}
              placeholder="juan@empresa.com" className="dark:bg-slate-950" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input id="telefono" name="telefono"
              defaultValue={initialData?.telefono ?? ""}
              placeholder="987654321" className="dark:bg-slate-950" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="direccion">Dirección</Label>
            <Input id="direccion" name="direccion"
              defaultValue={initialData?.direccion ?? ""}
              placeholder="Av. Principal 123, Cusco" className="dark:bg-slate-950" />
          </div>
        </div>
      </section>

      {/* ── Sección 2: Datos laborales ───────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 pb-2 border-b border-border">
          <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">2</div>
          <h3 className="font-semibold text-foreground">Datos Laborales</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fechaContratacion">Fecha de Contratación *</Label>
            <Input id="fechaContratacion" name="fechaContratacion" type="date" required
              defaultValue={fmt(initialData?.fechaContratacion) || new Date().toISOString().split("T")[0]}
              className="dark:bg-slate-950" />
          </div>
          <div className="space-y-2">
            <Label>¿Es Técnico de Campo?</Label>
            <Select name="esTecnico" defaultValue={initialData?.esTecnico ? "true" : "false"}>
              <SelectTrigger className="dark:bg-slate-950">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">No (personal administrativo)</SelectItem>
                <SelectItem value="true">Sí (técnico de campo)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Estado Laboral</Label>
            <Select name="estadoLaboral" defaultValue={initialData?.estadoLaboral || "ACTIVO"}>
              <SelectTrigger className="dark:bg-slate-950">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ESTADOS_LABORAL.map((e) => (
                  <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* ── Sección 3: Acceso al sistema ─────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 pb-2 border-b border-border">
          <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">3</div>
          <h3 className="font-semibold text-foreground">Acceso al Sistema</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Rol Principal *</Label>
            <Select name="rolPrincipal" defaultValue={initialData?.rolPrincipal || "SOPORTE"}>
              <SelectTrigger className="dark:bg-slate-950">
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Estado de Acceso</Label>
            <Select name="estadoAcceso" defaultValue={initialData?.estadoAcceso || "PENDIENTE"}>
              <SelectTrigger className="dark:bg-slate-950">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ESTADOS_ACCESO.map((e) => (
                  <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Contraseña — solo en creación */}
        {!isEditing && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña *</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  placeholder="Mínimo 8 caracteres"
                  className="dark:bg-slate-950 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmarPassword">Confirmar Contraseña *</Label>
              <div className="relative">
                <Input
                  id="confirmarPassword"
                  name="confirmarPassword"
                  type={showConfirm ? "text" : "password"}
                  required
                  minLength={8}
                  placeholder="Repetir contraseña"
                  className="dark:bg-slate-950 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground md:col-span-2">
              La contraseña se guardará cifrada con bcrypt. Compártela de forma segura con el empleado.
            </p>
          </div>
        )}

        {isEditing && (
          <p className="text-sm text-muted-foreground bg-muted/50 rounded-md p-3 border border-border">
            Para cambiar la contraseña de este usuario, usa el botón <strong>"Cambiar contraseña"</strong> en la página de detalle.
          </p>
        )}
      </section>

      {/* ── Botones ──────────────────────────────────────────── */}
      <div className="flex gap-3 pt-2 border-t border-border">
        <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Guardar Cambios" : "Crear Personal"}
        </Button>
        <Button type="button" variant="outline"
          onClick={() => router.push("/dashboard/personal")}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
