export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Network, Wifi, Zap, AlertTriangle } from "lucide-react"
import Link from "next/link"
import CajasNapTable from "@/components/features/infraestructura/CajasNapTable"

export default async function CajasNapPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; zonaId?: string; tipo?: string }>
}) {
  const params = await searchParams
  const search = params.search || ""
  const zonaId = params.zonaId || ""
  const tipo   = params.tipo   || ""   // "principal" | "hija"

  // ── Filtro ──────────────────────────────────────────────────
  const where: Record<string, unknown> = {}
  if (search) {
    where.OR = [
      { direccion: { contains: search, mode: "insensitive" } },
      { zona: { nombre:  { contains: search, mode: "insensitive" } } },
      { zona: { codigo:  { contains: search, mode: "insensitive" } } },
      { splitterInstalado: { contains: search, mode: "insensitive" } },
    ]
  }
  if (zonaId) where.zonaId = zonaId
  if (tipo === "principal") where.puertoAlimentadorId = null
  if (tipo === "hija")      where.puertoAlimentadorId = { not: null }

  const [cajasRaw, totalCajas, zonas] = await Promise.all([
    prisma.cajaNap.findMany({
      where,
      include: {
        zona: { select: { codigo: true, nombre: true, cabecera: { select: { nombre: true } } } },
        _count: { select: { puertos: true } },
      },
      orderBy: [{ zona: { nombre: "asc" } }],
    }),
    prisma.cajaNap.count(),
    prisma.zona.findMany({
      where: { esActivo: true },
      select: { id: true, codigo: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
  ])

  // Serializar Decimal → number para client component
  const cajas = cajasRaw.map((c) => ({
    ...c,
    latitud:  c.latitud  ? Number(c.latitud)  : null,
    longitud: c.longitud ? Number(c.longitud) : null,
  }))

  // Stats globales
  const totalPuertos     = cajas.reduce((s, c) => s + c.capacidadPuertosTotal, 0)
  const totalOcupados    = cajas.reduce((s, c) => s + c.puertosUtilizados, 0)
  const cajasAlta        = cajas.filter((c) => {
    const pct = c.capacidadPuertosTotal > 0
      ? (c.puertosUtilizados / c.capacidadPuertosTotal) * 100 : 0
    return pct >= 80
  }).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Cajas NAP</h1>
          <p className="text-muted-foreground mt-1">
            Infraestructura de red — nodos de distribución óptica
          </p>
        </div>
        <Link href="/dashboard/infraestructura/cajas/nueva">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" />Nueva Caja NAP
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="dark:bg-slate-900/50">
          <CardContent className="p-4 flex items-center gap-3">
            <Network className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-xs text-muted-foreground">Total Cajas NAP</p>
              <p className="text-2xl font-bold">{totalCajas}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-900/50">
          <CardContent className="p-4 flex items-center gap-3">
            <Wifi className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-xs text-muted-foreground">Puertos Totales</p>
              <p className="text-2xl font-bold">{totalPuertos}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-900/50">
          <CardContent className="p-4 flex items-center gap-3">
            <Zap className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-xs text-muted-foreground">Puertos Ocupados</p>
              <p className="text-2xl font-bold text-purple-600">{totalOcupados}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-900/50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
            <div>
              <p className="text-xs text-muted-foreground">Cajas &gt;80% llenas</p>
              <p className="text-2xl font-bold text-yellow-600">{cajasAlta}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <form method="GET" className="flex flex-wrap gap-3">
        <Input
          name="search"
          defaultValue={search}
          placeholder="Buscar por zona, dirección o splitter…"
          className="flex-1 min-w-52"
        />
        <select
          name="zonaId"
          defaultValue={zonaId}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm dark:bg-slate-950"
        >
          <option value="">Todas las zonas</option>
          {zonas.map((z) => (
            <option key={z.id} value={z.id}>[{z.codigo}] {z.nombre}</option>
          ))}
        </select>
        <select
          name="tipo"
          defaultValue={tipo}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm dark:bg-slate-950"
        >
          <option value="">Todos los tipos</option>
          <option value="principal">Solo principales</option>
          <option value="hija">Solo hijas</option>
        </select>
        <Button type="submit">Filtrar</Button>
        {(search || zonaId || tipo) && (
          <Link href="/dashboard/infraestructura/cajas">
            <Button variant="outline">Limpiar</Button>
          </Link>
        )}
      </form>

      {/* Tabla */}
      <Card className="dark:bg-slate-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Cajas NAP ({cajas.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CajasNapTable cajas={cajas} />
        </CardContent>
      </Card>
    </div>
  )
}
