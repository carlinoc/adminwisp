import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CreditCard, Plus } from "lucide-react"
import Link from "next/link"
import PagosTable from "@/components/features/facturacion/PagosTable"
import { formatCurrency } from "@/lib/utils"

export default async function PagosPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; tipo?: string; mes?: string }>
}) {
  const params = await searchParams
  const search = params.search || ""
  const tipo   = params.tipo   || ""
  const mes    = params.mes    || ""

  const where: Record<string, unknown> = {}
  if (tipo) where.tipoPago = tipo
  if (mes) {
    const [y, m] = mes.split("-").map(Number)
    where.fechaPago = {
      gte: new Date(y, m - 1, 1),
      lt:  new Date(y, m, 1),
    }
  }
  if (search) {
    where.OR = [
      { cliente: { persona: { nombres:   { contains: search, mode: "insensitive" } } } },
      { cliente: { persona: { apellidos: { contains: search, mode: "insensitive" } } } },
      { cliente: { codigoCliente: { contains: search, mode: "insensitive" } } },
      { masDetalles: { contains: search, mode: "insensitive" } },
    ]
  }

  const [pagosRaw, totalMes] = await Promise.all([
    prisma.pago.findMany({
      where,
      include: {
        cliente: {
          select: {
            id: true, codigoCliente: true,
            persona: { select: { nombres: true, apellidos: true } },
          },
        },
        contrato: { select: { tarifaPlan: { select: { nombrePlan: true } } } },
        _count: { select: { detallesPagoFactura: true } },
      },
      orderBy: { fechaPago: "desc" },
    }),
    prisma.pago.aggregate({
      _sum: { montoPagado: true },
      where: {
        fechaPago: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          lt:  new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
        },
      },
    }),
  ])

  const pagos = pagosRaw.map((p) => ({
    ...p,
    montoPagado: Number(p.montoPagado),
    fechaPago:   p.fechaPago.toISOString().split("T")[0],
  }))

  const totalMesNum = Number(totalMes._sum.montoPagado ?? 0)
  const TIPOS = ["EFECTIVO", "TRANSFERENCIA", "TARJETA", "YAPE", "PLIN"]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pagos</h1>
          <p className="text-muted-foreground mt-1">
            Cobrado este mes:{" "}
            <strong className="text-green-600">{formatCurrency(totalMesNum)}</strong>
          </p>
        </div>
        <Link href="/dashboard/facturacion/pagos/nuevo">
          <Button className="bg-green-600 hover:bg-green-700 text-white">
            <Plus className="h-4 w-4 mr-2" />Registrar Pago
          </Button>
        </Link>
      </div>

      {/* Filtros */}
      <form method="GET" className="flex flex-wrap gap-3">
        <Input name="search" defaultValue={search}
          placeholder="Buscar por cliente…" className="flex-1 min-w-48" />
        <select name="tipo" defaultValue={tipo}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm dark:bg-slate-950">
          <option value="">Todos los tipos</option>
          {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <Input name="mes" type="month" defaultValue={mes} className="w-40" />
        <Button type="submit">Filtrar</Button>
        {(search || tipo || mes) && (
          <Link href="/dashboard/facturacion/pagos">
            <Button variant="outline">Limpiar</Button>
          </Link>
        )}
      </form>

      <Card className="dark:bg-slate-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />Pagos ({pagos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PagosTable pagos={pagos} />
        </CardContent>
      </Card>
    </div>
  )
}
