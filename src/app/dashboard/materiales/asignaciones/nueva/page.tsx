export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import AsignacionForm from "@/components/features/materiales/AsignacionForm"

export default async function NuevaAsignacionPage({
  searchParams,
}: {
  searchParams: Promise<{ materialId?: string }>
}) {
  const params = await searchParams

  // Empleados (todos) como PersonaEmpleado con persona
  const empleados = await prisma.personaEmpleado.findMany({
    where: { estadoLaboral: "ACTIVO" },
    include: {
      persona: { select: { nombres: true, apellidos: true } },
      materialesAsignados: false,
    },
  })

  // Obtener el rol de cada empleado via personaUsuario
  const empleadosConRol = await Promise.all(
    empleados.map(async (e) => {
      const usuario = await prisma.personaUsuario.findUnique({
        where: { personaId: e.personaId },
        select: { rolPrincipal: true },
      })
      return {
        id:       e.id,
        personaId: e.personaId,
        nombres:   e.persona.nombres,
        apellidos: e.persona.apellidos,
        rol:       usuario?.rolPrincipal ?? "—",
      }
    })
  )

  // Técnicos = esTecnico true o rol TECNICO
  const tecnicos = empleadosConRol.filter((e) => {
    const emp = empleados.find((em) => em.id === e.id)
    return emp?.esTecnico || e.rol === "TECNICO"
  })

  // Materiales con stock > 0
  const materialesRaw = await prisma.material.findMany({
    include: { inventarios: { select: { cantidadDisponible: true } } },
    orderBy: [{ categoria: "asc" }, { nombre: "asc" }],
  })

  const materiales = materialesRaw.map((m) => ({
    id:                m.id,
    nombre:            m.nombre,
    categoria:         m.categoria,
    unidadMedida:      m.unidadMedida,
    requiereDevolucion: m.requiereDevolucion,
    stock:             m.inventarios[0]?.cantidadDisponible ?? 0,
  }))

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/materiales/asignaciones">
          <Button variant="ghost" size="icon" className="dark:hover:bg-slate-800">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Nueva Asignación</h1>
          <p className="text-muted-foreground mt-1">
            Registra la entrega de material a un técnico. El stock se descuenta automáticamente.
          </p>
        </div>
      </div>
      <Card className="dark:bg-slate-900/50">
        <CardHeader><CardTitle>Datos de la Asignación</CardTitle></CardHeader>
        <CardContent>
          <AsignacionForm
            tecnicos={tecnicos}
            personal={empleadosConRol}
            materiales={materiales}
            defaultMaterialId={params.materialId}
          />
        </CardContent>
      </Card>
    </div>
  )
}
