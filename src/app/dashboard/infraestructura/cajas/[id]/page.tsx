import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft, Pencil, Network, MapPin, Zap,
  Wifi, User, WifiOff, Lock, AlertTriangle,
} from "lucide-react"
import Link from "next/link"
import PuertosPanel from "@/components/features/infraestructura/PuertosPanel"

export default async function DetalleCajaNapPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const caja = await prisma.cajaNap.findUnique({
    where: { id },
    include: {
      zona: {
        select: {
          codigo: true, nombre: true,
          cabecera: { select: { nombre: true } },
        },
      },
      puertoAlimentador: {
        include: {
          cajaNap: {
            select: { id: true, direccion: true, zona: { select: { nombre: true } } },
          },
        },
      },
      puertos: {
        include: {
          clienteAsignado: {
            select: {
              id: true,
              codigoCliente: true,
              persona: { select: { nombres: true, apellidos: true } },
            },
          },
        },
        orderBy: { numeroPuerto: "asc" },
      },
      // Cajas hijas alimentadas desde esta caja
      _count: { select: { puertos: true } },
    },
  })

  if (!caja) notFound()

  // Stats de puertos
  const disponibles  = caja.puertos.filter((p) => p.estado === "DISPONIBLE").length
  const ocupados     = caja.puertos.filter((p) => p.estado === "OCUPADO").length
  const alimentadores = caja.puertos.filter((p) => p.estado === "USADO_ALIMENTADOR").length
  const danados      = caja.puertos.filter((p) => p.estado === "DAÑADO").length
  const reservados   = caja.puertos.filter((p) => p.estado === "RESERVADO").length
  const pct          = caja.capacidadPuertosTotal > 0
    ? Math.round((caja.puertosUtilizados / caja.capacidadPuertosTotal) * 100)
    : 0

  // Serializar Decimal GPS
  const latitud  = caja.latitud  ? Number(caja.latitud)  : null
  const longitud = caja.longitud ? Number(caja.longitud) : null

  // Serializar puertos para client component
  const puertos = caja.puertos.map((p) => ({
    id:           p.id,
    numeroPuerto: p.numeroPuerto,
    estado:       p.estado,
    clienteAsignadoId: p.clienteAsignadoId,
    clienteAsignado: p.clienteAsignado
      ? {
          id:            p.clienteAsignado.id,
          codigoCliente: p.clienteAsignado.codigoCliente,
          persona: {
            nombres:   p.clienteAsignado.persona.nombres,
            apellidos: p.clienteAsignado.persona.apellidos,
          },
        }
      : null,
  }))

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/infraestructura/cajas">
            <Button variant="ghost" size="icon" className="dark:hover:bg-slate-800">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Network className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-foreground">
                  Caja NAP — {caja.zona.nombre}
                </h1>
                <Badge variant="secondary">
                  [{caja.zona.codigo}]
                </Badge>
                {caja.puertoAlimentadorId
                  ? <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                      <Zap className="h-3 w-3 mr-1" />Hija
                    </Badge>
                  : <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      <Wifi className="h-3 w-3 mr-1" />Principal
                    </Badge>}
              </div>
              <p className="text-muted-foreground text-sm mt-0.5">
                {caja.zona.cabecera.nombre}
                {caja.direccion && <> · <MapPin className="inline h-3 w-3 mx-0.5" />{caja.direccion}</>}
              </p>
            </div>
          </div>
        </div>

        <Link href={`/dashboard/infraestructura/cajas/${id}/editar`}>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Pencil className="h-4 w-4 mr-2" />Editar
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ── Columna izq: info técnica ────────────────────── */}
        <div className="space-y-4">
          {/* Datos técnicos */}
          <Card className="dark:bg-slate-900/50">
            <CardHeader><CardTitle className="text-base">Datos Técnicos</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Splitter</p>
                <p className="font-medium">{caja.splitterInstalado ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Capacidad</p>
                <p className="font-medium">{caja.capacidadPuertosTotal} puertos</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Ocupación</p>
                <div className="mt-1 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className={pct >= 90 ? "text-red-600" : pct >= 70 ? "text-yellow-600" : "text-green-600"}>
                      {pct}%
                    </span>
                    <span className="text-muted-foreground">
                      {caja.puertosUtilizados}/{caja.capacidadPuertosTotal}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-yellow-500" : "bg-green-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>

              {caja.puertoAlimentador && (
                <div>
                  <p className="text-muted-foreground text-xs">Alimentada desde</p>
                  <Link
                    href={`/dashboard/infraestructura/cajas/${caja.puertoAlimentador.cajaNap.id}`}
                    className="text-blue-600 hover:underline text-xs"
                  >
                    {caja.puertoAlimentador.cajaNap.zona.nombre} · Puerto {caja.puertoAlimentador.numeroPuerto}
                  </Link>
                </div>
              )}

              {latitud && longitud && (
                <div>
                  <p className="text-muted-foreground text-xs">Coordenadas GPS</p>
                  <p className="font-mono text-xs">{latitud}, {longitud}</p>
                  <a
                    href={`https://www.google.com/maps?q=${latitud},${longitud}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Ver en Google Maps →
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resumen de estados */}
          <Card className="dark:bg-slate-900/50">
            <CardHeader><CardTitle className="text-base">Estado de Puertos</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {[
                { label: "Disponibles",  val: disponibles,   Icon: Wifi,          color: "text-green-600 dark:text-green-400" },
                { label: "Ocupados",     val: ocupados,       Icon: User,          color: "text-blue-600 dark:text-blue-400" },
                { label: "Alimentador",  val: alimentadores,  Icon: Zap,           color: "text-purple-600 dark:text-purple-400" },
                { label: "Reservados",   val: reservados,     Icon: Lock,          color: "text-yellow-600 dark:text-yellow-400" },
                { label: "Dañados",      val: danados,        Icon: WifiOff,       color: "text-red-600 dark:text-red-400" },
              ].map(({ label, val, Icon, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Icon className={`h-3.5 w-3.5 ${color}`} />
                    {label}
                  </span>
                  <span className={`font-bold ${color}`}>{val}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {pct >= 80 && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 text-xs text-yellow-800 dark:text-yellow-400">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              Caja al {pct}% de capacidad. Considera agregar puertos o instalar una caja hija.
            </div>
          )}
        </div>

        {/* ── Panel de puertos ─────────────────────────────── */}
        <div className="lg:col-span-3">
          <Card className="dark:bg-slate-900/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Wifi className="h-4 w-4" />
                Puertos ({caja.capacidadPuertosTotal})
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Haz clic en cualquier puerto para ver opciones y cambiar su estado.
              </p>
            </CardHeader>
            <CardContent>
              <PuertosPanel
                cajaId={id}
                puertos={puertos}
                capacidad={caja.capacidadPuertosTotal}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
