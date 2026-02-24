import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Package2 } from "lucide-react"
import Link from "next/link"
import MaterialesTable from "@/components/features/materiales/MaterialesTable"

export default async function MaterialesListaPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; categoria?: string }>
}) {
  const params    = await searchParams
  const search    = params.search    || ""
  const categoria = params.categoria || ""

  const where: Record<string, unknown> = {}
  if (search) {
    where.OR = [
      { nombre:      { contains: search, mode: "insensitive" } },
      { marca:       { contains: search, mode: "insensitive" } },
      { modelo:      { contains: search, mode: "insensitive" } },
      { descripcion: { contains: search, mode: "insensitive" } },
    ]
  }
  if (categoria) where.categoria = categoria

  const [materiales, stats, categorias] = await Promise.all([
    prisma.material.findMany({
      where,
      include: {
        inventarios: { select: { cantidadDisponible: true, puntoReorden: true } },
        _count: { select: { materialesAsignados: true } },
      },
      orderBy: [{ categoria: "asc" }, { nombre: "asc" }],
    }),
    Promise.all([
      prisma.material.count(),
      prisma.inventario.count({ where: { cantidadDisponible: { lte: prisma.inventario.fields.puntoReorden } } }),
      prisma.inventario.count({ where: { cantidadDisponible: 0 } }),
    ]),
    prisma.material.findMany({ select: { categoria: true }, distinct: ["categoria"], orderBy: { categoria: "asc" } }),
  ])

  const [total] = stats
  const sinStock  = materiales.filter((m) => (m.inventarios[0]?.cantidadDisponible ?? 0) === 0).length
  const stockBajo = materiales.filter((m) => {
    const inv = m.inventarios[0]
    return inv && inv.cantidadDisponible > 0 && inv.cantidadDisponible <= inv.puntoReorden && inv.puntoReorden > 0
  }).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Materiales</h1>
          <p className="text-muted-foreground mt-1">Catálogo de materiales e insumos del almacén</p>
        </div>
        <Link href="/dashboard/materiales/lista/nuevo">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" />Nuevo Material
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="dark:bg-slate-900/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Materiales</p>
            <p className="text-2xl font-bold">{total}</p>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-900/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Mostrando</p>
            <p className="text-2xl font-bold text-blue-600">{materiales.length}</p>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-900/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">⚠ Stock Bajo</p>
            <p className="text-2xl font-bold text-yellow-600">{stockBajo}</p>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-900/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">🔴 Sin Stock</p>
            <p className="text-2xl font-bold text-red-600">{sinStock}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <form method="GET" className="flex gap-3 flex-wrap">
        <Input name="search" defaultValue={search} placeholder="Buscar por nombre, marca o modelo..."
          className="flex-1 min-w-48" />
        <select name="categoria"
          defaultValue={categoria}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm dark:bg-slate-950">
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c.categoria} value={c.categoria}>{c.categoria}</option>
          ))}
        </select>
        <Button type="submit">Buscar</Button>
        {(search || categoria) && (
          <Link href="/dashboard/materiales/lista"><Button variant="outline">Limpiar</Button></Link>
        )}
      </form>

      {/* Tabla */}
      <Card className="dark:bg-slate-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package2 className="h-5 w-5" />
            Catálogo de Materiales ({materiales.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MaterialesTable materiales={materiales} />
        </CardContent>
      </Card>
    </div>
  )
}
