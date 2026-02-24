import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, FileText, CreditCard } from "lucide-react"
import Link from "next/link"
import { ESTADO_COLORS, formatCurrency, formatDate } from "@/lib/utils"
import CambiarEstadoCliente from "@/components/features/clientes/CambiarEstadoCliente"
import UbicacionesPanel from "@/components/features/clientes/UbicacionesPanel"

export default async function DetalleClientePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [cliente, puertosDisponiblesRaw] = await Promise.all([
    prisma.cliente.findUnique({
      where: { id },
      include: {
        persona:  { include: { personaJuridica: true } },
        zona:     { include: { cabecera: true } },
        vendedor: true,
        puerto: {
          include: {
            cajaNap: {
              select: {
                id: true,
                direccion: true,
                zona: { select: { nombre: true, codigo: true } },
              },
            },
          },
        },
        contratos: {
          include: { tarifaPlan: true },
          orderBy: { fechaContrato: "desc" },
        },
        pagos: {
          orderBy: { fechaPago: "desc" },
          take: 5,
        },
        ubicaciones: {
          include: {
            configuracionOnt: {
              select: { id: true, macOnt: true, vlanGestion: true, pppoeUsuario: true, configWifi: true },
            },
            contratos: { select: { id: true, estado: true } },
          },
          orderBy: { id: "asc" },
        },
      },
    }),
    prisma.puerto.findMany({
      where: { estado: "DISPONIBLE", clienteAsignadoId: null },
      include: {
        cajaNap: {
          select: {
            id: true,
            direccion: true,
            zona: { select: { nombre: true, codigo: true } },
          },
        },
      },
      orderBy: [
        { cajaNap: { zona: { nombre: "asc" } } },
        { numeroPuerto: "asc" },
      ],
    }),
  ])

  if (!cliente) notFound()

  const p          = cliente.persona
  const esJuridica = p.tipoEntidad === "JURIDICO"

  const puertoActual = cliente.puerto
    ? {
        id:           cliente.puerto.id,
        numeroPuerto: cliente.puerto.numeroPuerto,
        cajaNap: {
          id:        cliente.puerto.cajaNap.id,
          direccion: cliente.puerto.cajaNap.direccion,
          zona:      cliente.puerto.cajaNap.zona,
        },
      }
    : null

  const puertosDisponibles = puertosDisponiblesRaw.map((p) => ({
    id:           p.id,
    numeroPuerto: p.numeroPuerto,
    cajaNap: {
      id:        p.cajaNap.id,
      direccion: p.cajaNap.direccion,
      zona:      p.cajaNap.zona,
    },
  }))

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/clientes">
            <Button variant="ghost" size="icon" className="dark:hover:bg-slate-800">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {p.nombres} {p.apellidos ?? ""}
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {cliente.codigoCliente} · {esJuridica ? "Persona Jurídica" : "Persona Natural"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CambiarEstadoCliente clienteId={cliente.id} estadoActual={cliente.estadoConexion} />
          <Link href={`/dashboard/clientes/${id}/editar`}>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Edit className="h-4 w-4 mr-2" />Editar
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda */}
        <div className="space-y-6">
          <Card className="dark:bg-slate-900/50">
            <CardHeader><CardTitle className="text-base">Información del Cliente</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estado</span>
                <Badge variant="secondary"
                  className={ESTADO_COLORS[cliente.estadoConexion as keyof typeof ESTADO_COLORS]}>
                  {cliente.estadoConexion}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Código</span>
                <span className="font-medium">{cliente.codigoCliente}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Alta</span>
                <span>{formatDate(cliente.fechaAlta)}</span>
              </div>
              {cliente.fechaBaja && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Baja</span>
                  <span>{formatDate(cliente.fechaBaja)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Saldo a favor</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(Number(cliente.saldoFavor))}
                </span>
              </div>
              {esJuridica && p.personaJuridica && (
                <>
                  <hr className="dark:border-slate-700" />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">RUC</span>
                    <span>{p.personaJuridica.ruc}</span>
                  </div>
                </>
              )}
              {!esJuridica && p.dni && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">DNI</span>
                  <span>{p.dni}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="dark:bg-slate-900/50">
            <CardHeader><CardTitle className="text-base">Contacto</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs mb-0.5">Email</p>
                <p>{p.email ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-0.5">Teléfono</p>
                <p>{p.telefono ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-0.5">Dirección</p>
                <p>{p.direccion ?? "—"}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-slate-900/50">
            <CardHeader><CardTitle className="text-base">Servicio</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs mb-0.5">Zona</p>
                <p>{cliente.zona?.nombre ?? "Sin zona"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-0.5">Cabecera</p>
                <p>{cliente.zona?.cabecera?.nombre ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-0.5">Vendedor</p>
                <p>
                  {cliente.vendedor
                    ? `${cliente.vendedor.nombres} ${cliente.vendedor.apellidos ?? ""}`
                    : "—"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna derecha (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="dark:bg-slate-900/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4" />
                  Contratos ({cliente.contratos.length})
                </CardTitle>
                <Link href={`/dashboard/contratos/nuevo?clienteId=${id}`}>
                  <Button size="sm" variant="outline">+ Contrato</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {cliente.contratos.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-6">Sin contratos registrados</p>
              ) : (
                <div className="space-y-3">
                  {cliente.contratos.map((c) => (
                    <div key={c.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border">
                      <div>
                        <p className="font-medium text-sm">{c.tarifaPlan.nombrePlan}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.tarifaPlan.velocidadDescarga} ↓ / {c.tarifaPlan.velocidadSubida} ↑ ·{" "}
                          Inicio: {c.fechaInicioServicio ? formatDate(c.fechaInicioServicio) : "—"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">{formatCurrency(Number(c.montoActual))}/mes</p>
                        <Badge variant="secondary"
                          className={ESTADO_COLORS[c.estado as keyof typeof ESTADO_COLORS]}>
                          {c.estado}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="dark:bg-slate-900/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-4 w-4" />Últimos Pagos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cliente.pagos.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-6">Sin pagos registrados</p>
              ) : (
                <div className="space-y-3">
                  {cliente.pagos.map((pago) => (
                    <div key={pago.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border">
                      <div>
                        <p className="text-sm font-medium">
                          {new Date(pago.fechaPago).toLocaleDateString("es-PE", {
                            day: "2-digit", month: "long", year: "numeric",
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">{pago.tipoPago}</p>
                      </div>
                      <p className="font-semibold text-green-600">
                        {formatCurrency(Number(pago.montoPagado))}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Puerto NAP + Ubicaciones + ConfiguracionONT */}
          <UbicacionesPanel
            clienteId={id}
            puertoActualId={cliente.puertoId}
            puertoActual={puertoActual}
            puertosDisponibles={puertosDisponibles}
            ubicaciones={cliente.ubicaciones.map((u) => ({
              id:               u.id,
              direccion:        u.direccion,
              latitud:          u.latitud  ? Number(u.latitud)  : null,
              longitud:         u.longitud ? Number(u.longitud) : null,
              referenciaVisual: u.referenciaVisual,
              contratos:        u.contratos,
              configuracionOnt: u.configuracionOnt ?? null,
            }))}
          />
        </div>
      </div>
    </div>
  )
}
