"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import {
  MoreHorizontal, Loader2, Plus, Wifi, WifiOff,
  AlertTriangle, Lock, Zap, User, Trash2, Minus,
} from "lucide-react"
import { cambiarEstadoPuerto, agregarPuertos, quitarPuerto } from "@/server/actions/cajaNap"
import { toast } from "sonner"
import Link from "next/link"

const ESTADOS_PUERTO = [
  { value: "DISPONIBLE",       label: "Disponible",       color: "bg-green-500",  textColor: "text-green-700 dark:text-green-400",  Icon: Wifi },
  { value: "OCUPADO",          label: "Ocupado",          color: "bg-blue-500",   textColor: "text-blue-700 dark:text-blue-400",    Icon: User },
  { value: "RESERVADO",        label: "Reservado",        color: "bg-yellow-500", textColor: "text-yellow-700 dark:text-yellow-400",Icon: Lock },
  { value: "DAÑADO",           label: "Dañado",           color: "bg-red-500",    textColor: "text-red-700 dark:text-red-400",      Icon: WifiOff },
  { value: "USADO_ALIMENTADOR",label: "Alimentador",      color: "bg-purple-500", textColor: "text-purple-700 dark:text-purple-400",Icon: Zap },
]

type Puerto = {
  id: string
  numeroPuerto: number
  estado: string
  clienteAsignado: {
    id: string
    codigoCliente: string | null
    persona: { nombres: string; apellidos: string | null }
  } | null
}

export default function PuertosPanel({
  cajaId,
  puertos,
  capacidad,
}: {
  cajaId: string
  puertos: Puerto[]
  capacidad: number
}) {
  const [pendingId,       setPendingId]       = useState<string | null>(null)
  const [modalPuerto,     setModalPuerto]     = useState<Puerto | null>(null)
  const [openAgregar,     setOpenAgregar]     = useState(false)
  const [cantidadAgregar, setCantidadAgregar] = useState("4")
  const [loadingAgregar,  setLoadingAgregar]  = useState(false)

  const handleCambiarEstado = async (puertoId: string, estado: string) => {
    setPendingId(puertoId)
    const result = await cambiarEstadoPuerto(puertoId, estado)
    setPendingId(null)
    setModalPuerto(null)
    result.success ? toast.success("Estado actualizado") : toast.error(result.error ?? "Error")
  }

  const handleAgregarPuertos = async () => {
    const n = parseInt(cantidadAgregar, 10)
    if (isNaN(n) || n < 1) { toast.error("Cantidad inválida"); return }
    setLoadingAgregar(true)
    const result = await agregarPuertos(cajaId, n)
    setLoadingAgregar(false)
    if (result.success) {
      toast.success(`${n} puertos agregados`)
      setOpenAgregar(false)
    } else {
      toast.error(result.error ?? "Error")
    }
  }

  const handleQuitarPuerto = async (puertoId: string) => {
    setPendingId(puertoId)
    const result = await quitarPuerto(puertoId)
    setPendingId(null)
    result.success ? toast.success("Puerto eliminado") : toast.error(result.error ?? "Error")
  }

  const getEstadoInfo = (estado: string) =>
    ESTADOS_PUERTO.find((e) => e.value === estado) ?? ESTADOS_PUERTO[0]

  const disponibles    = puertos.filter((p) => p.estado === "DISPONIBLE").length
  const ocupados       = puertos.filter((p) => p.estado === "OCUPADO").length
  const alimentadores  = puertos.filter((p) => p.estado === "USADO_ALIMENTADOR").length
  const danados        = puertos.filter((p) => p.estado === "DAÑADO").length
  const reservados     = puertos.filter((p) => p.estado === "RESERVADO").length

  return (
    <div className="space-y-4">
      {/* Leyenda + Agregar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex flex-wrap gap-2 text-xs">
          {ESTADOS_PUERTO.map((e) => (
            <span key={e.value} className="flex items-center gap-1">
              <span className={`w-2.5 h-2.5 rounded-full ${e.color}`} />
              <span className="text-muted-foreground">{e.label}</span>
            </span>
          ))}
        </div>
        <Button size="sm" variant="outline" onClick={() => setOpenAgregar(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" />Agregar puertos
        </Button>
      </div>

      {/* Resumen rápido */}
      <div className="grid grid-cols-5 gap-2 text-center text-xs">
        {[
          { label: "Disponibles", val: disponibles,   color: "text-green-600" },
          { label: "Ocupados",    val: ocupados,       color: "text-blue-600" },
          { label: "Alimentad.",  val: alimentadores,  color: "text-purple-600" },
          { label: "Reservados",  val: reservados,     color: "text-yellow-600" },
          { label: "Dañados",     val: danados,        color: "text-red-600" },
        ].map((s) => (
          <div key={s.label} className="p-2 rounded bg-muted/30 border border-border">
            <p className={`text-lg font-bold ${s.color}`}>{s.val}</p>
            <p className="text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Grid visual de puertos */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
        {puertos
          .sort((a, b) => a.numeroPuerto - b.numeroPuerto)
          .map((puerto) => {
            const info     = getEstadoInfo(puerto.estado)
            const Icon     = info.Icon
            const isPending = pendingId === puerto.id

            return (
              <DropdownMenu key={puerto.id}>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`
                      relative flex flex-col items-center justify-center gap-1
                      p-2 rounded-lg border-2 text-xs font-medium transition-all
                      hover:scale-105 hover:shadow-md cursor-pointer
                      ${puerto.estado === "DISPONIBLE"        ? "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/20"
                      : puerto.estado === "OCUPADO"           ? "border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20"
                      : puerto.estado === "DAÑADO"            ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/20"
                      : puerto.estado === "RESERVADO"         ? "border-yellow-300 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20"
                      : puerto.estado === "USADO_ALIMENTADOR" ? "border-purple-300 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/20"
                      :                                         "border-gray-200 bg-gray-50"}
                    `}
                    disabled={isPending}
                    title={
                      puerto.clienteAsignado
                        ? `Puerto ${puerto.numeroPuerto} — ${puerto.clienteAsignado.persona.nombres} ${puerto.clienteAsignado.persona.apellidos ?? ""}`
                        : `Puerto ${puerto.numeroPuerto} — ${info.label}`
                    }
                  >
                    {isPending
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Icon className={`h-4 w-4 ${info.textColor}`} />}
                    <span className={`text-xs font-bold ${info.textColor}`}>
                      P{puerto.numeroPuerto}
                    </span>
                    {puerto.clienteAsignado && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full border border-white" />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-52">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    Puerto {puerto.numeroPuerto}
                    <Badge variant="secondary" className="text-xs ml-2">{info.label}</Badge>
                  </DropdownMenuLabel>

                  {puerto.clienteAsignado && (
                    <>
                      <DropdownMenuSeparator />
                      <div className="px-2 py-1.5 text-xs text-muted-foreground">
                        <p className="font-medium text-foreground">
                          {puerto.clienteAsignado.persona.nombres} {puerto.clienteAsignado.persona.apellidos}
                        </p>
                        <p>{puerto.clienteAsignado.codigoCliente ?? "—"}</p>
                      </div>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/clientes/${puerto.clienteAsignado.id}`}>
                          <User className="mr-2 h-4 w-4" />Ver cliente
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                    Cambiar estado
                  </DropdownMenuLabel>

                  {ESTADOS_PUERTO.filter((e) =>
                    e.value !== puerto.estado &&
                    e.value !== "OCUPADO"        // Ocupado solo lo asigna el sistema al agregar cliente
                  ).map((e) => {
                    const EIcon = e.Icon
                    return (
                      <DropdownMenuItem
                        key={e.value}
                        onClick={() => handleCambiarEstado(puerto.id, e.value)}
                        disabled={!!puerto.clienteAsignado}
                      >
                        <EIcon className={`mr-2 h-4 w-4 ${e.textColor}`} />
                        {e.label}
                      </DropdownMenuItem>
                    )
                  })}

                  {puerto.clienteAsignado && (
                    <p className="px-2 py-1 text-xs text-muted-foreground">
                      ⚠ Desasigna el cliente primero
                    </p>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50"
                    onClick={() => handleQuitarPuerto(puerto.id)}
                    disabled={!!puerto.clienteAsignado}
                  >
                    <Minus className="mr-2 h-4 w-4" />
                    Quitar puerto
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )
          })}
      </div>

      {/* Modal agregar puertos */}
      <AlertDialog open={openAgregar} onOpenChange={setOpenAgregar}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Agregar Puertos</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="py-3 space-y-3">
            <p className="text-sm text-muted-foreground">
              Capacidad actual: <strong>{capacidad}</strong> puertos.
              Los nuevos puertos se agregarán numerados a continuación.
            </p>
            <div className="space-y-2">
              <Label htmlFor="cantidad">¿Cuántos puertos agregar?</Label>
              <Input
                id="cantidad" type="number" min="1" max="32"
                value={cantidadAgregar}
                onChange={(e) => setCantidadAgregar(e.target.value)}
                className="dark:bg-slate-950"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button onClick={handleAgregarPuertos} disabled={loadingAgregar}
              className="bg-blue-600 hover:bg-blue-700 text-white">
              {loadingAgregar && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Agregar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
