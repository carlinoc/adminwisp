export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  FileText, Plus, CheckCircle, PauseCircle,
  XCircle, Clock, TrendingUp,
} from "lucide-react"
import Link from "next/link"
import ContratosTable from "@/components/features/contratos/ContratosTable"
import { formatCurrency } from "@/lib/utils"

export default async function ContratosPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; estado?: string }>
}) {
  const params = await searchParams
  const search = params.search || ""
  const estado = params.estado || ""

  const where: Record<string, unknown> = {}
  if (estado) where.estado = estado
  if (search) {
    where.OR = [
      { cliente: { persona: { nombres:   { contains: search, mode: "insensitive" } } } },
      { cliente: { persona: { apellidos: { contains: search, mode: "insensitive" } } } },
      { cliente: { codigoCliente: { contains: search, mode: "insensitive" } } },
      { tarifaPlan: { nombrePlan: { contains: search, mode: "insensitive" } } },
    ]
  }

  const [contratosRaw, stats] = await Promise.all([
    prisma.contrato.findMany({
      where,
      include: {
        cliente: {
          select: {
            id: true, codigoCliente: true,
            persona: { select: { nombres: true, apellidos: true } },
          },
        },
        tarifaPlan: {
          select: { nombrePlan: true, velocidadDescarga: true, velocidadSubida: true },
        },
        ubicacionInstalacion: { select: { direccion: true } },
        _count: { select: { pagos: true, facturas: true } },
      },
      orderBy: { fechaContrato: "desc" },
    }),
    prisma.contrato.groupBy({
      by: ["estado"],
      _count: { id: true },
      _sum:   { montoActual: true },
    }),
  ])

  const contratos = contratosRaw.map((c) => ({
    ...c,
    montoActual:         Number(c.montoActual),
    comisionGenerada:    Number(c.comisionGenerada),
    fechaContrato:       c.fechaContrato.toISOString().split("T")[0],
    fechaInicioServicio: c.fechaInicioServicio?.toISOString().split("T")[0] ?? null,
  }))

  const byEstado = Object.fromEntries(stats.map((s) => [s.estado, s._count.id]))
  const mrr = stats
    .filter((s) => s.estado === "ACTIVO")
    .reduce((sum, s) => sum + Number(s._sum.montoActual ?? 0), 0)

  const ESTADOS = [
    { key: "ACTIVO",     label: "Activos",     Icon: CheckCircle, color: "text-green-600"  },
    { key: "PENDIENTE",  label: "Pendientes",  Icon: Clock,       color: "text-blue-600"   },
    { key: "SUSPENDIDO", label: "Suspendidos", Icon: PauseCircle, color: "text-yellow-600" },
    { key: "CANCELADO",  label: "Cancelados",  Icon: XCircle,     color: "text-red-600"    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contratos</h1>
          <p className="text-muted-foreground mt-1">Gestión de contratos de servicio</p>
        </div>
        <Link href="/dashboard/contratos/nuevo">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" />Nuevo Contrato
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {ESTADOS.map(({ key, label, Icon, color }) => (
          <Card key={key} className="dark:bg-slate-900/50">
            <CardContent className="p-4 flex items-center gap-3">
              <Icon className={`h-8 w-8 ${color} flex-shrink-0`} />
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={`text-2xl font-bold ${color}`}>{byEstado[key] ?? 0}</p>
              </div>
            </CardContent>
          </Card>
        ))}
        <Card className="dark:bg-slate-900/50">
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-purple-600 flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Ingresos activos/mes</p>
              <p className="text-lg font-bold text-purple-600">{formatCurrency(mrr)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <form method="GET" className="flex flex-wrap gap-3">
        <Input name="search" defaultValue={search}
          placeholder="Buscar por cliente, código o plan…"
          className="flex-1 min-w-52" />
        <select name="estado" defaultValue={estado}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm dark:bg-slate-950">
          <option value="">Todos los estados</option>
          {ESTADOS.map(({ key, label }) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <Button type="submit">Filtrar</Button>
        {(search || estado) && (
          <Link href="/dashboard/contratos">
            <Button variant="outline">Limpiar</Button>
          </Link>
        )}
      </form>

      <Card className="dark:bg-slate-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />Contratos ({contratos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ContratosTable contratos={contratos} />
        </CardContent>
      </Card>
    </div>
  )
}
