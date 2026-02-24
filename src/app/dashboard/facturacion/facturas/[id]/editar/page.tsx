export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import FacturaForm from "@/components/features/facturacion/FacturaForm"

export default async function EditarFacturaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const facturaRaw = await prisma.facturaRecibo.findUnique({
    where: { id },
    include: {
      contrato: {
        include: {
          tarifaPlan: { select: { nombrePlan: true, velocidadDescarga: true, velocidadSubida: true } },
          cliente: {
            select: {
              codigoCliente: true,
              persona: { select: { nombres: true, apellidos: true } },
            },
          },
        },
      },
    },
  })
  if (!facturaRaw) notFound()

  const contratoData = {
    id:          facturaRaw.contratoId,
    plan:        facturaRaw.contrato.tarifaPlan.nombrePlan,
    velocidades: `${facturaRaw.contrato.tarifaPlan.velocidadDescarga}/${facturaRaw.contrato.tarifaPlan.velocidadSubida}`,
    montoActual: Number(facturaRaw.contrato.montoActual),
    cliente:     `${facturaRaw.contrato.cliente.persona.nombres} ${facturaRaw.contrato.cliente.persona.apellidos ?? ""}`.trim(),
    codigoCliente: facturaRaw.contrato.cliente.codigoCliente,
  }

  const initialData = {
    id:               facturaRaw.id,
    contratoId:       facturaRaw.contratoId,
    periodoFacturado: facturaRaw.periodoFacturado.toISOString().substring(0, 7),
    fechaVencimiento: facturaRaw.fechaVencimiento.toISOString().split("T")[0],
    montoTotal:       Number(facturaRaw.montoTotal),
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/facturacion/facturas/${id}`}>
          <Button variant="ghost" size="icon" className="dark:hover:bg-slate-800">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Editar Factura</h1>
          <p className="text-muted-foreground mt-1">El período no puede modificarse.</p>
        </div>
      </div>
      <Card className="dark:bg-slate-900/50">
        <CardHeader><CardTitle>Datos de la Factura</CardTitle></CardHeader>
        <CardContent>
          <FacturaForm
            contratos={[contratoData]}
            initialData={initialData}
          />
        </CardContent>
      </Card>
    </div>
  )
}
