export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Warehouse, TrendingDown, AlertTriangle, CheckCircle, Package2 } from "lucide-react"
import Link from "next/link"
import AjusteStockModal from "@/components/features/materiales/AjusteStockModal"

export default async function InventarioPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; estado?: string }>
}) {
  const params = await searchParams
  const search = params.search || ""
  const estado = params.estado || ""

  const where: Record<string, unknown> = {}
  if (search) {
    where.material = {
      OR: [
        { nombre:      { contains: search, mode: "insensitive" } },
        { categoria:   { contains: search, mode: "insensitive" } },
        { marca:       { contains: search, mode: "insensitive" } },
      ],
    }
  }

  const inventarios = await prisma.inventario.findMany({
    where,
    include: {
      material: {
        select: {
          id: true, nombre: true, categoria: true,
          unidadMedida: true, marca: true, modelo: true, requiereDevolucion: true,
        },
      },
    },
    orderBy: { material: { categoria: "asc" } },
  })

  // Filtrar por estado DESPUÉS de obtener datos (lógica relacional)
  const filtrados = inventarios.filter((inv) => {
    if (estado === "sinstock") return inv.cantidadDisponible === 0
    if (estado === "bajo")     return inv.cantidadDisponible > 0 && inv.cantidadDisponible <= inv.puntoReorden && inv.puntoReorden > 0
    if (estado === "ok")       return inv.cantidadDisponible > inv.puntoReorden || inv.puntoReorden === 0
    return true
  })

  const total    = inventarios.length
  const sinStock = inventarios.filter((i) => i.cantidadDisponible === 0).length
  const bajo     = inventarios.filter((i) => i.cantidadDisponible > 0 && i.cantidadDisponible <= i.puntoReorden && i.puntoReorden > 0).length
  const ok       = total - sinStock - bajo

  const CAT_COLORS: Record<string, string> = {
    Equipos: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    Cables: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    Conectores: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    Herramientas: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    Accesorios: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
    Consumibles: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    Otros: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Inventario</h1>
        <p className="text-muted-foreground mt-1">Estado actual del stock en almacén</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="dark:bg-slate-900/50">
          <CardContent className="p-4 flex items-center gap-3">
            <Warehouse className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <div><p className="text-xs text-muted-foreground">Total Items</p>
              <p className="text-2xl font-bold">{total}</p></div>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-900/50 border-green-200 dark:border-green-900">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div><p className="text-xs text-muted-foreground">Stock OK</p>
              <p className="text-2xl font-bold text-green-600">{ok}</p></div>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-900/50 border-yellow-200 dark:border-yellow-900">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
            <div><p className="text-xs text-muted-foreground">Stock Bajo</p>
              <p className="text-2xl font-bold text-yellow-600">{bajo}</p></div>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-900/50 border-red-200 dark:border-red-900">
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingDown className="h-8 w-8 text-red-600" />
            <div><p className="text-xs text-muted-foreground">Sin Stock</p>
              <p className="text-2xl font-bold text-red-600">{sinStock}</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <form method="GET" className="flex gap-3 flex-wrap">
        <Input name="search" defaultValue={search} placeholder="Buscar material..." className="flex-1 min-w-48" />
        <select name="estado" defaultValue={estado}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm dark:bg-slate-950">
          <option value="">Todos los estados</option>
          <option value="ok">Stock OK</option>
          <option value="bajo">Stock Bajo</option>
          <option value="sinstock">Sin Stock</option>
        </select>
        <Button type="submit">Filtrar</Button>
        {(search || estado) && (
          <Link href="/dashboard/materiales/inventario"><Button variant="outline">Limpiar</Button></Link>
        )}
      </form>

      {/* Grid de tarjetas de inventario */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtrados.length === 0 && (
          <div className="col-span-3 text-center py-12 text-muted-foreground">
            No se encontraron ítems de inventario
          </div>
        )}
        {filtrados.map((inv) => {
          const stock    = inv.cantidadDisponible
          const reorden  = inv.puntoReorden
          const sinStk   = stock === 0
          const bajo_    = stock > 0 && reorden > 0 && stock <= reorden
          const porcentaje = reorden > 0 ? Math.min(100, Math.round((stock / (reorden * 2)) * 100)) : 100

          return (
            <Card key={inv.id} className={`dark:bg-slate-900/50 border-l-4 ${
              sinStk  ? "border-l-red-500"
              : bajo_ ? "border-l-yellow-500"
              :          "border-l-green-500"
            }`}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <Link href={`/dashboard/materiales/lista/${inv.material.id}`}
                      className="font-semibold text-sm hover:text-blue-600 hover:underline line-clamp-1">
                      {inv.material.nombre}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {[inv.material.marca, inv.material.modelo].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>
                  <Badge variant="secondary" className={`flex-shrink-0 ${CAT_COLORS[inv.material.categoria] ?? CAT_COLORS.Otros}`}>
                    {inv.material.categoria}
                  </Badge>
                </div>

                {/* Stock display */}
                <div className="flex items-end justify-between">
                  <div>
                    <p className={`text-3xl font-black ${sinStk ? "text-red-600" : bajo_ ? "text-yellow-600" : "text-green-600 dark:text-green-400"}`}>
                      {stock}
                    </p>
                    <p className="text-xs text-muted-foreground">{inv.material.unidadMedida}(s)</p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>Reorden: {reorden}</p>
                    {inv.ubicacionAlmacen && <p className="font-mono">{inv.ubicacionAlmacen}</p>}
                  </div>
                </div>

                {/* Barra de progreso */}
                {reorden > 0 && (
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full transition-all ${
                      sinStk ? "bg-red-500" : bajo_ ? "bg-yellow-500" : "bg-green-500"
                    }`} style={{ width: `${porcentaje}%` }} />
                  </div>
                )}

                {/* Botón ajuste */}
                <AjusteStockModal
                  inventarioId={inv.id}
                  materialId={inv.material.id}
                  materialNombre={inv.material.nombre}
                  stockActual={stock}
                  puntoReorden={reorden}
                  ubicacion={inv.ubicacionAlmacen}
                />
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
