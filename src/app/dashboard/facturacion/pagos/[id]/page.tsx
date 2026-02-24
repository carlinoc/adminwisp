export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft, CreditCard, User, Calendar,
  FileText, Trash2, CheckCircle2,
} from "lucide-react"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils"
import EliminarPagoBtn from "@/components/features/facturacion/EliminarPagoBtn"

const TIPO_PAGO_COLOR: Record<string, string> = {
  EFECTIVO:      "bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-400",
  TRANSFERENCIA: "bg-blue-100   text-blue-800   dark:bg-blue-900/30   dark:text-blue-400",
  TARJETA:       "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  YAPE:          "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400",
  PLIN:          "bg-cyan-100   text-cyan-800   dark:bg-cyan-900/30   dark:text-cyan-400",
}

export default async function DetallePagoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const pago = await prisma.pago.findUnique({
    where: { id },
    include: {
      cliente: {
        select: {
          id: true, codigoCliente: true, saldoFavor: true,
          persona: { select: { nombres: true, apellidos: true, telefono: true, email: true } },
        },
      },
      contrato: {
        select: {
          id: true,
          tarifaPlan: { select: { nombrePlan: true } },
        },
      },
      detallesPagoFactura: {
        include: {
          facturaRecibo: {
            select: {
              id: true, periodoFacturado: true,
              fechaVencimiento: true, montoTotal: true, saldoPendiente: true,
            },
          },
        },
        orderBy: { facturaRecibo: { periodoFacturado: "asc" } },
      },
    },
  })

  if (!pago) notFound()

  const montoPagado   = Number(pago.montoPagado)
  const totalAplicado = pago.detallesPagoFactura.reduce(
    (s, d) => s + Number(d.montoAplicado), 0
  )
  const sobrante = montoPagado - totalAplicado

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/facturacion/pagos">
            <Button variant="ghost" size="icon" className="dark:hover:bg-slate-800">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-green-100 dark:bg-green-900/30">
              <CreditCard className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold">
                  Pago — {formatCurrency(montoPagado)}
                </h1>
                <Badge variant="secondary"
                  className={TIPO_PAGO_COLOR[pago.tipoPago] ?? ""}>
                  {pago.tipoPago}
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm mt-0.5">
                {formatDate(pago.fechaPago)} · {pago.contrato.tarifaPlan.nombrePlan}
              </p>
            </div>
          </div>
        </div>
        <EliminarPagoBtn pagoId={id} monto={montoPagado} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Resumen del pago */}
        <Card className="dark:bg-slate-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wide">
              Resumen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monto recibido:</span>
              <span className="font-bold text-lg text-green-600">{formatCurrency(montoPagado)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Aplicado a facturas:</span>
              <span className="font-semibold text-blue-600">{formatCurrency(totalAplicado)}</span>
            </div>
            {sobrante > 0.005 && (
              <div className="flex justify-between border-t border-border pt-2">
                <span className="text-muted-foreground">Saldo a favor:</span>
                <span className="font-bold text-purple-600">{formatCurrency(sobrante)}</span>
              </div>
            )}
            {pago.masDetalles && (
              <div className="border-t border-border pt-2">
                <p className="text-xs text-muted-foreground mb-1">Referencia / detalles:</p>
                <p className="text-sm">{pago.masDetalles}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fecha y tipo */}
        <Card className="dark:bg-slate-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wide">
              Datos del pago
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Fecha de pago</p>
                <p className="font-medium">{formatDate(pago.fechaPago)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Tipo de pago</p>
                <Badge variant="secondary" className={`${TIPO_PAGO_COLOR[pago.tipoPago] ?? ""} mt-0.5`}>
                  {pago.tipoPago}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Contrato</p>
                <Link href={`/dashboard/contratos/${pago.contrato.id}`}
                  className="font-medium text-blue-600 hover:underline">
                  {pago.contrato.tarifaPlan.nombrePlan}
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cliente */}
        <Card className="dark:bg-slate-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wide">
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Link href={`/dashboard/clientes/${pago.cliente.id}`}
              className="font-semibold text-blue-600 hover:underline block">
              {pago.cliente.persona.nombres} {pago.cliente.persona.apellidos ?? ""}
            </Link>
            <p className="text-xs text-muted-foreground">{pago.cliente.codigoCliente ?? "—"}</p>
            {pago.cliente.persona.telefono && (
              <p className="text-muted-foreground">{pago.cliente.persona.telefono}</p>
            )}
            {Number(pago.cliente.saldoFavor) > 0 && (
              <div className="mt-2 p-2 rounded bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
                <p className="text-xs text-purple-600 dark:text-purple-400">
                  Saldo a favor: <strong>{formatCurrency(Number(pago.cliente.saldoFavor))}</strong>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Facturas aplicadas */}
      <Card className="dark:bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Facturas a las que se aplicó este pago ({pago.detallesPagoFactura.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pago.detallesPagoFactura.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">
              Este pago no fue aplicado a ninguna factura.
              {sobrante > 0.005 && ` El monto completo se registró como saldo a favor.`}
            </p>
          ) : (
            <div className="space-y-3">
              {pago.detallesPagoFactura.map((d) => {
                const f           = d.facturaRecibo
                const mTotal      = Number(f.montoTotal)
                const sPendiente  = Number(f.saldoPendiente)
                const mAplicado   = Number(d.montoAplicado)
                const pagada      = sPendiente <= 0

                return (
                  <div key={d.id}
                    className="flex items-center gap-4 p-4 rounded-lg border border-border bg-muted/20">
                    <div className="flex-1 min-w-0">
                      <Link href={`/dashboard/facturacion/facturas/${f.id}`}
                        className="font-medium text-sm hover:underline text-blue-600">
                        Período:{" "}
                        {new Date(f.periodoFacturado.toISOString().split("T")[0] + "T12:00:00")
                          .toLocaleDateString("es-PE", { year: "numeric", month: "long" })}
                      </Link>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Total factura: {formatCurrency(mTotal)} ·
                        Vence: {formatDate(f.fechaVencimiento)}
                      </p>
                      {/* Barra de progreso de cobro */}
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 bg-muted rounded-full h-1.5">
                          <div
                            className="bg-green-500 h-1.5 rounded-full"
                            style={{ width: `${Math.min(100, ((mTotal - sPendiente) / mTotal) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatCurrency(mTotal - sPendiente)} / {formatCurrency(mTotal)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold text-green-600">+{formatCurrency(mAplicado)}</p>
                      {pagada
                        ? <Badge variant="secondary"
                            className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            Pagada
                          </Badge>
                        : <p className="text-xs text-muted-foreground">
                            Saldo: {formatCurrency(sPendiente)}
                          </p>
                      }
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
