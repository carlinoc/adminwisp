import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Pencil, Package2, RotateCcw, Users } from "lucide-react"
import Link from "next/link"
import AjusteStockModal from "@/components/features/materiales/AjusteStockModal"

export default async function DetalleMaterialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const material = await prisma.material.findUnique({
    where: { id },
    include: {
      inventarios: true,
      materialesAsignados: {
        include: {
          tecnico:         { include: { persona: { select: { nombres: true, apellidos: true } } } },
          personalEntrega: { include: { persona: { select: { nombres: true, apellidos: true } } } },
        },
        orderBy: { fechaAsignacion: "desc" },
        take: 10,
      },
      _count: { select: { materialesAsignados: true } },
    },
  })

  if (!material) notFound()

  const inv = material.inventarios[0]
  const stock = inv?.cantidadDisponible ?? 0
  const reorden = inv?.puntoReorden ?? 0
  const sinStock = stock === 0
  const stockBajo = stock > 0 && stock <= reorden && reorden > 0

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/materiales/lista">
            <Button variant="ghost" size="icon" className="dark:hover:bg-slate-800">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Package2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{material.nombre}</h1>
              <p className="text-muted-foreground text-sm">
                {[material.marca, material.modelo].filter(Boolean).join(" · ") || "Sin marca/modelo"}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {inv && (
            <AjusteStockModal
              inventarioId={inv.id}
              materialId={material.id}
              materialNombre={material.nombre}
              stockActual={stock}
              puntoReorden={reorden}
              ubicacion={inv.ubicacionAlmacen}
            />
          )}
          <Link href={`/dashboard/materiales/lista/${id}/editar`}>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Pencil className="h-4 w-4 mr-2" />Editar
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna info */}
        <div className="space-y-4">
          <Card className="dark:bg-slate-900/50">
            <CardHeader><CardTitle className="text-base">Información</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div><p className="text-muted-foreground text-xs">Categoría</p>
                <Badge variant="secondary" className="mt-1">{material.categoria}</Badge></div>
              <div><p className="text-muted-foreground text-xs">Unidad de Medida</p>
                <p className="font-medium">{material.unidadMedida}</p></div>
              {material.descripcion && (
                <div><p className="text-muted-foreground text-xs">Descripción</p>
                  <p>{material.descripcion}</p></div>
              )}
              <div className="flex items-center gap-2 pt-1">
                {material.requiereDevolucion
                  ? <><RotateCcw className="h-4 w-4 text-blue-500" /><span className="text-blue-600 text-xs font-medium">Requiere devolución</span></>
                  : <span className="text-muted-foreground text-xs">Consumible (sin devolución)</span>}
              </div>
            </CardContent>
          </Card>

          {/* Stock card */}
          <Card className={`dark:bg-slate-900/50 border-2 ${sinStock ? "border-red-300 dark:border-red-800" : stockBajo ? "border-yellow-300 dark:border-yellow-800" : "border-green-300 dark:border-green-800"}`}>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                Stock en Almacén
                {sinStock   && <Badge variant="secondary" className="bg-red-100 text-red-800">SIN STOCK</Badge>}
                {stockBajo  && <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">STOCK BAJO</Badge>}
                {!sinStock && !stockBajo && <Badge variant="secondary" className="bg-green-100 text-green-800">OK</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="text-center py-2">
                <p className={`text-5xl font-black ${sinStock ? "text-red-600" : stockBajo ? "text-yellow-600" : "text-green-600 dark:text-green-400"}`}>
                  {stock}
                </p>
                <p className="text-muted-foreground text-xs mt-1">{material.unidadMedida}(s) disponibles</p>
              </div>
              {inv && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Punto de reorden</span>
                    <span className="font-medium">{reorden}</span>
                  </div>
                  {inv.ubicacionAlmacen && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ubicación</span>
                      <span className="font-medium font-mono text-xs">{inv.ubicacionAlmacen}</span>
                    </div>
                  )}
                </>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total asignado</span>
                <span className="font-medium">{material._count.materialesAsignados} veces</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Últimas asignaciones */}
        <div className="lg:col-span-2">
          <Card className="dark:bg-slate-900/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4" />
                  Últimas Asignaciones ({material._count.materialesAsignados})
                </CardTitle>
                <Link href={`/dashboard/materiales/asignaciones/nueva?materialId=${id}`}>
                  <Button size="sm" variant="outline">+ Nueva Asignación</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {material.materialesAsignados.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Sin asignaciones registradas</p>
              ) : (
                <div className="space-y-2">
                  {material.materialesAsignados.map((a) => (
                    <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border text-sm">
                      <div>
                        <p className="font-medium">
                          {a.tecnico.persona.nombres} {a.tecnico.persona.apellidos ?? ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Entregado por: {a.personalEntrega.persona.nombres} {a.personalEntrega.persona.apellidos ?? ""} · {new Date(a.fechaAsignacion).toLocaleDateString("es-PE")}
                        </p>
                        {a.serial && <p className="text-xs font-mono text-muted-foreground">SN: {a.serial}</p>}
                      </div>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 ml-3 flex-shrink-0">
                        {a.cantidad} {material.unidadMedida}
                      </Badge>
                    </div>
                  ))}
                  {material._count.materialesAsignados > 10 && (
                    <p className="text-xs text-center text-muted-foreground pt-1">
                      Mostrando 10 de {material._count.materialesAsignados}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
