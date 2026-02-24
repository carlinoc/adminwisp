export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import ContratoForm from "@/components/features/contratos/ContratoForm"

export default async function EditarContratoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [contratoRaw, planesRaw] = await Promise.all([
    prisma.contrato.findUnique({
      where: { id },
      include: {
        cliente: {
          include: {
            persona: { select: { nombres: true, apellidos: true } },
            ubicaciones: { select: { id: true, direccion: true } },
          },
        },
      },
    }),
    prisma.tarifaPlan.findMany({ orderBy: { tarifaMensual: "asc" } }),
  ])

  if (!contratoRaw) notFound()

  const planes = planesRaw.map((p) => ({
    ...p,
    tarifaMensual: Number(p.tarifaMensual),
    comisionVenta: Number(p.comisionVenta),
  }))

  const clienteData = {
    id:         contratoRaw.cliente.id,
    nombre:     `${contratoRaw.cliente.persona.nombres} ${contratoRaw.cliente.persona.apellidos ?? ""}`.trim(),
    codigo:     contratoRaw.cliente.codigoCliente,
    ubicaciones: contratoRaw.cliente.ubicaciones,
  }

  const initialData = {
    id:                     contratoRaw.id,
    clienteId:              contratoRaw.clienteId,
    tarifaPlanId:           contratoRaw.tarifaPlanId,
    ubicacionInstalacionId: contratoRaw.ubicacionInstalacionId,
    fechaInicioServicio:    contratoRaw.fechaInicioServicio?.toISOString().split("T")[0] ?? null,
    cicloFacturacion:       contratoRaw.cicloFacturacion,
    montoActual:            Number(contratoRaw.montoActual),
    estado:                 contratoRaw.estado,
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/contratos/${id}`}>
          <Button variant="ghost" size="icon" className="dark:hover:bg-slate-800">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Editar Contrato</h1>
          <p className="text-muted-foreground mt-1">
            El cliente y la ubicación no pueden modificarse.
          </p>
        </div>
      </div>

      <Card className="dark:bg-slate-900/50">
        <CardHeader><CardTitle>Datos del Contrato</CardTitle></CardHeader>
        <CardContent>
          <ContratoForm
            planes={planes}
            clientes={[clienteData]}
            initialData={initialData}
          />
        </CardContent>
      </Card>
    </div>
  )
}
