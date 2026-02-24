export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft, Pencil, ClipboardList, User, FileText,
  Calendar, UserCog, ShieldCheck, Shield,
  Clock, PlayCircle, CheckCircle2, XCircle, AlertTriangle,
} from "lucide-react"
import Link from "next/link"
import { formatDate } from "@/lib/utils"
import CambiarEstadoPedidoBtn from "@/components/features/pedidos/CambiarEstadoPedidoBtn"

const ESTADO_CONFIG = {
  PENDIENTE:  { color: "bg-blue-100   text-blue-800   dark:bg-blue-900/30  dark:text-blue-400",   Icon: Clock        },
  EN_PROCESO: { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", Icon: PlayCircle   },
  COMPLETADO: { color: "bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-400",  Icon: CheckCircle2 },
  CANCELADO:  { color: "bg-red-100    text-red-800    dark:bg-red-900/30    dark:text-red-400",    Icon: XCircle      },
}
const PRIORIDAD_CONFIG: Record<string, { label: string; color: string }> = {
  BAJA:    { label: "Baja",    color: "bg-slate-100  text-slate-700  dark:bg-slate-800 dark:text-slate-300" },
  NORMAL:  { label: "Normal",  color: "bg-blue-100   text-blue-700   dark:bg-blue-900/30 dark:text-blue-400" },
  MEDIA:   { label: "Media",   color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  ALTA:    { label: "Alta",    color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  URGENTE: { label: "Urgente", color: "bg-red-100    text-red-700    dark:bg-red-900/30 dark:text-red-400" },
}

export default async function DetallePedidoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const pedidoRaw = await prisma.pedido.findUnique({
    where: { id },
    include: {
      cliente: {
        select: {
          id: true, codigoCliente: true, estadoConexion: true,
          persona: { select: { nombres: true, apellidos: true, telefono: true, email: true } },
        },
      },
      contrato: {
        select: {
          id: true, estado: true,
          tarifaPlan: { select: { nombrePlan: true } },
        },
      },
      tipoPedido: true,
    },
  })

  if (!pedidoRaw) notFound()

  // empleadoReceptorId es FK sin relación declarada — lo consultamos aparte
  const empRaw = await prisma.personaEmpleado.findUnique({
    where: { id: pedidoRaw.empleadoReceptorId },
    include: { persona: { select: { nombres: true, apellidos: true, telefono: true } } },
  })

  const pedido = {
    ...pedidoRaw,
    empleadoReceptor: {
      esTecnico: empRaw?.esTecnico ?? false,
      persona: {
        nombres:   empRaw?.persona.nombres   ?? "—",
        apellidos: empRaw?.persona.apellidos ?? null,
        telefono:  empRaw?.persona.telefono  ?? null,
      },
    },
  }

  const eCfg  = ESTADO_CONFIG[pedido.estado as keyof typeof ESTADO_CONFIG] ?? ESTADO_CONFIG.PENDIENTE
  const pCfg  = PRIORIDAD_CONFIG[pedido.tipoPedido.prioridadDefault] ?? PRIORIDAD_CONFIG.NORMAL
  const EIcon = eCfg.Icon

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/pedidos">
            <Button variant="ghost" size="icon" className="dark:hover:bg-slate-800">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <ClipboardList className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold font-mono tracking-tight">{pedido.numero}</h1>
                <Badge variant="secondary"
                  className={`${eCfg.color} flex items-center gap-1`}>
                  <EIcon className="h-3 w-3" />
                  {pedido.estado.replace("_", " ")}
                </Badge>
                <Badge variant="secondary" className={pCfg.color}>
                  {pCfg.label}
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm mt-0.5">
                {pedido.tipoPedido.nombre}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {pedido.estado !== "COMPLETADO" && pedido.estado !== "CANCELADO" && (
            <CambiarEstadoPedidoBtn pedidoId={id} estadoActual={pedido.estado} />
          )}
          {pedido.estado !== "CANCELADO" && (
            <Link href={`/dashboard/pedidos/${id}/editar`}>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Pencil className="h-4 w-4 mr-2" />Editar
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Motivo cancelación */}
      {pedido.estado === "CANCELADO" && pedido.motivoCancelacion && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm text-red-700 dark:text-red-400">Motivo de cancelación</p>
            <p className="text-sm text-red-600 dark:text-red-300 mt-0.5">{pedido.motivoCancelacion}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cliente */}
        <Card className="dark:bg-slate-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Link href={`/dashboard/clientes/${pedido.cliente.id}`}
              className="font-semibold text-blue-600 hover:underline block">
              {pedido.cliente.persona.nombres} {pedido.cliente.persona.apellidos ?? ""}
            </Link>
            <p className="text-muted-foreground text-xs">{pedido.cliente.codigoCliente ?? "—"}</p>
            {pedido.cliente.persona.telefono && (
              <p className="text-muted-foreground">{pedido.cliente.persona.telefono}</p>
            )}
            {pedido.cliente.persona.email && (
              <p className="text-muted-foreground text-xs">{pedido.cliente.persona.email}</p>
            )}
          </CardContent>
        </Card>

        {/* Tipo y Receptor */}
        <Card className="dark:bg-slate-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />Tipo de Pedido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-semibold">{pedido.tipoPedido.nombre}</p>
            {pedido.tipoPedido.descripcion && (
              <p className="text-muted-foreground text-xs">{pedido.tipoPedido.descripcion}</p>
            )}
            <div className="flex items-center gap-2 pt-1">
              <Badge variant="secondary" className={pCfg.color}>
                Prioridad: {pCfg.label}
              </Badge>
              {pedido.tipoPedido.requiereAprobacion
                ? <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                    <ShieldCheck className="h-3.5 w-3.5" />Requiere aprobación
                  </span>
                : <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Shield className="h-3.5 w-3.5" />Sin aprobación
                  </span>}
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
              <span className="text-muted-foreground">Solicitud:</span>
              <span>{formatDate(pedido.fechaSolicitud)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Receptor */}
        <Card className="dark:bg-slate-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserCog className="h-4 w-4" />Empleado Receptor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-semibold">
              {pedido.empleadoReceptor.persona.nombres}{" "}
              {pedido.empleadoReceptor.persona.apellidos ?? ""}
            </p>
            {pedido.empleadoReceptor.esTecnico && (
              <Badge variant="secondary"
                className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs">
                Técnico
              </Badge>
            )}
            {pedido.empleadoReceptor.persona.telefono && (
              <p className="text-muted-foreground">{pedido.empleadoReceptor.persona.telefono}</p>
            )}
          </CardContent>
        </Card>

        {/* Contrato (si aplica) */}
        {pedido.contrato && (
          <Card className="dark:bg-slate-900/50 md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />Contrato Asociado
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{pedido.contrato.tarifaPlan.nombrePlan}</p>
                  <Badge variant="secondary" className="mt-1 text-xs">{pedido.contrato.estado}</Badge>
                </div>
                <Link href={`/dashboard/contratos/${pedido.contrato.id}`}>
                  <Button variant="outline" size="sm" className="text-xs">
                    Ver contrato
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
