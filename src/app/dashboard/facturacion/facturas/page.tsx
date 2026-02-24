import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileText, Plus, CheckCircle2, Clock, AlertTriangle } from "lucide-react"
import Link from "next/link"
import FacturasTable from "@/components/features/facturacion/FacturasTable"
import { formatCurrency } from "@/lib/utils"

export default async function FacturasPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; estado?: string }>
}) {
  const params = await searchParams
  const search = params.search || ""
  const estado = params.estado || ""

  const hoy = new Date()

  // Construir filtro base
  const where: Record<string, unknown> = {}
  if (search) {
    where.OR = [
      { contrato: { cliente: { persona: { nombres:   { contains: search, mode: "insensitive" } } } } },
      { contrato: { cliente: { persona: { apellidos: { contains: search, mode: "insensitive" } } } } },
      { contrato: { cliente: { codigoCliente: { contains: search, mode: "insensitive" } } } },
      { contrato: { tarifaPlan: { nombrePlan: { contains: search, mode: "insensitive" } } } },
    ]
  }
  if (estado === "pagada")    where.saldoPendiente = 0
  if (estado === "pendiente") where.saldoPendiente = { gt: 0 }
  if (estado === "vencida") {
    where.saldoPendiente = { gt: 0 }
    where.fechaVencimiento = { lt: hoy }
  }
  if (estado === "por_vencer") {
    where.saldoPendiente = { gt: 0 }
    where.fechaVencimiento = {
      gte: hoy,
      lt:  new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000),
    }
  }

  const [facturasRaw, stats] = await Promise.all([
    prisma.facturaRecibo.findMany({
      where,
      include: {
        contrato: {
          select: {
            id: true,
            tarifaPlan: { select: { nombrePlan: true } },
            cliente: {
              select: {
                id: true, codigoCliente: true,
                persona: { select: { nombres: true, apellidos: true } },
              },
            },
          },
        },
        _count: { select: { detallesPagoFactura: true } },
      },
      orderBy: [{ saldoPendiente: "desc" }, { fechaVencimiento: "asc" }],
    }),
    prisma.facturaRecibo.groupBy({
      by: ["saldoPendiente"],
      _count: { id: true },
      _sum:   { saldoPendiente: true, montoTotal: true },
    }),
  ])

  const facturas = facturasRaw.map((f) => ({
    ...f,
    montoTotal:      Number(f.montoTotal),
    saldoPendiente:  Number(f.saldoPendiente),
    periodoFacturado: f.periodoFacturado.toISOString().split("T")[0],
    fechaVencimiento: f.fechaVencimiento.toISOString().split("T")[0],
  }))

  const totalPendiente = facturas
    .filter((f) => f.saldoPendiente > 0)
    .reduce((s, f) => s + f.saldoPendiente, 0)

  const ESTADOS = [
    { key: "",           label: "Todas",       Icon: FileText,    color: "text-slate-600"   },
    { key: "pendiente",  label: "Pendientes",  Icon: Clock,       color: "text-blue-600"    },
    { key: "vencida",    label: "Vencidas",    Icon: AlertTriangle, color: "text-red-600"   },
    { key: "pagada",     label: "Pagadas",     Icon: CheckCircle2, color: "text-green-600"  },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Facturas</h1>
          <p className="text-muted-foreground mt-1">
            Saldo pendiente total:{" "}
            <strong className="text-orange-600">{formatCurrency(totalPendiente)}</strong>
          </p>
        </div>
        <Link href="/dashboard/facturacion/facturas/nueva">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" />Nueva Factura
          </Button>
        </Link>
      </div>

      {/* Filtros por estado (tabs) */}
      <div className="flex flex-wrap gap-2">
        {ESTADOS.map(({ key, label, Icon, color }) => (
          <Link key={key} href={`/dashboard/facturacion/facturas${key ? `?estado=${key}` : ""}`}>
            <Button
              variant={estado === key ? "default" : "outline"}
              size="sm"
              className={estado === key ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}>
              <Icon className={`h-3.5 w-3.5 mr-1.5 ${estado === key ? "" : color}`} />
              {label}
            </Button>
          </Link>
        ))}
      </div>

      {/* Búsqueda */}
      <form method="GET" className="flex gap-3">
        {estado && <input type="hidden" name="estado" value={estado} />}
        <Input name="search" defaultValue={search}
          placeholder="Buscar por cliente o plan…"
          className="max-w-sm" />
        <Button type="submit">Buscar</Button>
        {search && (
          <Link href={`/dashboard/facturacion/facturas${estado ? `?estado=${estado}` : ""}`}>
            <Button variant="outline">Limpiar</Button>
          </Link>
        )}
      </form>

      <Card className="dark:bg-slate-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />Facturas ({facturas.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FacturasTable facturas={facturas} />
        </CardContent>
      </Card>
    </div>
  )
}
