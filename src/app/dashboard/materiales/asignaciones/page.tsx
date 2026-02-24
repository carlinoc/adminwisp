export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, ClipboardList } from "lucide-react"
import Link from "next/link"
import AsignacionesTable from "@/components/features/materiales/AsignacionesTable"

export default async function AsignacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const params = await searchParams
  const search = params.search || ""

  const where: Record<string, unknown> = {}
  if (search) {
    where.OR = [
      { material: { nombre: { contains: search, mode: "insensitive" } } },
      { serial:   { contains: search, mode: "insensitive" } },
      { tecnico:  { persona: { nombres:  { contains: search, mode: "insensitive" } } } },
      { tecnico:  { persona: { apellidos: { contains: search, mode: "insensitive" } } } },
    ]
  }

  const [asignacionesRaw, stats] = await Promise.all([
    prisma.materialAsignado.findMany({
      where,
      include: {
        material:        { select: { nombre: true, unidadMedida: true, requiereDevolucion: true } },
        tecnico:         { include: { persona: { select: { nombres: true, apellidos: true } } } },
        personalEntrega: { include: { persona: { select: { nombres: true, apellidos: true } } } },
      },
      orderBy: { fechaAsignacion: "desc" },
    }),
    Promise.all([
      prisma.materialAsignado.count(),
      prisma.materialAsignado.count({ where: { material: { requiereDevolucion: true } } }),
    ]),
  ])

  const [total, conDevolucion] = stats

  // Serializar fechas para client component
  const asignaciones = asignacionesRaw.map((a) => ({
    ...a,
    fechaAsignacion: a.fechaAsignacion,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Asignaciones</h1>
          <p className="text-muted-foreground mt-1">Registro de materiales asignados al personal técnico</p>
        </div>
        <Link href="/dashboard/materiales/asignaciones/nueva">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" />Nueva Asignación
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-lg">
        <Card className="dark:bg-slate-900/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Asignaciones</p>
            <p className="text-2xl font-bold">{total}</p>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-900/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Con Devolución</p>
            <p className="text-2xl font-bold text-blue-600">{conDevolucion}</p>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-900/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Mostrando</p>
            <p className="text-2xl font-bold">{asignaciones.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Búsqueda */}
      <form method="GET" className="flex gap-3 max-w-md">
        <Input name="search" defaultValue={search} placeholder="Buscar por material, técnico o serial..." />
        <Button type="submit">Buscar</Button>
        {search && <Link href="/dashboard/materiales/asignaciones"><Button variant="outline">Limpiar</Button></Link>}
      </form>

      {/* Tabla */}
      <Card className="dark:bg-slate-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Registro de Asignaciones ({asignaciones.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AsignacionesTable asignaciones={asignaciones} />
        </CardContent>
      </Card>
    </div>
  )
}
