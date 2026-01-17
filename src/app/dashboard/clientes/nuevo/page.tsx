import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import ClienteForm from "@/components/features/clientes/ClienteForm"
import { prisma } from "@/lib/prisma"

export default async function NuevoClientePage() {
  // Obtener datos necesarios para el formulario
  const [zonas, vendedores, personas] = await Promise.all([
    prisma.zona.findMany({
      where: { esActivo: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.persona.findMany({
      where: {
        personaUsuario: {
          rolPrincipal: "VENDEDOR",
          estadoAcceso: "ACTIVO",
        },
      },
      orderBy: { nombres: "asc" },
    }),
    // Obtener todas las personas naturales para seleccionar representante legal
    prisma.persona.findMany({
      where: {
        tipoEntidad: "NATURAL",
        dni: {
          not: null,
        },
      },
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        dni: true,
      },
      orderBy: { nombres: "asc" },
    }),
  ])

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/clientes">
          <Button variant="ghost" size="icon" className="hover:bg-gray-100 dark:hover:bg-gray-800">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Nuevo Cliente</h1>
          <p className="text-muted-foreground mt-1">
            Registra un nuevo cliente en el sistema
          </p>
        </div>
      </div>

      {/* Form Container */}
      <Card className="border-border bg-card dark:bg-slate-900/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-foreground">Información del Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <ClienteForm zonas={zonas} vendedores={vendedores} personas={personas} />
        </CardContent>
      </Card>
    </div>
  )
}