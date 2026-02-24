export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"
import {
  Users, FileText, Package, DollarSign,
  TrendingUp, TrendingDown, AlertTriangle, Clock,
  CheckCircle2, ClipboardList, CreditCard, Boxes,
  ArrowRight, Activity, Wifi, WifiOff, BarChart3,
  PlayCircle, XCircle, AlertCircle,
} from "lucide-react"

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const showUnauthorized = params.error === "unauthorized"

  const hoy        = new Date()
  const inicioMes  = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  const inicioMesP = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
  const finMesP    = new Date(hoy.getFullYear(), hoy.getMonth(), 0, 23, 59, 59)
  const en7dias    = new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000)

  const [
    // ── Clientes
    totalClientes,
    clientesPorEstado,
    // ── Contratos
    contratosPorEstado,
    mrr,
    // ── Facturación
    cobradoMes,
    cobradoMesPasado,
    saldoPendienteTotal,
    facturasVencidas,
    facturasPorVencer,
    // ── Pedidos
    pedidosPorEstado,
    pedidosUltimos7,
    // ── Inventario
    itemsBajoStock,
    totalAsignaciones,
    asignacionesMes,
    // ── Pagos recientes
    pagosRecientes,
    // ── Pedidos recientes
    pedidosRecientes,
    // ── Alertas de inventario
    inventarioCritico,
  ] = await Promise.all([
    // Total clientes
    prisma.cliente.count(),
    // Clientes por estado
    prisma.cliente.groupBy({ by: ["estadoConexion"], _count: { id: true } }),
    // Contratos por estado
    prisma.contrato.groupBy({ by: ["estado"], _count: { id: true } }),
    // MRR = suma de montoActual de contratos ACTIVOS
    prisma.contrato.aggregate({
      _sum: { montoActual: true },
      where: { estado: "ACTIVO" },
    }),
    // Cobrado mes actual
    prisma.pago.aggregate({
      _sum: { montoPagado: true },
      where: { fechaPago: { gte: inicioMes } },
    }),
    // Cobrado mes pasado
    prisma.pago.aggregate({
      _sum: { montoPagado: true },
      where: { fechaPago: { gte: inicioMesP, lte: finMesP } },
    }),
    // Saldo pendiente total en facturas
    prisma.facturaRecibo.aggregate({
      _sum: { saldoPendiente: true },
      where: { saldoPendiente: { gt: 0 } },
    }),
    // Facturas vencidas (con saldo > 0 y fecha vencida)
    prisma.facturaRecibo.count({
      where: { saldoPendiente: { gt: 0 }, fechaVencimiento: { lt: hoy } },
    }),
    // Facturas por vencer (próximos 7 días)
    prisma.facturaRecibo.count({
      where: {
        saldoPendiente: { gt: 0 },
        fechaVencimiento: { gte: hoy, lt: en7dias },
      },
    }),
    // Pedidos por estado
    prisma.pedido.groupBy({ by: ["estado"], _count: { id: true } }),
    // Pedidos últimos 7 días
    prisma.pedido.count({
      where: { fechaSolicitud: { gte: new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000) } },
    }),
    // Items bajo punto de reorden (raw query porque Prisma no soporta comparar campos)
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint as count FROM "inventario" WHERE "cantidadDisponible" <= "puntoReorden"
    `.then((r) => Number(r[0]?.count ?? 0)),
    // Total asignaciones de materiales
    prisma.materialAsignado.count(),
    // Asignaciones este mes
    prisma.materialAsignado.count({
      where: { fechaAsignacion: { gte: inicioMes } },
    }),
    // Últimos 5 pagos
    prisma.pago.findMany({
      take: 5,
      orderBy: { fechaPago: "desc" },
      include: {
        cliente: {
          select: { persona: { select: { nombres: true, apellidos: true } } },
        },
        contrato: { select: { tarifaPlan: { select: { nombrePlan: true } } } },
      },
    }),
    // Últimos 5 pedidos
    prisma.pedido.findMany({
      take: 5,
      orderBy: { fechaSolicitud: "desc" },
      include: {
        cliente: {
          select: { persona: { select: { nombres: true, apellidos: true } } },
        },
        tipoPedido: { select: { nombre: true } },
      },
    }),
    // Inventario crítico (bajo reorden)
    prisma.$queryRaw<{ id: string; nombre: string; disponible: number; reorden: number }[]>`
      SELECT i.id, m.nombre, i."cantidadDisponible" as disponible, i."puntoReorden" as reorden
      FROM "inventario" i
      JOIN "material" m ON m.id = i."materialId"
      WHERE i."cantidadDisponible" <= i."puntoReorden"
      ORDER BY (i."cantidadDisponible"::float / NULLIF(i."puntoReorden", 0)) ASC
      LIMIT 5
    `,
  ])

  // ── Calcular valores derivados
  const cobradoMesNum    = Number(cobradoMes._sum.montoPagado    ?? 0)
  const cobradoMesPNum   = Number(cobradoMesPasado._sum.montoPagado ?? 0)
  const mrrNum           = Number(mrr._sum.montoActual ?? 0)
  const saldoTotalNum    = Number(saldoPendienteTotal._sum.saldoPendiente ?? 0)
  const itemsBajoNum     = typeof itemsBajoStock === "number" ? itemsBajoStock : 0

  const varMes = cobradoMesPNum > 0
    ? ((cobradoMesNum - cobradoMesPNum) / cobradoMesPNum) * 100
    : null

  const byEstadoCliente  = Object.fromEntries(clientesPorEstado.map((e) => [e.estadoConexion, e._count.id]))
  const byEstadoContrato = Object.fromEntries(contratosPorEstado.map((e) => [e.estado, e._count.id]))
  const byEstadoPedido   = Object.fromEntries(pedidosPorEstado.map((e) => [e.estado, e._count.id]))

  const mesActualLabel = hoy.toLocaleDateString("es-PE", { month: "long", year: "numeric" })

  const ESTADO_PEDIDO_CFG = {
    PENDIENTE:  { color: "bg-blue-400",   label: "Pendientes"  },
    EN_PROCESO: { color: "bg-amber-400",  label: "En proceso"  },
    COMPLETADO: { color: "bg-green-400",  label: "Completados" },
    CANCELADO:  { color: "bg-red-400",    label: "Cancelados"  },
  }

  return (
    <div className="space-y-6">
      {showUnauthorized && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          No tienes permisos para acceder a esa sección.
        </div>
      )}

      {/* ══════════════════════════════════════════
          HEADER
      ══════════════════════════════════════════ */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
            AdminWISP · Panel de Control
          </p>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        </div>
        <p className="text-sm text-muted-foreground capitalize">{mesActualLabel}</p>
      </div>

      {/* ══════════════════════════════════════════
          FILA 1 — KPIs FINANCIEROS (4 tarjetas)
      ══════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MRR */}
        <div className="relative rounded-xl border border-border bg-card p-5 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent pointer-events-none" />
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">ING. MENSUALES RECU.</p>
          <p className="text-2xl font-bold text-foreground">{formatCurrency(mrrNum)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {byEstadoContrato["ACTIVO"] ?? 0} contratos activos
          </p>
          <div className="absolute bottom-3 right-3 p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
        </div>

        {/* Cobrado este mes */}
        <div className="relative rounded-xl border border-border bg-card p-5 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Cobrado · {hoy.toLocaleDateString("es-PE", { month: "short" }).toUpperCase()}
          </p>
          <p className="text-2xl font-bold text-foreground">{formatCurrency(cobradoMesNum)}</p>
          {varMes !== null && (
            <p className={`text-xs mt-1 flex items-center gap-1 ${varMes >= 0 ? "text-green-600" : "text-red-500"}`}>
              {varMes >= 0
                ? <TrendingUp className="h-3 w-3" />
                : <TrendingDown className="h-3 w-3" />}
              {varMes >= 0 ? "+" : ""}{varMes.toFixed(1)}% vs mes anterior
            </p>
          )}
          {varMes === null && (
            <p className="text-xs text-muted-foreground mt-1">Primer período</p>
          )}
          <div className="absolute bottom-3 right-3 p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        {/* Saldo pendiente */}
        <div className="relative rounded-xl border border-border bg-card p-5 overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-br ${saldoTotalNum > 0 ? "from-orange-500/5" : "from-green-500/5"} to-transparent pointer-events-none`} />
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Por cobrar</p>
          <p className={`text-2xl font-bold ${saldoTotalNum > 0 ? "text-orange-600" : "text-green-600"}`}>
            {formatCurrency(saldoTotalNum)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {facturasVencidas > 0
              ? <span className="text-red-500">{facturasVencidas} factura{facturasVencidas > 1 ? "s" : ""} vencida{facturasVencidas > 1 ? "s" : ""}</span>
              : "Sin facturas vencidas"}
          </p>
          <div className="absolute bottom-3 right-3 p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
            <DollarSign className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </div>
        </div>

        {/* Clientes activos */}
        <div className="relative rounded-xl border border-border bg-card p-5 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none" />
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Clientes</p>
          <p className="text-2xl font-bold text-foreground">{totalClientes}</p>
          <p className="text-xs text-muted-foreground mt-1">
            <span className="text-green-600 font-semibold">{byEstadoCliente["ACTIVO"] ?? 0}</span> activos ·{" "}
            <span className="text-yellow-600 font-semibold">{byEstadoCliente["SUSPENDIDO"] ?? 0}</span> suspendidos
          </p>
          <div className="absolute bottom-3 right-3 p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
            <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          FILA 2 — ALERTAS CRÍTICAS (si las hay)
      ══════════════════════════════════════════ */}
      {(facturasVencidas > 0 || facturasPorVencer > 0 || itemsBajoNum > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {facturasVencidas > 0 && (
            <Link href="/dashboard/facturacion/facturas?estado=vencida"
              className="flex items-center gap-3 px-4 py-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors group">
              <div className="p-1.5 rounded-md bg-red-100 dark:bg-red-900/40 flex-shrink-0">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-red-700 dark:text-red-400">
                  {facturasVencidas} factura{facturasVencidas > 1 ? "s" : ""} vencida{facturasVencidas > 1 ? "s" : ""}
                </p>
                <p className="text-xs text-red-500">Requieren cobro inmediato</p>
              </div>
              <ArrowRight className="h-4 w-4 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          )}
          {facturasPorVencer > 0 && (
            <Link href="/dashboard/facturacion/facturas?estado=por_vencer"
              className="flex items-center gap-3 px-4 py-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100 dark:hover:bg-amber-950/40 transition-colors group">
              <div className="p-1.5 rounded-md bg-amber-100 dark:bg-amber-900/40 flex-shrink-0">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-amber-700 dark:text-amber-400">
                  {facturasPorVencer} por vencer en 7 días
                </p>
                <p className="text-xs text-amber-500">Notificar clientes</p>
              </div>
              <ArrowRight className="h-4 w-4 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          )}
          {itemsBajoNum > 0 && (
            <Link href="/dashboard/inventario"
              className="flex items-center gap-3 px-4 py-3 rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20 hover:bg-orange-100 dark:hover:bg-orange-950/40 transition-colors group">
              <div className="p-1.5 rounded-md bg-orange-100 dark:bg-orange-900/40 flex-shrink-0">
                <Boxes className="h-4 w-4 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-orange-700 dark:text-orange-400">
                  {itemsBajoNum} ítem{itemsBajoNum > 1 ? "s" : ""} bajo punto de reorden
                </p>
                <p className="text-xs text-orange-500">Revisar inventario</p>
              </div>
              <ArrowRight className="h-4 w-4 text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════
          FILA 3 — PEDIDOS + CLIENTES POR ESTADO
      ══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pedidos — estados en barras */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
              <p className="font-semibold text-sm">Pedidos por Estado</p>
            </div>
            <Link href="/dashboard/pedidos"
              className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Mini KPIs de pedidos */}
          <div className="grid grid-cols-4 gap-2 mb-5">
            {(["PENDIENTE","EN_PROCESO","COMPLETADO","CANCELADO"] as const).map((e) => {
              const cfg = ESTADO_PEDIDO_CFG[e]
              return (
                <div key={e} className="text-center p-2 rounded-lg bg-muted/30">
                  <p className="text-xl font-bold">{byEstadoPedido[e] ?? 0}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{cfg.label}</p>
                </div>
              )
            })}
          </div>

          {/* Barras proporcionales */}
          {(() => {
            const total = pedidosPorEstado.reduce((s, e) => s + e._count.id, 0)
            if (total === 0) return (
              <p className="text-sm text-muted-foreground text-center py-4">Sin pedidos registrados</p>
            )
            return (
              <div className="space-y-2.5">
                {(["PENDIENTE","EN_PROCESO","COMPLETADO","CANCELADO"] as const).map((e) => {
                  const cfg = ESTADO_PEDIDO_CFG[e]
                  const n   = byEstadoPedido[e] ?? 0
                  const pct = total > 0 ? (n / total) * 100 : 0
                  return (
                    <div key={e} className="flex items-center gap-3">
                      <p className="text-xs text-muted-foreground w-24 flex-shrink-0">{cfg.label}</p>
                      <div className="flex-1 bg-muted rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full ${cfg.color} transition-all`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs font-semibold w-6 text-right">{n}</p>
                    </div>
                  )
                })}
              </div>
            )
          })()}

          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>{pedidosUltimos7} nuevos en los últimos 7 días</span>
            <Link href="/dashboard/pedidos/nuevo"
              className="text-blue-600 hover:underline font-medium">
              + Nuevo pedido
            </Link>
          </div>
        </div>

        {/* Clientes por estado de conexión */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-muted-foreground" />
              <p className="font-semibold text-sm">Estado de Red</p>
            </div>
            <Link href="/dashboard/clientes"
              className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              Ver <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {[
              { key: "ACTIVO",     label: "Activos",     icon: Wifi,    color: "text-green-600",  dot: "bg-green-500"  },
              { key: "SUSPENDIDO", label: "Suspendidos", icon: Clock,   color: "text-yellow-600", dot: "bg-yellow-500" },
              { key: "CORTADO",    label: "Cortados",    icon: WifiOff, color: "text-orange-600", dot: "bg-orange-500" },
              { key: "PENDIENTE",  label: "Pendientes",  icon: Clock,   color: "text-blue-600",   dot: "bg-blue-500"   },
              { key: "BAJA",       label: "Dados de baja", icon: XCircle, color: "text-slate-500", dot: "bg-slate-400" },
            ].map(({ key, label, dot, color }) => {
              const n = byEstadoCliente[key] ?? 0
              if (n === 0) return null
              return (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${dot} flex-shrink-0`} />
                    <span className="text-sm text-muted-foreground">{label}</span>
                  </div>
                  <span className={`text-sm font-bold ${color}`}>{n}</span>
                </div>
              )
            })}
          </div>

          {/* Barra de distribución */}
          <div className="mt-4 flex h-2 rounded-full overflow-hidden gap-0.5">
            {[
              { key: "ACTIVO",     color: "bg-green-500"  },
              { key: "SUSPENDIDO", color: "bg-yellow-500" },
              { key: "CORTADO",    color: "bg-orange-500" },
              { key: "PENDIENTE",  color: "bg-blue-500"   },
              { key: "BAJA",       color: "bg-slate-400"  },
            ].map(({ key, color }) => {
              const n = byEstadoCliente[key] ?? 0
              if (n === 0 || totalClientes === 0) return null
              return (
                <div key={key} className={`${color} h-full`}
                  style={{ width: `${(n / totalClientes) * 100}%` }} />
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-1 text-right">
            {totalClientes} clientes total
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          FILA 4 — PAGOS RECIENTES + PEDIDOS RECIENTES
      ══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pagos recientes */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <p className="font-semibold text-sm">Últimos Pagos</p>
            </div>
            <Link href="/dashboard/facturacion/pagos"
              className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {pagosRecientes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Sin pagos registrados</p>
          ) : (
            <div className="space-y-1">
              {pagosRecientes.map((p) => (
                <Link key={p.id} href={`/dashboard/facturacion/pagos/${p.id}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors group">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {p.cliente.persona.nombres} {p.cliente.persona.apellidos ?? ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(p.fechaPago).toLocaleDateString("es-PE", { day: "2-digit", month: "short" })}
                      {" · "}{p.tipoPago}
                      {" · "}{p.contrato.tarifaPlan.nombrePlan}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-green-600 flex-shrink-0">
                    S/ {Number(p.montoPagado).toFixed(2)}
                  </p>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-border">
            <Link href="/dashboard/facturacion/pagos/nuevo"
              className="text-xs text-blue-600 hover:underline font-medium">
              + Registrar pago
            </Link>
          </div>
        </div>

        {/* Pedidos recientes */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
              <p className="font-semibold text-sm">Últimos Pedidos</p>
            </div>
            <Link href="/dashboard/pedidos"
              className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {pedidosRecientes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Sin pedidos registrados</p>
          ) : (
            <div className="space-y-1">
              {pedidosRecientes.map((p) => {
                const estadoCfg = {
                  PENDIENTE:  { color: "text-blue-600",   bg: "bg-blue-100   dark:bg-blue-900/30",   dot: "bg-blue-500"   },
                  EN_PROCESO: { color: "text-amber-600",  bg: "bg-amber-100  dark:bg-amber-900/30",  dot: "bg-amber-500"  },
                  COMPLETADO: { color: "text-green-600",  bg: "bg-green-100  dark:bg-green-900/30",  dot: "bg-green-500"  },
                  CANCELADO:  { color: "text-red-600",    bg: "bg-red-100    dark:bg-red-900/30",    dot: "bg-red-500"    },
                }[p.estado] ?? { color: "text-slate-600", bg: "bg-slate-100", dot: "bg-slate-400" }

                return (
                  <Link key={p.id} href={`/dashboard/pedidos/${p.id}`}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors group">
                    <span className={`w-2 h-2 rounded-full ${estadoCfg.dot} flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {p.cliente.persona.nombres} {p.cliente.persona.apellidos ?? ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {p.tipoPedido.nombre}
                        {" · "}{new Date(p.fechaSolicitud).toLocaleDateString("es-PE", { day: "2-digit", month: "short" })}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${estadoCfg.bg} ${estadoCfg.color}`}>
                      {p.estado.replace("_", " ")}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-border">
            <Link href="/dashboard/pedidos/nuevo"
              className="text-xs text-blue-600 hover:underline font-medium">
              + Nuevo pedido
            </Link>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          FILA 5 — INVENTARIO CRÍTICO + CONTRATOS
      ══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Inventario crítico */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <p className="font-semibold text-sm">Stock Bajo — Ítems Críticos</p>
            </div>
            <Link href="/dashboard/inventario"
              className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              Ver inventario <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {inventarioCritico.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <p className="text-sm text-muted-foreground">Todo el inventario está sobre el punto de reorden</p>
            </div>
          ) : (
            <div className="space-y-2">
              {inventarioCritico.map((item) => {
                const pct = item.reorden > 0 ? Math.min(100, (item.disponible / item.reorden) * 100) : 100
                const critical = pct <= 25
                return (
                  <div key={item.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate max-w-[60%]">{item.nombre}</p>
                      <p className={`text-xs font-bold ${critical ? "text-red-600" : "text-orange-600"}`}>
                        {item.disponible} / {item.reorden} mín
                      </p>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${critical ? "bg-red-500" : "bg-orange-400"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-border grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-lg font-bold">{totalAsignaciones}</p>
              <p className="text-xs text-muted-foreground">Asignaciones totales</p>
            </div>
            <div>
              <p className="text-lg font-bold text-blue-600">{asignacionesMes}</p>
              <p className="text-xs text-muted-foreground">Este mes</p>
            </div>
          </div>
        </div>

        {/* Contratos por estado + acciones rápidas */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <p className="font-semibold text-sm">Contratos</p>
            </div>
            <Link href="/dashboard/contratos"
              className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            {[
              { key: "ACTIVO",     label: "Activos",     color: "bg-green-50  dark:bg-green-950/20  border-green-200  dark:border-green-800", text: "text-green-700  dark:text-green-400" },
              { key: "PENDIENTE",  label: "Pendientes",  color: "bg-blue-50   dark:bg-blue-950/20   border-blue-200   dark:border-blue-800",  text: "text-blue-700   dark:text-blue-400"  },
              { key: "SUSPENDIDO", label: "Suspendidos", color: "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800",text: "text-yellow-700 dark:text-yellow-400"},
              { key: "CANCELADO",  label: "Cancelados",  color: "bg-red-50    dark:bg-red-950/20    border-red-200    dark:border-red-800",   text: "text-red-700    dark:text-red-400"   },
            ].map(({ key, label, color, text }) => (
              <div key={key} className={`rounded-lg border p-3 ${color}`}>
                <p className={`text-xl font-bold ${text}`}>{byEstadoContrato[key] ?? 0}</p>
                <p className={`text-xs ${text} opacity-80`}>{label}</p>
              </div>
            ))}
          </div>

          {/* Acciones rápidas */}
          <div className="border-t border-border pt-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Acciones rápidas
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { href: "/dashboard/clientes/nuevo",                label: "Nuevo cliente",   icon: Users    },
                { href: "/dashboard/contratos/nuevo",                label: "Nuevo contrato",  icon: FileText },
                { href: "/dashboard/facturacion/pagos/nuevo",        label: "Registrar pago",  icon: CreditCard },
                { href: "/dashboard/facturacion/facturas/nueva",     label: "Nueva factura",   icon: DollarSign },
              ].map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/40 hover:bg-muted/80 transition-colors text-xs font-medium text-foreground group">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-blue-600 transition-colors flex-shrink-0" />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
