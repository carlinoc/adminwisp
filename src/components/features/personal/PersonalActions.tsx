"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  KeyRound, Loader2, Eye, EyeOff, AlertCircle,
  ChevronDown, ShieldCheck, ShieldOff, Clock, UserX, Plane,
} from "lucide-react"
import {
  cambiarPassword, cambiarEstadoAcceso, cambiarEstadoLaboral,
} from "@/server/actions/personal"
import { toast } from "sonner"
import { EstadoAcceso, EstadoLaboral } from "@prisma/client"

// ── Modal cambiar contraseña ────────────────────────────────────────────────
export function CambiarPasswordModal({ personaId }: { personaId: string }) {
  const [open,        setOpen]        = useState(false)
  const [isLoading,   setIsLoading]   = useState(false)
  const [error,       setError]       = useState("")
  const [showNew,     setShowNew]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    const formData = new FormData(e.currentTarget)
    const result = await cambiarPassword(personaId, formData)
    setIsLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      toast.success("Contraseña actualizada correctamente")
      setOpen(false)
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="gap-2">
        <KeyRound className="h-4 w-4" />
        Cambiar contraseña
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Cambiar contraseña</AlertDialogTitle>
          </AlertDialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {error && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="nuevaPassword">Nueva contraseña *</Label>
              <div className="relative">
                <Input
                  id="nuevaPassword"
                  name="nuevaPassword"
                  type={showNew ? "text" : "password"}
                  required
                  minLength={8}
                  placeholder="Mínimo 8 caracteres"
                  className="dark:bg-slate-950 pr-10"
                />
                <button type="button" onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmarPassword">Confirmar contraseña *</Label>
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
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <AlertDialogFooter className="pt-2">
              <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
              <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Actualizar contraseña
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ── Dropdown estado de acceso ──────────────────────────────────────────────
export function CambiarEstadoAccesoDropdown({
  personaId,
  estadoActual,
}: {
  personaId: string
  estadoActual: string
}) {
  const [isLoading, setIsLoading] = useState(false)

  const opciones: { value: EstadoAcceso; label: string; icon: React.ElementType; color: string }[] = [
    { value: "ACTIVO",   label: "Activo",   icon: ShieldCheck, color: "text-green-600" },
    { value: "PENDIENTE",label: "Pendiente",icon: Clock,       color: "text-yellow-600" },
    { value: "BLOQUEADO",label: "Bloqueado",icon: ShieldOff,   color: "text-red-600" },
  ]

  const handleChange = async (nuevoEstado: EstadoAcceso) => {
    if (nuevoEstado === estadoActual) return
    setIsLoading(true)
    const result = await cambiarEstadoAcceso(personaId, nuevoEstado)
    setIsLoading(false)
    if (result.success) {
      toast.success(`Acceso cambiado a: ${nuevoEstado}`)
    } else {
      toast.error(result.error ?? "Error al cambiar estado")
    }
  }

  const actual = opciones.find((o) => o.value === estadoActual)
  const Icon   = actual?.icon ?? ShieldCheck

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isLoading} className="gap-2">
          {isLoading
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Icon className={`h-4 w-4 ${actual?.color}`} />}
          Acceso: {estadoActual}
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Estado de acceso</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {opciones.map((op) => {
          const OpIcon = op.icon
          return (
            <DropdownMenuItem key={op.value} onClick={() => handleChange(op.value)}
              className={op.value === estadoActual ? "font-semibold bg-muted" : ""}>
              <OpIcon className={`mr-2 h-4 w-4 ${op.color}`} />
              {op.label}
              {op.value === estadoActual && (
                <span className="ml-auto text-xs text-muted-foreground">actual</span>
              )}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ── Dropdown estado laboral ────────────────────────────────────────────────
export function CambiarEstadoLaboralDropdown({
  personaId,
  estadoActual,
}: {
  personaId: string
  estadoActual: string
}) {
  const [isLoading, setIsLoading] = useState(false)

  const opciones: { value: EstadoLaboral; label: string; icon: React.ElementType; color: string }[] = [
    { value: "ACTIVO",     label: "Activo",     icon: ShieldCheck,  color: "text-green-600" },
    { value: "VACACIONES", label: "Vacaciones", icon: Plane,        color: "text-blue-600" },
    { value: "SUSPENDIDO", label: "Suspendido", icon: ShieldOff,    color: "text-red-600" },
    { value: "INACTIVO",   label: "Inactivo",   icon: UserX,        color: "text-gray-500" },
  ]

  const handleChange = async (nuevoEstado: EstadoLaboral) => {
    if (nuevoEstado === estadoActual) return
    setIsLoading(true)
    const result = await cambiarEstadoLaboral(personaId, nuevoEstado)
    setIsLoading(false)
    if (result.success) {
      toast.success(`Estado laboral: ${nuevoEstado}`)
    } else {
      toast.error(result.error ?? "Error al cambiar estado")
    }
  }

  const actual = opciones.find((o) => o.value === estadoActual)
  const Icon   = actual?.icon ?? ShieldCheck

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isLoading} className="gap-2">
          {isLoading
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Icon className={`h-4 w-4 ${actual?.color}`} />}
          {estadoActual}
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Estado laboral</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {opciones.map((op) => {
          const OpIcon = op.icon
          return (
            <DropdownMenuItem key={op.value} onClick={() => handleChange(op.value)}
              className={op.value === estadoActual ? "font-semibold bg-muted" : ""}>
              <OpIcon className={`mr-2 h-4 w-4 ${op.color}`} />
              {op.label}
              {op.value === estadoActual && (
                <span className="ml-auto text-xs text-muted-foreground">actual</span>
              )}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
