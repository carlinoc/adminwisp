import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import FacturaForm from "@/components/features/facturacion/FacturaForm"

export default async function NuevaFacturaPage({
  searchParams,
}: {
  searchParams: Promise<{ contratoId?: string }>
}) {
  const params           = await searchParams
  const defaultContratoId = params.contratoId || ""

  const contratosRaw = await prisma.contrato.findMany({
    where: { estado: { in: ["ACTIVO", "PENDIENTE"] } },
    include: {
      tarifaPlan: { select: { nombrePlan: true, velocidadDescarga: true, velocidadSubida: true } },
      cliente: {
        select: {
          persona: { select: { nombres: true, apellidos: true } },
          codigoCliente: true,
        },
      },
    },
    orderBy: { cliente: { persona: { apellidos: "asc" } } },
  })

  const contratos = contratosRaw.map((c) => ({
    id:          c.id,
    plan:        c.tarifaPlan.nombrePlan,
    velocidades: `${c.tarifaPlan.velocidadDescarga}/${c.tarifaPlan.velocidadSubida}`,
    montoActual: Number(c.montoActual),
    cliente:     `${c.cliente.persona.nombres} ${c.cliente.persona.apellidos ?? ""}`.trim(),
    codigoCliente: c.cliente.codigoCliente,
  }))

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/facturacion/facturas">
          <Button variant="ghost" size="icon" className="dark:hover:bg-slate-800">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Nueva Factura</h1>
          <p className="text-muted-foreground mt-1">Genera una factura mensual para un contrato.</p>
        </div>
      </div>
      <Card className="dark:bg-slate-900/50">
        <CardHeader><CardTitle>Datos de la Factura</CardTitle></CardHeader>
        <CardContent>
          <FacturaForm contratos={contratos} defaultContratoId={defaultContratoId} />
        </CardContent>
      </Card>
    </div>
  )
}
