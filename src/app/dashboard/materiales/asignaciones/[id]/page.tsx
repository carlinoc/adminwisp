import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Package2, User, Wrench, RotateCcw, CalendarDays } from "lucide-react"
import Link from "next/link"

export default async function DetalleAsignacionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const asignacion = await prisma.materialAsignado.findUnique({
    where: { id },
    include: {
      material: true,
      tecnico: {
        include: { persona: true },
      },
      personalEntrega: {
        include: { persona: true },
      },
    },
  })

  if (!asignacion) notFound()

  const { material, tecnico, personalEntrega } = asignacion

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/materiales/asignaciones">
            <Button variant="ghost" size="icon" className="dark:hover:bg-slate-800">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Detalle de Asignación</h1>
            <p className="text-muted-foreground font-mono text-xs mt-0.5">{asignacion.id}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Material */}
        <Card className="dark:bg-slate-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package2 className="h-4 w-4" />Material Asignado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Material</p>
              <Link href={`/dashboard/materiales/lista/${material.id}`}
                className="font-semibold text-blue-600 hover:underline">
                {material.nombre}
              </Link>
            </div>
            {(material.marca || material.modelo) && (
              <div>
                <p className="text-muted-foreground text-xs">Marca / Modelo</p>
                <p>{[material.marca, material.modelo].filter(Boolean).join(" · ")}</p>
              </div>
            )}
            <div><p className="text-muted-foreground text-xs">Categoría</p>
              <Badge variant="secondary" className="mt-1">{material.categoria}</Badge></div>
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="text-muted-foreground">Cantidad</span>
              <span className="text-2xl font-bold text-blue-600">
                {asignacion.cantidad} <span className="text-sm font-normal text-muted-foreground">{material.unidadMedida}</span>
              </span>
            </div>
            {asignacion.serial && (
              <div><p className="text-muted-foreground text-xs">N° de Serie</p>
                <p className="font-mono font-semibold">{asignacion.serial}</p></div>
            )}
            <div className="flex items-center gap-2 pt-1">
              {material.requiereDevolucion
                ? <><RotateCcw className="h-4 w-4 text-blue-500" /><span className="text-blue-600 text-xs font-medium">Requiere devolución</span></>
                : <span className="text-muted-foreground text-xs">Consumible — no requiere devolución</span>}
            </div>
          </CardContent>
        </Card>

        {/* Personal */}
        <div className="space-y-4">
          <Card className="dark:bg-slate-900/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Wrench className="h-4 w-4" />Técnico Receptor
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p className="font-semibold">
                {tecnico.persona.nombres} {tecnico.persona.apellidos ?? ""}
              </p>
              {tecnico.persona.email && <p className="text-muted-foreground">{tecnico.persona.email}</p>}
              {tecnico.persona.telefono && <p className="text-muted-foreground">{tecnico.persona.telefono}</p>}
              <Link href={`/dashboard/personal/${tecnico.persona.id}`}
                className="text-xs text-blue-600 hover:underline">
                Ver ficha del empleado →
              </Link>
            </CardContent>
          </Card>

          <Card className="dark:bg-slate-900/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" />Entregado por
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p className="font-semibold">
                {personalEntrega.persona.nombres} {personalEntrega.persona.apellidos ?? ""}
              </p>
              {personalEntrega.persona.email && <p className="text-muted-foreground">{personalEntrega.persona.email}</p>}
            </CardContent>
          </Card>

          <Card className="dark:bg-slate-900/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="h-4 w-4" />Fecha
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-lg">
                {new Date(asignacion.fechaAsignacion).toLocaleDateString("es-PE", {
                  weekday: "long", day: "2-digit", month: "long", year: "numeric",
                })}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
