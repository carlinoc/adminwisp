import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Zap, Plus, TrendingUp, Tv, FileText } from "lucide-react"
import Link from "next/link"
import TarifaPlansTable from "@/components/features/contratos/TarifaPlansTable"
import { formatCurrency } from "@/lib/utils"

export default async function PlanesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const params = await searchParams
  const search = params.search || ""

  const where = search
    ? { nombrePlan: { contains: search, mode: "insensitive" as const } }
    : {}

  const [planesRaw, totalContratos] = await Promise.all([
    prisma.tarifaPlan.findMany({
      where,
      include: { _count: { select: { contratos: true } } },
      orderBy: { tarifaMensual: "asc" },
    }),
    prisma.contrato.count({ where: { estado: "ACTIVO" } }),
  ])

  const planes = planesRaw.map((p) => ({
    ...p,
    tarifaMensual: Number(p.tarifaMensual),
    comisionVenta: Number(p.comisionVenta),
  }))

  const tarifaMin = planes.length ? Math.min(...planes.map((p) => p.tarifaMensual)) : 0
  const tarifaMax = planes.length ? Math.max(...planes.map((p) => p.tarifaMensual)) : 0
  const conTv     = planes.filter((p) => p.incluyeTv).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Planes de Tarifa</h1>
          <p className="text-muted-foreground mt-1">
            Catálogo de planes disponibles para contratos
          </p>
        </div>
        <Link href="/dashboard/contratos/planes/nuevo">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" />Nuevo Plan
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="dark:bg-slate-900/50">
          <CardContent className="p-4 flex items-center gap-3">
            <Zap className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-xs text-muted-foreground">Total Planes</p>
              <p className="text-2xl font-bold">{planes.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-900/50">
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-xs text-muted-foreground">Rango de Tarifas</p>
              <p className="text-sm font-bold">
                {planes.length
                  ? `${formatCurrency(tarifaMin)} – ${formatCurrency(tarifaMax)}`
                  : "—"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-900/50">
          <CardContent className="p-4 flex items-center gap-3">
            <Tv className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-xs text-muted-foreground">Incluyen TV</p>
              <p className="text-2xl font-bold text-purple-600">{conTv}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-900/50">
          <CardContent className="p-4 flex items-center gap-3">
            <FileText className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-xs text-muted-foreground">Contratos Activos</p>
              <p className="text-2xl font-bold text-orange-600">{totalContratos}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtro */}
      <form method="GET" className="flex gap-3">
        <Input name="search" defaultValue={search}
          placeholder="Buscar por nombre de plan…"
          className="max-w-sm" />
        <Button type="submit">Buscar</Button>
        {search && (
          <Link href="/dashboard/contratos/planes">
            <Button variant="outline">Limpiar</Button>
          </Link>
        )}
      </form>

      {/* Tabla */}
      <Card className="dark:bg-slate-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />Planes ({planes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TarifaPlansTable planes={planes} />
        </CardContent>
      </Card>
    </div>
  )
}
