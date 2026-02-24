import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DollarSign, FileText, CreditCard, TrendingUp,
  AlertTriangle, CheckCircle2, Clock, Plus,
} from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"

export default async function FacturacionPage() {
  const hoy   = new Date()
  const [
    totalFacturado, totalPagado, totalPendiente,
    facturasVencidas, facturasPorVencer,
    pagosEsteMes, totalPagosEsteMes,
    contratosActivos,
  ] = await Promise.all([
    prisma.facturaRecibo.aggregate({ _sum: { montoTotal: true } }),
    prisma.facturaRecibo.aggregate({ _sum: { montoTotal: true }, where: { saldoPendiente: 0 } }),
    prisma.facturaRecibo.aggregate({ _sum: { saldoPendiente: true }, where: { saldoPendiente: { gt: 0 } } }),
    prisma.facturaRecibo.count({
      where: {
        saldoPendiente: { gt: 0 },
        fechaVencimiento: { lt: hoy },
      },
    }),
    prisma.facturaRecibo.count({
      where: {
        saldoPendiente: { gt: 0 },
        fechaVencimiento: {
          gte: hoy,
          lt:  new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),
    prisma.pago.count({
      where: {
        fechaPago: {
          gte: new Date(hoy.getFullYear(), hoy.getMonth(), 1),
          lt:  new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1),
        },
      },
    }),
    prisma.pago.aggregate({
      _sum: { montoPagado: true },
      where: {
        fechaPago: {
          gte: new Date(hoy.getFullYear(), hoy.getMonth(), 1),
          lt:  new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1),
        },
      },
    }),
    prisma.contrato.count({ where: { estado: "ACTIVO" } }),
  ])

  const mTotal    = Number(totalFacturado._sum.montoTotal    ?? 0)
  const mPendiente = Number(totalPendiente._sum.saldoPendiente ?? 0)
  const mMes      = Number(totalPagosEsteMes._sum.montoPagado  ?? 0)

  const STATS = [
    { label: "Total Facturado",    value: formatCurrency(mTotal),    Icon: FileText,    color: "text-blue-600",   bg: "bg-blue-100 dark:bg-blue-900/30" },
    { label: "Saldo Pendiente",    value: formatCurrency(mPendiente), Icon: Clock,       color: "text-orange-600", bg: "bg-orange-100 dark:bg-orange-900/30" },
    { label: "Cobrado este mes",   value: formatCurrency(mMes),       Icon: CreditCard,  color: "text-green-600",  bg: "bg-green-100 dark:bg-green-900/30" },
    { label: "Contratos activos",  value: String(contratosActivos),   Icon: TrendingUp,  color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/30" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Facturación</h1>
        <p className="text-muted-foreground mt-1">Resumen financiero del sistema</p>
      </div>

      {/* Stats principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATS.map(({ label, value, Icon, color, bg }) => (
          <Card key={label} className="dark:bg-slate-900/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${bg} flex-shrink-0`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={`text-lg font-bold ${color}`}>{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alertas */}
      {(facturasVencidas > 0 || facturasPorVencer > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {facturasVencidas > 0 && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm text-red-700 dark:text-red-400">
                  {facturasVencidas} factura{facturasVencidas > 1 ? "s" : ""} vencida{facturasVencidas > 1 ? "s" : ""}
                </p>
                <p className="text-xs text-red-600 dark:text-red-300">Requieren atención inmediata</p>
              </div>
              <Link href="/dashboard/facturacion/facturas?estado=vencida" className="ml-auto">
                <Button variant="outline" size="sm" className="text-xs border-red-300">Ver</Button>
              </Link>
            </div>
          )}
          {facturasPorVencer > 0 && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
              <Clock className="h-5 w-5 text-orange-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm text-orange-700 dark:text-orange-400">
                  {facturasPorVencer} factura{facturasPorVencer > 1 ? "s" : ""} por vencer
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-300">Próximos 7 días</p>
              </div>
              <Link href="/dashboard/facturacion/facturas?estado=por_vencer" className="ml-auto">
                <Button variant="outline" size="sm" className="text-xs border-orange-300">Ver</Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Accesos rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="dark:bg-slate-900/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-5 w-5" />Facturas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Gestiona las facturas mensuales de los contratos activos.
            </p>
            <div className="flex gap-2">
              <Link href="/dashboard/facturacion/facturas">
                <Button variant="outline" size="sm">Ver todas</Button>
              </Link>
              <Link href="/dashboard/facturacion/facturas/nueva">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-3.5 w-3.5 mr-1" />Nueva factura
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-900/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-5 w-5" />Pagos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Registra cobros y aplícalos a las facturas pendientes.
              Este mes: <strong className="text-foreground">{pagosEsteMes} pago{pagosEsteMes !== 1 ? "s" : ""}</strong>.
            </p>
            <div className="flex gap-2">
              <Link href="/dashboard/facturacion/pagos">
                <Button variant="outline" size="sm">Ver todos</Button>
              </Link>
              <Link href="/dashboard/facturacion/pagos/nuevo">
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                  <Plus className="h-3.5 w-3.5 mr-1" />Registrar pago
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
