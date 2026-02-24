import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"
import { Plus, Map, Network } from "lucide-react"
import Link from "next/link"
import ZonasTable from "@/components/features/zonas/ZonasTable"
import ZonasSearch from "@/components/features/zonas/ZonasSearch"

export default async function ZonasPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; cabeceraId?: string; estado?: string }>
}) {
  const params = await searchParams
  const search     = params.search     || ""
  const cabeceraId = params.cabeceraId || ""
  const estado     = params.estado     || ""

  const where: Record<string, unknown> = {}
  if (search) {
    where.OR = [
      { codigo: { contains: search, mode: "insensitive" } },
      { nombre: { contains: search, mode: "insensitive" } },
      { descripcion: { contains: search, mode: "insensitive" } },
    ]
  }
  if (cabeceraId) where.cabeceraId = cabeceraId
  if (estado === "activa")   where.esActivo = true
  if (estado === "inactiva") where.esActivo = false

  const [zonasRaw, cabecerasRaw, stats] = await Promise.all([
    prisma.zona.findMany({
      where,
      include: {
        cabecera: { select: { codigo: true, nombre: true } },
        _count:   { select: { clientes: true, cajasNap: true } },
      },
      orderBy: [{ cabecera: { codigo: "asc" } }, { codigo: "asc" }],
    }),
    // Solo los campos sin Decimal para el componente Search
    prisma.cabecera.findMany({
      select: { id: true, codigo: true, nombre: true },
      orderBy: { codigo: "asc" },
    }),
    Promise.all([
      prisma.zona.count(),
      prisma.zona.count({ where: { esActivo: true } }),
      prisma.zona.count({ where: { esActivo: false } }),
      prisma.cabecera.count(),
    ]),
  ])

  const [total, activas, inactivas, totalCabeceras] = stats

  // Zona no tiene campos Decimal pero lo pasamos tal cual
  // Cabeceras: ya usamos select sin latitud/longitud, no hay Decimal
  const zonas = zonasRaw
  const cabeceras = cabecerasRaw

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Zonas</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona las zonas de cobertura y sus cabeceras
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/zonas/cabeceras">
            <Button variant="outline">
              <Network className="h-4 w-4 mr-2" />
              Cabeceras
            </Button>
          </Link>
          <Link href="/dashboard/zonas/nueva">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Zona
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="dark:bg-slate-900/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Zonas</p>
            <p className="text-2xl font-bold text-foreground">{total}</p>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-900/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Activas</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{activas}</p>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-900/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Inactivas</p>
            <p className="text-2xl font-bold text-gray-500">{inactivas}</p>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-900/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Cabeceras</p>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{totalCabeceras}</p>
          </CardContent>
        </Card>
      </div>

      <ZonasSearch cabeceras={cabeceras} />

      <Card className="dark:bg-slate-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5" />
            Lista de Zonas ({zonas.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ZonasTable zonas={zonas} />
        </CardContent>
      </Card>
    </div>
  )
}
