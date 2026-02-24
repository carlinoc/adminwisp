import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Network, ArrowLeft } from "lucide-react"
import Link from "next/link"
import CabecerasTable from "@/components/features/zonas/CabecerasTable"

export default async function CabecerasPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const params = await searchParams
  const search = params.search || ""

  const where: Record<string, unknown> = {}
  if (search) {
    where.OR = [
      { codigo: { contains: search, mode: "insensitive" } },
      { nombre: { contains: search, mode: "insensitive" } },
      { ubicacion: { contains: search, mode: "insensitive" } },
    ]
  }

  const [cabeceras, total] = await Promise.all([
    prisma.cabecera.findMany({
      where,
      include: {
        arrendador: { select: { nombres: true, apellidos: true } },
        _count: { select: { zonas: true } },
      },
      orderBy: { codigo: "asc" },
    }),
    prisma.cabecera.count(),
  ])

  // Serializar Decimal a number
  const cabecerasSerializadas = cabeceras.map((c) => ({
    ...c,
    latitud:  c.latitud  ? Number(c.latitud)  : null,
    longitud: c.longitud ? Number(c.longitud) : null,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/zonas">
            <Button variant="ghost" size="icon" className="dark:hover:bg-slate-800">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Cabeceras</h1>
            <p className="text-muted-foreground mt-1">
              Nodos centrales de la red de fibra óptica
            </p>
          </div>
        </div>
        <Link href="/dashboard/zonas/cabeceras/nueva">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Cabecera
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-sm">
        <Card className="dark:bg-slate-900/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Cabeceras</p>
            <p className="text-2xl font-bold text-foreground">{total}</p>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-900/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Mostrando</p>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{cabeceras.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <form method="GET" className="flex gap-3 max-w-md">
        <Input name="search" defaultValue={search} placeholder="Buscar por código, nombre o ubicación..." />
        <Button type="submit">Buscar</Button>
        {search && (
          <Link href="/dashboard/zonas/cabeceras">
            <Button variant="outline">Limpiar</Button>
          </Link>
        )}
      </form>

      {/* Table */}
      <Card className="dark:bg-slate-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Lista de Cabeceras ({cabeceras.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CabecerasTable cabeceras={cabecerasSerializadas} />
        </CardContent>
      </Card>
    </div>
  )
}
