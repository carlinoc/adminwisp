export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft, Pencil, FileText, User, MapPin,
  Zap, ArrowDown, ArrowUp, CreditCard, Tv,
  Calendar, TrendingUp, CheckCircle, PauseCircle, XCircle, Clock,
} from "lucide-react"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils"
import CambiarEstadoContratoBtn from "@/components/features/contratos/CambiarEstadoContratoBtn"

const ESTADO_CONFIG = {
  ACTIVO:     { color: "bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-400",  Icon: CheckCircle },
  SUSPENDIDO: { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", Icon: PauseCircle },
  CANCELADO:  { color: "bg-red-100    text-red-800    dark:bg-red-900/30    dark:text-red-400",    Icon: XCircle },
  PENDIENTE:  { color: "bg-blue-100   text-blue-800   dark:bg-blue-900/30   dark:text-blue-400",   Icon: Clock },
}

export default async function DetalleContratoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const contrato = await prisma.contrato.findUnique({
    where: { id },
    include: {
      cliente: {
        select: {
          id: true, codigoCliente: true, estadoConexion: true,
          persona: { select: { nombres: true, apellidos: true, telefono: true, email: true } },
        },
      },
      tarifaPlan: true,
      ubicacionInstalacion: {
        include: { configuracionOnt: { select: { id: true, macOnt: true, pppoeUsuario: true, vlanGestion: true } } },
      },
      pagos: {
        orderBy: { fechaPago: "desc" },
        take: 8,
      },
      _count: { select: { pagos: true, facturas: true, pedidos: true } },
    },
  })

  if (!contrato) notFound()

  const cfg     = ESTADO_CONFIG[contrato.estado as keyof typeof ESTADO_CONFIG] ?? ESTADO_CONFIG.PENDIENTE
  const Icon    = cfg.Icon
  const plan    = contrato.tarifaPlan
  const cliente = contrato.cliente
  const ubi     = contrato.ubicacionInstalacion

  const totalPagado = contrato.pagos.reduce((s, p) => s + Number(p.montoPagado), 0)

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/contratos">
            <Button variant="ghost" size="icon" className="dark:hover:bg-slate-800">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-foreground">
                  {plan.nombrePlan}
                </h1>
                <Badge variant="secondary" className={`${cfg.color} flex items-center gap-1`}>
                  <Icon className="h-3 w-3" />{contrato.estado}
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm mt-0.5">
                {cliente.persona.nombres} {cliente.persona.apellidos ?? ""} · {cliente.codigoCliente ?? "—"}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <CambiarEstadoContratoBtn contratoId={id} estadoActual={contrato.estado} />
          <Link href={`/dashboard/contratos/${id}/editar`}>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Pencil className="h-4 w-4 mr-2" />Editar
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izq */}
        <div className="space-y-4">
          {/* Cliente */}
          <Card className="dark:bg-slate-900/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Link href={`/dashboard/clientes/${cliente.id}`}
                className="font-semibold text-blue-600 hover:underline">
                {cliente.persona.nombres} {cliente.persona.apellidos}
              </Link>
              <p className="text-muted-foreground">{cliente.codigoCliente}</p>
              {cliente.persona.telefono && <p>{cliente.persona.telefono}</p>}
              {cliente.persona.email    && <p className="text-xs">{cliente.persona.email}</p>}
            </CardContent>
          </Card>

          {/* Plan */}
          <Card className="dark:bg-slate-900/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4" />Plan de Tarifa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-semibold">{plan.nombrePlan}</p>
              <div className="flex gap-3">
                <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <ArrowDown className="h-3.5 w-3.5" />{plan.velocidadDescarga}
                </span>
                <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                  <ArrowUp className="h-3.5 w-3.5" />{plan.velocidadSubida}
                </span>
              </div>
              {plan.incluyeTv && (
                <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 text-xs">
                  <Tv className="h-3.5 w-3.5" />{plan.nroTvsBase} TV{plan.nroTvsBase !== 1 ? "s" : ""}
                </span>
              )}
              <div className="pt-1 border-t border-border space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Tarifa base plan:</span>
                  <span className="font-medium text-foreground">{formatCurrency(Number(plan.tarifaMensual))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Monto pactado:</span>
                  <span className="font-bold text-green-600 text-sm">{formatCurrency(Number(contrato.montoActual))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Comisión vendedor:</span>
                  <span>{formatCurrency(Number(contrato.comisionGenerada))}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fechas */}
          <Card className="dark:bg-slate-900/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />Fechas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contrato:</span>
                <span>{formatDate(contrato.fechaContrato)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Inicio servicio:</span>
                <span>{contrato.fechaInicioServicio ? formatDate(contrato.fechaInicioServicio) : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Día de corte:</span>
                <span className="font-medium">Día {contrato.cicloFacturacion}</span>
              </div>
            </CardContent>
          </Card>

          {/* Ubicación */}
          <Card className="dark:bg-slate-900/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />Instalación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>{ubi.direccion}</p>
              {ubi.configuracionOnt && (
                <div className="pt-2 border-t border-border space-y-1 text-xs">
                  <p className="font-semibold text-green-700 dark:text-green-400">ONT Configurado</p>
                  <p><span className="text-muted-foreground">MAC: </span>
                    <span className="font-mono">{ubi.configuracionOnt.macOnt}</span></p>
                  <p><span className="text-muted-foreground">VLAN: </span>
                    {ubi.configuracionOnt.vlanGestion}</p>
                  <p><span className="text-muted-foreground">PPPoE: </span>
                    <span className="font-mono">{ubi.configuracionOnt.pppoeUsuario}</span></p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Columna derecha */}
        <div className="lg:col-span-2 space-y-4">
          {/* Resumen financiero */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="dark:bg-slate-900/50">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Pagos registrados</p>
                <p className="text-2xl font-bold">{contrato._count.pagos}</p>
              </CardContent>
            </Card>
            <Card className="dark:bg-slate-900/50">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Facturas</p>
                <p className="text-2xl font-bold">{contrato._count.facturas}</p>
              </CardContent>
            </Card>
            <Card className="dark:bg-slate-900/50">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Total cobrado (últimos 8)</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(totalPagado)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Últimos pagos */}
          <Card className="dark:bg-slate-900/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />Últimos Pagos
                </CardTitle>
                <Link href={`/dashboard/contratos/nuevo?clienteId=${cliente.id}`}>
                  <Button size="sm" variant="outline" className="text-xs h-7">+ Registrar pago</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {contrato.pagos.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-6">Sin pagos registrados</p>
              ) : (
                <div className="space-y-2">
                  {contrato.pagos.map((pago) => (
                    <div key={pago.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border text-sm">
                      <div>
                        <p className="font-medium">{formatDate(pago.fechaPago)}</p>
                        <p className="text-xs text-muted-foreground">{pago.tipoPago}
                          {pago.masDetalles && ` · ${pago.masDetalles}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{formatCurrency(Number(pago.montoPagado))}</p>

                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
