export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Pencil, Map, Plus } from "lucide-react"
import Link from "next/link"

export default async function DetalleCabeceraPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const cabecera = await prisma.cabecera.findUnique({
    where: { id },
    include: {
      arrendador: true,
      zonas: {
        include: { _count: { select: { clientes: true, cajasNap: true } } },
        orderBy: { codigo: "asc" },
      },
      _count: { select: { zonas: true } },
    },
  })

  if (!cabecera) notFound()

  const totalClientes = cabecera.zonas.reduce((s, z) => s + z._count.clientes, 0)
  const totalCajas    = cabecera.zonas.reduce((s, z) => s + z._count.cajasNap, 0)

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/zonas/cabeceras">
            <Button variant="ghost" size="icon" className="dark:hover:bg-slate-800">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{cabecera.nombre}</h1>
            <p className="text-muted-foreground font-mono text-sm mt-0.5">{cabecera.codigo}</p>
          </div>
        </div>
        <Link href={`/dashboard/zonas/cabeceras/${id}/editar`}>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Pencil className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info lateral */}
        <div className="space-y-6">
          <Card className="dark:bg-slate-900/50">
            <CardHeader><CardTitle className="text-base">Información</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Código</p>
                <p className="font-mono font-semibold">{cabecera.codigo}</p>
              </div>
              {cabecera.ubicacion && (
                <div>
                  <p className="text-muted-foreground text-xs">Ubicación</p>
                  <p>{cabecera.ubicacion}</p>
                </div>
              )}
              {(cabecera.latitud || cabecera.longitud) && (
                <div>
                  <p className="text-muted-foreground text-xs">Coordenadas GPS</p>
                  <p className="font-mono text-xs">
                    {Number(cabecera.latitud).toFixed(6)},
                    {Number(cabecera.longitud).toFixed(6)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="dark:bg-slate-900/50">
            <CardHeader><CardTitle className="text-base">Arrendador</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium">
                {cabecera.arrendador.nombres} {cabecera.arrendador.apellidos ?? ""}
              </p>
              {cabecera.arrendador.dni && (
                <p className="text-muted-foreground">DNI: {cabecera.arrendador.dni}</p>
              )}
              {cabecera.arrendador.telefono && (
                <p className="text-muted-foreground">Tel: {cabecera.arrendador.telefono}</p>
              )}
              {cabecera.arrendador.email && (
                <p className="text-muted-foreground">{cabecera.arrendador.email}</p>
              )}
            </CardContent>
          </Card>

          {/* Stats rápidos */}
          <Card className="dark:bg-slate-900/50">
            <CardHeader><CardTitle className="text-base">Resumen</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Zonas</span>
                <span className="font-bold text-indigo-600">{cabecera._count.zonas}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Clientes totales</span>
                <span className="font-bold text-blue-600">{totalClientes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cajas NAP totales</span>
                <span className="font-bold text-purple-600">{totalCajas}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Zonas */}
        <div className="lg:col-span-2">
          <Card className="dark:bg-slate-900/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Map className="h-4 w-4" />
                  Zonas ({cabecera._count.zonas})
                </CardTitle>
                <Link href={`/dashboard/zonas/nueva?cabeceraId=${id}`}>
                  <Button size="sm" variant="outline">
                    <Plus className="h-3 w-3 mr-1" />
                    Nueva Zona
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {cabecera.zonas.length === 0 ? (
                <div className="text-center py-10">
                  <Map className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground text-sm">Sin zonas registradas</p>
                  <Link href={`/dashboard/zonas/nueva?cabeceraId=${id}`}>
                    <Button size="sm" className="mt-3">Crear primera zona</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {cabecera.zonas.map((zona) => (
                    <div
                      key={zona.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/dashboard/zonas/${zona.id}`}
                              className="font-medium text-sm hover:text-blue-600 hover:underline"
                            >
                              {zona.nombre}
                            </Link>
                            <Badge
                              variant="secondary"
                              className={zona.esActivo
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-gray-100 text-gray-600"}
                            >
                              {zona.esActivo ? "Activa" : "Inactiva"}
                            </Badge>
                          </div>
                          <p className="font-mono text-xs text-muted-foreground">{zona.codigo}</p>
                          {zona.descripcion && (
                            <p className="text-xs text-muted-foreground mt-0.5">{zona.descripcion}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-right">
                        <div>
                          <p className="font-semibold text-blue-600">{zona._count.clientes}</p>
                          <p className="text-muted-foreground">clientes</p>
                        </div>
                        <div>
                          <p className="font-semibold text-purple-600">{zona._count.cajasNap}</p>
                          <p className="text-muted-foreground">cajas NAP</p>
                        </div>
                        <Link href={`/dashboard/zonas/${zona.id}/editar`}>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
