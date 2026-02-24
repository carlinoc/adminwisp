export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

import { Plus, Users } from "lucide-react"
import Link from "next/link"
import PersonalTable from "@/components/features/personal/PersonalTable"
import PersonalSearch from "@/components/features/personal/PersonalSearch"

export default async function PersonalPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; rol?: string; estado?: string }>
}) {
  const params = await searchParams
  const search = params.search || ""
  const rol    = params.rol    || ""
  const estado = params.estado || ""

  // ── Filtros ──────────────────────────────────────────────────
  const personaWhere: Record<string, unknown> = {
    personaEmpleado: { isNot: null },
    personaUsuario:  { isNot: null },
  }

  if (search) {
    personaWhere.OR = [
      { nombres:  { contains: search, mode: "insensitive" } },
      { apellidos:{ contains: search, mode: "insensitive" } },
      { dni:      { contains: search, mode: "insensitive" } },
      { email:    { contains: search, mode: "insensitive" } },
    ]
  }
  if (rol)    personaWhere.personaUsuario = { rolPrincipal: rol }
  if (estado) personaWhere.personaUsuario = {
    ...(typeof personaWhere.personaUsuario === "object" ? personaWhere.personaUsuario as object : {}),
    estadoAcceso: estado,
  }

  // ── Datos en paralelo ─────────────────────────────────────────
  const [personasRaw, stats] = await Promise.all([
    prisma.persona.findMany({
      where: personaWhere,
      include: {
        personaEmpleado: true,
        personaUsuario:  { select: { rolPrincipal: true, estadoAcceso: true } },
      },
      orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
    }),
    Promise.all([
      prisma.personaEmpleado.count(),
      prisma.personaUsuario.count({ where: { estadoAcceso: "ACTIVO" } }),
      prisma.personaUsuario.count({ where: { rolPrincipal: "ADMIN" } }),
      prisma.personaEmpleado.count({ where: { esTecnico: true } }),
    ]),
  ])

  const [total, accesosActivos, totalAdmins, totalTecnicos] = stats

  // ── Serializar para Client Components ────────────────────────
  const personal = personasRaw
    .filter((p) => p.personaEmpleado && p.personaUsuario)
    .map((p) => ({
      personaId:         p.id,
      nombres:           p.nombres,
      apellidos:         p.apellidos,
      dni:               p.dni,
      email:             p.email,
      telefono:          p.telefono,
      esTecnico:         p.personaEmpleado!.esTecnico,
      estadoLaboral:     p.personaEmpleado!.estadoLaboral,
      fechaContratacion: p.personaEmpleado!.fechaContratacion,
      rolPrincipal:      p.personaUsuario!.rolPrincipal,
      estadoAcceso:      p.personaUsuario!.estadoAcceso,
    }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Personal</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona el equipo de trabajo y sus accesos al sistema
          </p>
        </div>
        <Link href="/dashboard/personal/nuevo">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Empleado
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="dark:bg-slate-900/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Personal</p>
            <p className="text-2xl font-bold text-foreground">{total}</p>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-900/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Acceso Activo</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{accesosActivos}</p>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-900/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Administradores</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{totalAdmins}</p>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-900/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Técnicos</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{totalTecnicos}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <PersonalSearch />

      {/* Table */}
      <Card className="dark:bg-slate-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Lista de Personal ({personal.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PersonalTable personal={personal} />
        </CardContent>
      </Card>
    </div>
  )
}
