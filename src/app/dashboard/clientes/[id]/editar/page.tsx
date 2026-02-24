export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import ClienteForm from "@/components/features/clientes/ClienteForm"

export default async function EditarClientePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [cliente, zonas, vendedores, personas] = await Promise.all([
    prisma.cliente.findUnique({
      where: { id },
      include: {
        persona: { include: { personaJuridica: true } },
      },
    }),
    prisma.zona.findMany({ where: { esActivo: true }, orderBy: { nombre: "asc" } }),
    prisma.persona.findMany({
      where: {
        personaUsuario: { rolPrincipal: "VENDEDOR", estadoAcceso: "ACTIVO" },
      },
      orderBy: { nombres: "asc" },
    }),
    prisma.persona.findMany({
      where: { tipoEntidad: "NATURAL", dni: { not: null } },
      select: { id: true, nombres: true, apellidos: true, dni: true },
      orderBy: { nombres: "asc" },
    }),
  ])

  if (!cliente) notFound()

  const initialData = {
    ...cliente,
    saldoFavor: Number(cliente.saldoFavor),
    persona: cliente.persona,
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/clientes/${id}`}>
          <Button variant="ghost" size="icon" className="dark:hover:bg-slate-800">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Editar Cliente</h1>
          <p className="text-muted-foreground">
            {cliente.persona.nombres} {cliente.persona.apellidos ?? ""} —{" "}
            {cliente.codigoCliente}
          </p>
        </div>
      </div>

      <Card className="dark:bg-slate-900/50 border-border">
        <CardHeader>
          <CardTitle>Datos del Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <ClienteForm
            initialData={initialData}
            zonas={zonas}
            vendedores={vendedores}
            personas={personas}
          />
        </CardContent>
      </Card>
    </div>
  )
}
