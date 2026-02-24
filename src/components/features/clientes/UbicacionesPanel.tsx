"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  MapPin, Plus, Pencil, Trash2, Loader2, X, Check,
  ChevronDown, ChevronUp, Wifi, WifiOff, Router,
  Eye, EyeOff, KeyRound, AlertCircle, Zap,
} from "lucide-react"
import {
  crearUbicacionInstalacion,
  actualizarUbicacionInstalacion,
  eliminarUbicacionInstalacion,
  asignarPuerto,
  desasignarPuerto,
} from "@/server/actions/clientes"
import {
  crearConfiguracionOnt,
  actualizarConfiguracionOnt,
  eliminarConfiguracionOnt,
  obtenerPasswordDescifrada,
} from "@/server/actions/configuracionOnt"
import { toast } from "sonner"

type Contrato = { id: string; estado: string }
type ConfigOnt = {
  id: string
  macOnt: string
  vlanGestion: number
  pppoeUsuario: string
  configWifi: string | null
} | null

type PuertoDisponible = {
  id: string
  numeroPuerto: number
  cajaNap: {
    id: string
    direccion: string | null
    zona: { nombre: string; codigo: string }
  }
}

type Ubicacion = {
  id: string
  direccion: string
  latitud: number | null
  longitud: number | null
  referenciaVisual: string | null
  contratos: Contrato[]
  configuracionOnt: ConfigOnt
}

type Props = {
  clienteId:          string
  ubicaciones:        Ubicacion[]
  puertoActualId:     string | null
  puertoActual: {
    id: string; numeroPuerto: number
    cajaNap: { id: string; direccion: string | null; zona: { nombre: string; codigo: string } }
  } | null
  puertosDisponibles: PuertoDisponible[]
}

// ── Formulario de Ubicación ──────────────────────────────────────────────────
function UbicacionForm({
  clienteId, initial, onDone, onCancel,
}: {
  clienteId: string
  initial?: Ubicacion
  onDone: () => void
  onCancel: () => void
}) {
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const result = initial
      ? await actualizarUbicacionInstalacion(initial.id, clienteId, fd)
      : await crearUbicacionInstalacion(clienteId, fd)
    setLoading(false)
    if (result.success) {
      toast.success(initial ? "Ubicación actualizada" : "Ubicación creada")
      onDone()
    } else {
      toast.error(result.error ?? "Error al guardar")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-muted/30 rounded-lg border">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1 md:col-span-2">
          <Label htmlFor="ub-direccion">Dirección *</Label>
          <Input id="ub-direccion" name="direccion" required
            defaultValue={initial?.direccion} placeholder="Jr. Los Andes 123"
            className="dark:bg-slate-950" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ub-latitud">Latitud GPS</Label>
          <Input id="ub-latitud" name="latitud" type="number" step="any"
            defaultValue={initial?.latitud ?? ""} placeholder="-13.5319"
            className="dark:bg-slate-950" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ub-longitud">Longitud GPS</Label>
          <Input id="ub-longitud" name="longitud" type="number" step="any"
            defaultValue={initial?.longitud ?? ""} placeholder="-71.9675"
            className="dark:bg-slate-950" />
        </div>
        <div className="space-y-1 md:col-span-2">
          <Label htmlFor="ub-ref">Referencia visual</Label>
          <Input id="ub-ref" name="referenciaVisual"
            defaultValue={initial?.referenciaVisual ?? ""}
            placeholder="Casa amarilla, frente a la iglesia..." className="dark:bg-slate-950" />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={loading} size="sm">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
          {initial ? "Actualizar" : "Guardar"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4 mr-1" />Cancelar
        </Button>
      </div>
    </form>
  )
}

// ── Formulario ConfiguracionONT ──────────────────────────────────────────────
function OntForm({
  ubicacionId, initial, onDone, onCancel,
}: {
  ubicacionId: string
  initial?: ConfigOnt
  onDone: () => void
  onCancel: () => void
}) {
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState("")
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    const fd = new FormData(e.currentTarget)
    const result = initial
      ? await actualizarConfiguracionOnt(initial.id, fd)
      : await crearConfiguracionOnt(ubicacionId, fd)
    setLoading(false)
    if (result.error) { setError(result.error); return }
    toast.success(initial ? "Configuración ONT actualizada" : "Configuración ONT creada")
    onDone()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
      <div className="flex items-center gap-2">
        <Router className="h-4 w-4 text-blue-600" />
        <h4 className="font-semibold text-sm text-blue-700 dark:text-blue-400">
          {initial ? "Editar" : "Nueva"} Configuración ONT
        </h4>
      </div>
      {error && (
        <div className="flex items-center gap-2 p-2 text-xs text-red-600 bg-red-50 rounded border border-red-200">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />{error}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">MAC ONT *</Label>
          <Input name="macOnt" required defaultValue={initial?.macOnt ?? ""}
            placeholder="AA:BB:CC:DD:EE:FF" className="dark:bg-slate-950 font-mono text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">VLAN Gestión *</Label>
          <Input name="vlanGestion" type="number" min="1" max="4094" required
            defaultValue={initial?.vlanGestion ?? ""} placeholder="100"
            className="dark:bg-slate-950" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Usuario PPPoE *</Label>
          <Input name="pppoeUsuario" required defaultValue={initial?.pppoeUsuario ?? ""}
            placeholder="cliente@isp" className="dark:bg-slate-950 font-mono text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">
            Contraseña PPPoE {initial ? "(vacío = sin cambio)" : "*"}
          </Label>
          <div className="relative">
            <Input name="pppoePassword" type={showPass ? "text" : "password"}
              required={!initial} placeholder={initial ? "••••••••" : "contraseña"}
              className="dark:bg-slate-950 font-mono text-sm pr-8" />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
        <div className="space-y-1 md:col-span-2">
          <Label className="text-xs">Config WiFi (opcional)</Label>
          <Input name="configWifi" defaultValue={initial?.configWifi ?? ""}
            placeholder="SSID: MiRed | Pass: clave123" className="dark:bg-slate-950" />
        </div>
      </div>
      {!initial && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <KeyRound className="h-3 w-3" />La contraseña PPPoE se cifra con AES-256-GCM
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={loading} size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
          {initial ? "Actualizar" : "Guardar configuración"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4 mr-1" />Cancelar
        </Button>
      </div>
    </form>
  )
}

// ── Panel ONT inline ─────────────────────────────────────────────────────────
function OntPanel({ ubicacion }: { ubicacion: Ubicacion }) {
  const [mode,        setMode]        = useState<"view"|"create"|"edit">("view")
  const [showDelete,  setShowDelete]  = useState(false)
  const [deleting,    setDeleting]    = useState(false)
  const [showPass,    setShowPass]    = useState(false)
  const [passText,    setPassText]    = useState<string|null>(null)
  const [loadingPass, setLoadingPass] = useState(false)

  const ont = ubicacion.configuracionOnt

  const handleDelete = async () => {
    if (!ont) return
    setDeleting(true)
    const result = await eliminarConfiguracionOnt(ont.id)
    setDeleting(false)
    setShowDelete(false)
    result.success ? toast.success("Configuración ONT eliminada") : toast.error(result.error ?? "Error")
  }

  const handleVerPass = async () => {
    if (!ont) return
    setLoadingPass(true)
    const pass = await obtenerPasswordDescifrada(ont.id)
    setLoadingPass(false)
    if (pass) { setPassText(pass); setShowPass(true) }
    else toast.error("No se pudo descifrar la contraseña")
  }

  if (mode !== "view") {
    return (
      <OntForm ubicacionId={ubicacion.id}
        initial={mode === "edit" ? ont : undefined}
        onDone={() => setMode("view")} onCancel={() => setMode("view")} />
    )
  }

  if (!ont) {
    return (
      <div className="flex items-center justify-between p-2 rounded-md bg-muted/30 border border-dashed">
        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
          <WifiOff className="h-3.5 w-3.5" />Sin configuración ONT
        </span>
        <Button size="sm" variant="outline" className="h-7 text-xs px-2"
          onClick={() => setMode("create")}>
          <Plus className="h-3 w-3 mr-1" />Configurar ONT
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-md border border-green-300 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-green-700 dark:text-green-400">
          <Router className="h-3.5 w-3.5" />ONT Configurado
        </span>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setMode("edit")}>
            <Pencil className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
            onClick={() => setShowDelete(true)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <div><span className="text-muted-foreground">MAC: </span>
          <span className="font-mono font-medium">{ont.macOnt}</span></div>
        <div><span className="text-muted-foreground">VLAN: </span>
          <span className="font-medium">{ont.vlanGestion}</span></div>
        <div><span className="text-muted-foreground">PPPoE: </span>
          <span className="font-mono">{ont.pppoeUsuario}</span></div>
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">Pass: </span>
          {showPass && passText
            ? <span className="font-mono">{passText}</span>
            : <span className="text-muted-foreground italic">•••••</span>}
          <button type="button"
            onClick={showPass ? () => { setShowPass(false); setPassText(null) } : handleVerPass}
            className="ml-1 text-blue-600 hover:underline text-xs flex items-center gap-0.5"
            disabled={loadingPass}>
            {loadingPass
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : showPass ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            {showPass ? "ocultar" : "ver"}
          </button>
        </div>
        {ont.configWifi && (
          <div className="col-span-2">
            <span className="text-muted-foreground">WiFi: </span>{ont.configWifi}
          </div>
        )}
      </div>
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar configuración ONT?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará la configuración ONT de esta ubicación.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ── Card de una ubicación ────────────────────────────────────────────────────
function UbicacionCard({ ub, clienteId }: { ub: Ubicacion; clienteId: string }) {
  const [editing,    setEditing]    = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting,   setDeleting]   = useState(false)
  const [expanded,   setExpanded]   = useState(false)

  const tieneContratos = ub.contratos.length > 0

  const handleDelete = async () => {
    setDeleting(true)
    const result = await eliminarUbicacionInstalacion(ub.id, clienteId)
    setDeleting(false)
    setShowDelete(false)
    result.success ? toast.success("Ubicación eliminada") : toast.error(result.error ?? "Error")
  }

  if (editing) {
    return (
      <UbicacionForm clienteId={clienteId} initial={ub}
        onDone={() => setEditing(false)} onCancel={() => setEditing(false)} />
    )
  }

  return (
    <>
      <div className="rounded-lg border border-border bg-muted/20 overflow-hidden">
        <div className="flex items-start justify-between gap-2 p-3">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <MapPin className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{ub.direccion}</p>
              {ub.referenciaVisual && (
                <p className="text-xs text-muted-foreground">{ub.referenciaVisual}</p>
              )}
              {(ub.latitud || ub.longitud) && (
                <p className="text-xs text-muted-foreground font-mono">
                  {ub.latitud}, {ub.longitud}
                </p>
              )}
              <div className="flex gap-2 mt-1">
                {ub.configuracionOnt && (
                  <Badge variant="secondary" className="text-xs py-0 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    <Router className="h-2.5 w-2.5 mr-0.5" />ONT
                  </Badge>
                )}
                {tieneContratos && (
                  <Badge variant="secondary" className="text-xs py-0">
                    {ub.contratos.length} contrato(s)
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7"
              onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7"
              onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon"
              className="h-7 w-7 text-red-500 hover:text-red-600"
              onClick={() => setShowDelete(true)}
              disabled={tieneContratos}
              title={tieneContratos ? "Tiene contratos asociados" : "Eliminar"}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        {expanded && (
          <div className="px-3 pb-3 pt-2 border-t border-border">
            <OntPanel ubicacion={ub} />
          </div>
        )}
      </div>
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar ubicación?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará <strong>{ub.direccion}</strong> y su configuración ONT.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ── Panel Puerto NAP ─────────────────────────────────────────────────────────
function PuertoNapPanel({
  clienteId, puertoActual, puertosDisponibles,
}: {
  clienteId: string
  puertoActual: Props["puertoActual"]
  puertosDisponibles: PuertoDisponible[]
}) {
  const [assigning,  setAssigning]  = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [selectedId, setSelectedId] = useState("")
  const [showConfirm,setShowConfirm]= useState(false)

  const handleAsignar = async () => {
    if (!selectedId) return
    setLoading(true)
    const result = await asignarPuerto(clienteId, selectedId)
    setLoading(false)
    setAssigning(false)
    result.success ? toast.success("Puerto asignado") : toast.error(result.error ?? "Error")
  }

  const handleDesasignar = async () => {
    setLoading(true)
    const result = await desasignarPuerto(clienteId)
    setLoading(false)
    setShowConfirm(false)
    result.success ? toast.success("Puerto liberado") : toast.error(result.error ?? "Error")
  }

  return (
    <div className="space-y-3">
      {puertoActual ? (
        <div className="flex items-center justify-between p-3 rounded-lg border border-green-300 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
          <div className="flex items-start gap-2">
            <Zap className="h-4 w-4 text-green-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-green-800 dark:text-green-300">
                Puerto {puertoActual.numeroPuerto} — {puertoActual.cajaNap.zona.nombre} [{puertoActual.cajaNap.zona.codigo}]
              </p>
              <p className="text-xs text-muted-foreground">
                {puertoActual.cajaNap.direccion ?? "Sin dirección de caja NAP"}
              </p>
            </div>
          </div>
          <div className="flex gap-1.5 flex-shrink-0">
            <Button size="sm" variant="outline" className="h-7 text-xs px-2"
              onClick={() => setAssigning(true)} disabled={loading}>
              <Pencil className="h-3 w-3 mr-1" />Cambiar
            </Button>
            <Button size="sm" variant="outline"
              className="h-7 text-xs px-2 text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950/30"
              onClick={() => setShowConfirm(true)} disabled={loading}>
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <WifiOff className="h-3 w-3 mr-1" />}
              Liberar
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 rounded-lg border border-dashed bg-muted/20">
          <span className="text-sm text-muted-foreground flex items-center gap-1.5">
            <WifiOff className="h-3.5 w-3.5" />Sin puerto NAP asignado
          </span>
          <Button size="sm" variant="outline" className="h-7 text-xs px-2"
            onClick={() => setAssigning(true)}>
            <Plus className="h-3 w-3 mr-1" />Asignar puerto
          </Button>
        </div>
      )}

      {assigning && (
        <div className="p-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 space-y-3">
          <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
            Selecciona un puerto disponible:
          </p>
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger className="dark:bg-slate-950 text-sm">
              <SelectValue placeholder="— Seleccionar puerto —" />
            </SelectTrigger>
            <SelectContent>
              {puertosDisponibles.length === 0 ? (
                <SelectItem value="_none" disabled>No hay puertos disponibles</SelectItem>
              ) : puertosDisponibles.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  Puerto {p.numeroPuerto} — {p.cajaNap.zona.nombre} [{p.cajaNap.zona.codigo}]
                  {p.cajaNap.direccion && (
                    <span className="text-muted-foreground text-xs ml-1">· {p.cajaNap.direccion}</span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button size="sm" disabled={!selectedId || loading}
              className="bg-blue-600 hover:bg-blue-700 text-white h-7 text-xs px-3"
              onClick={handleAsignar}>
              {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Check className="h-3 w-3 mr-1" />}
              Confirmar
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs"
              onClick={() => { setAssigning(false); setSelectedId("") }}>
              <X className="h-3 w-3 mr-1" />Cancelar
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Liberar puerto?</AlertDialogTitle>
            <AlertDialogDescription>
              Se liberará el Puerto {puertoActual?.numeroPuerto} de {puertoActual?.cajaNap.zona.nombre}.
              Quedará disponible para otro cliente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDesasignar} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Liberar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ── Panel principal ──────────────────────────────────────────────────────────
export default function UbicacionesPanel({
  clienteId, ubicaciones, puertoActualId, puertoActual, puertosDisponibles,
}: Props) {
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="space-y-4">
      {/* Puerto NAP */}
      <Card className="dark:bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wifi className="h-4 w-4" />Puerto NAP del Cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PuertoNapPanel
            clienteId={clienteId}
            puertoActual={puertoActual}
            puertosDisponibles={puertosDisponibles}
          />
        </CardContent>
      </Card>

      {/* Ubicaciones */}
      <Card className="dark:bg-slate-900/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4" />
              Ubicaciones de Instalación ({ubicaciones.length})
            </CardTitle>
            {!showForm && (
              <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-1" />Agregar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {showForm && (
            <UbicacionForm clienteId={clienteId}
              onDone={() => setShowForm(false)} onCancel={() => setShowForm(false)} />
          )}
          {ubicaciones.length === 0 && !showForm ? (
            <p className="text-muted-foreground text-sm text-center py-6">
              Sin ubicaciones de instalación registradas
            </p>
          ) : (
            ubicaciones.map((ub) => (
              <UbicacionCard key={ub.id} ub={ub} clienteId={clienteId} />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
