export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import PersonalForm from "@/components/features/personal/PersonalForm"

export default async function EditarPersonalPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const persona = await prisma.persona.findUnique({
    where: { id },
    include: {
      personaEmpleado: true,
      personaUsuario:  { select: { rolPrincipal: true, estadoAcceso: true } },
    },
  })

  if (!persona || !persona.personaEmpleado || !persona.personaUsuario) notFound()

  const emp = persona.personaEmpleado
  const usr = persona.personaUsuario

  const initialData = {
    personaId:         persona.id,
    nombres:           persona.nombres,
    apellidos:         persona.apellidos,
    dni:               persona.dni,
    email:             persona.email,
    telefono:          persona.telefono,
    direccion:         persona.direccion,
    fechaNacimiento:   persona.fechaNacimiento,
    fechaContratacion: emp.fechaContratacion,
    esTecnico:         emp.esTecnico,
    estadoLaboral:     emp.estadoLaboral,
    rolPrincipal:      usr.rolPrincipal,
    estadoAcceso:      usr.estadoAcceso,
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/personal/${id}`}>
          <Button variant="ghost" size="icon" className="dark:hover:bg-slate-800">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Editar Empleado</h1>
          <p className="text-muted-foreground mt-1">
            {persona.nombres} {persona.apellidos ?? ""} — DNI {persona.dni ?? "—"}
          </p>
        </div>
      </div>

      <Card className="dark:bg-slate-900/50">
        <CardHeader>
          <CardTitle>Datos del Empleado</CardTitle>
        </CardHeader>
        <CardContent>
          <PersonalForm initialData={initialData} />
        </CardContent>
      </Card>
    </div>
  )
}
