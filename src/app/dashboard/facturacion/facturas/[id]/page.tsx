export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft, FileText, User, Calendar, CreditCard,
  CheckCircle2, Clock, AlertTriangle, Pencil, Plus,
} from "lucide-react"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils"

export default async function DetalleFacturaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const factura = await prisma.facturaRecibo.findUnique({
    where: { id },
    include: {
      contrato: {
        include: {
          tarifaPlan: { select: { nombrePlan: true, velocidadDescarga: true, velocidadSubida: true } },
          cliente: {
            select: {
              id: true, codigoCliente: true,
              persona: { select: { nombres: true, apellidos: true, telefono: true } },
            },
          },
        },
      },
      detallesPagoFactura: {
        include: {
          pago: {
            select: { id: true, fechaPago: true, montoPagado: true, tipoPago: true, masDetalles: true },
          },
        },
        orderBy: { pago: { fechaPago: "desc" } },
      },
    },
  })

  if (!factura) notFound()

  const montoTotal     = Number(factura.montoTotal)
  const saldoPendiente = Number(factura.saldoPendiente)
  const totalPagado    = montoTotal - saldoPendiente
  const hoy            = new Date()
  const vence          = new Date(factura.fechaVencimiento)
  const diasRestantes  = Math.ceil((vence.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))

  const estadoFactura =
    saldoPendiente <= 0      ? { label: "Pagada",     color: "bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-400",  Icon: CheckCircle2 }
    : diasRestantes < 0      ? { label: "Vencida",    color: "bg-red-100    text-red-800    dark:bg-red-900/30    dark:text-red-400",    Icon: AlertTriangle }
    : diasRestantes <= 5     ? { label: "Por vencer", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400", Icon: AlertTriangle }
    :                          { label: "Pendiente",  color: "bg-blue-100   text-blue-800   dark:bg-blue-900/30   dark:text-blue-400",   Icon: Clock }

  const EIcon = estadoFactura.Icon

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/facturacion/facturas">
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
                <h1 className="text-xl font-bold">
                  {new Date(factura.periodoFacturado.toISOString().split("T")[0] + "T12:00:00")
                    .toLocaleDateString("es-PE", { year: "numeric", month: "long" })}
                </h1>
                <Badge variant="secondary" className={`${estadoFactura.color} flex items-center gap-1`}>
                  <EIcon className="h-3 w-3" />{estadoFactura.label}
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm mt-0.5">
                {factura.contrato.cliente.persona.nombres}{" "}
                {factura.contrato.cliente.persona.apellidos ?? ""}
                {" · "}{factura.contrato.tarifaPlan.nombrePlan}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {saldoPendiente > 0 && (
            <Link href={`/dashboard/facturacion/pagos/nuevo?contratoId=${factura.contratoId}&clienteId=${factura.contrato.cliente.id}`}>
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                <Plus className="h-4 w-4 mr-2" />Registrar Pago
              </Button>
            </Link>
          )}
          <Link href={`/dashboard/facturacion/facturas/${id}/editar`}>
            <Button variant="outline">
              <Pencil className="h-4 w-4 mr-2" />Editar
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Montos */}
        <Card className="dark:bg-slate-900/50">
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Monto total:</span>
              <span className="font-semibold">{formatCurrency(montoTotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total pagado:</span>
              <span className="font-semibold text-green-600">{formatCurrency(totalPagado)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2">
              <span className="text-sm text-muted-foreground">Saldo pendiente:</span>
              <span className={`font-bold text-lg ${saldoPendiente > 0 ? "text-orange-600" : "text-green-600"}`}>
                {formatCurrency(saldoPendiente)}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(100, (totalPagado / montoTotal) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-right">
              {Math.round((totalPagado / montoTotal) * 100)}% cobrado
            </p>
          </CardContent>
        </Card>

        {/* Fechas */}
        <Card className="dark:bg-slate-900/50">
          <CardContent className="p-4 space-y-3 text-sm">
            <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">Fechas</p>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Período:</span>
              <span className="font-medium">
                {new Date(factura.periodoFacturado.toISOString().split("T")[0] + "T12:00:00")
                  .toLocaleDateString("es-PE", { year: "numeric", month: "long" })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vencimiento:</span>
              <span className="font-medium">{formatDate(factura.fechaVencimiento)}</span>
            </div>
            {saldoPendiente > 0 && (
              <div className={`text-xs text-center py-1 rounded px-2 ${
                diasRestantes < 0 ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                : diasRestantes <= 5 ? "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400"
                : "bg-muted text-muted-foreground"}`}>
                {diasRestantes < 0
                  ? `Vencida hace ${Math.abs(diasRestantes)} días`
                  : `Vence en ${diasRestantes} días`}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cliente */}
        <Card className="dark:bg-slate-900/50">
          <CardContent className="p-4 space-y-2 text-sm">
            <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">Cliente</p>
            <Link href={`/dashboard/clientes/${factura.contrato.cliente.id}`}
              className="font-semibold text-blue-600 hover:underline block">
              {factura.contrato.cliente.persona.nombres}{" "}
              {factura.contrato.cliente.persona.apellidos ?? ""}
            </Link>
            <p className="text-muted-foreground text-xs">{factura.contrato.cliente.codigoCliente ?? "—"}</p>
            {factura.contrato.cliente.persona.telefono && (
              <p>{factura.contrato.cliente.persona.telefono}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pagos aplicados */}
      <Card className="dark:bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Pagos Aplicados ({factura.detallesPagoFactura.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {factura.detallesPagoFactura.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">Sin pagos aplicados aún.</p>
          ) : (
            <div className="space-y-2">
              {factura.detallesPagoFactura.map((d) => (
                <div key={d.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border text-sm">
                  <div>
                    <Link href={`/dashboard/facturacion/pagos/${d.pago.id}`}
                      className="font-medium hover:underline text-blue-600">
                      Pago del {formatDate(d.pago.fechaPago)}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {d.pago.tipoPago}
                      {d.pago.masDetalles && ` · ${d.pago.masDetalles}`}
                      {" · "}Total recibido: {formatCurrency(Number(d.pago.montoPagado))}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      {formatCurrency(Number(d.montoAplicado))}
                    </p>
                    <p className="text-xs text-muted-foreground">aplicado</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
