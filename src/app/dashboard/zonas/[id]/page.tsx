export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Pencil, Plus, Users, Radio } from "lucide-react"
import Link from "next/link"
import { ESTADO_COLORS } from "@/lib/utils"

export default async function DetalleZonaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const zona = await prisma.zona.findUnique({
    where: { id },
    include: {
      cabecera: { include: { arrendador: true } },
      clientes: {
        include: { persona: true },
        orderBy: { fechaAlta: "desc" },
        take: 10,
      },
      cajasNap: {
        orderBy: { direccion: "asc" },
        take: 10,
      },
      _count: { select: { clientes: true, cajasNap: true } },
    },
  })

  if (!zona) notFound()

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/zonas">
            <Button variant="ghost" size="icon" className="dark:hover:bg-slate-800">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-foreground">{zona.nombre}</h1>
              <Badge
                variant="secondary"
                className={zona.esActivo
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}
              >
                {zona.esActivo ? "Activa" : "Inactiva"}
              </Badge>
            </div>
            <p className="text-muted-foreground font-mono text-sm mt-0.5">{zona.codigo}</p>
          </div>
        </div>
        <Link href={`/dashboard/zonas/${id}/editar`}>
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
                <p className="font-mono font-semibold">{zona.codigo}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Descripción</p>
                <p>{zona.descripcion || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Clientes asignados</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{zona._count.clientes}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Cajas NAP</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{zona._count.cajasNap}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-slate-900/50">
            <CardHeader><CardTitle className="text-base">Cabecera</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Nombre</p>
                <Link
                  href={`/dashboard/zonas/cabeceras/${zona.cabeceraId}`}
                  className="font-medium text-blue-600 hover:underline"
                >
                  {zona.cabecera.nombre}
                </Link>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Código</p>
                <p className="font-mono">{zona.cabecera.codigo}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Arrendador</p>
                <p>{zona.cabecera.arrendador.nombres} {zona.cabecera.arrendador.apellidos ?? ""}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contenido principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Últimos clientes */}
          <Card className="dark:bg-slate-900/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4" />
                  Clientes en esta zona ({zona._count.clientes})
                </CardTitle>
                <Link href={`/dashboard/clientes?zonaId=${id}`}>
                  <Button size="sm" variant="outline">Ver todos</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {zona.clientes.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-6">Sin clientes asignados</p>
              ) : (
                <div className="space-y-2">
                  {zona.clientes.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border">
                      <div>
                        <Link
                          href={`/dashboard/clientes/${c.id}`}
                          className="text-sm font-medium hover:text-blue-600 hover:underline"
                        >
                          {c.persona.nombres} {c.persona.apellidos ?? ""}
                        </Link>
                        <p className="text-xs text-muted-foreground font-mono">{c.codigoCliente}</p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={ESTADO_COLORS[c.estadoConexion as keyof typeof ESTADO_COLORS]}
                      >
                        {c.estadoConexion}
                      </Badge>
                    </div>
                  ))}
                  {zona._count.clientes > 10 && (
                    <p className="text-xs text-muted-foreground text-center pt-1">
                      Mostrando 10 de {zona._count.clientes}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cajas NAP */}
          <Card className="dark:bg-slate-900/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Radio className="h-4 w-4" />
                  Cajas NAP ({zona._count.cajasNap})
                </CardTitle>
                <Link href={`/dashboard/zonas/nueva?cabeceraId=${zona.cabeceraId}`}>
                  <Button size="sm" variant="outline">
                    <Plus className="h-3 w-3 mr-1" />Nueva zona
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {zona.cajasNap.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-6">Sin cajas NAP registradas</p>
              ) : (
                <div className="space-y-2">
                  {zona.cajasNap.map((caja) => (
                    <div key={caja.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border text-sm">
                      <div>
                        <p className="font-medium">{caja.direccion || "Sin dirección"}</p>
                        <p className="text-xs text-muted-foreground">
                          Splitter: {caja.splitterInstalado || "—"} •{" "}
                          Puertos: {caja.puertosUtilizados}/{caja.capacidadPuertosTotal}
                        </p>
                      </div>
                      <Badge variant="secondary" className={
                        caja.puertosUtilizados >= caja.capacidadPuertosTotal
                          ? "bg-red-100 text-red-800"
                          : caja.puertosUtilizados > caja.capacidadPuertosTotal * 0.7
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }>
                        {caja.puertosUtilizados}/{caja.capacidadPuertosTotal}
                      </Badge>
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
