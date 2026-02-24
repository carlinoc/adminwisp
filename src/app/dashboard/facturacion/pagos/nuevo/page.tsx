export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import PagoForm from "@/components/features/facturacion/PagoForm"

export default async function NuevoPagoPage({
  searchParams,
}: {
  searchParams: Promise<{ clienteId?: string; contratoId?: string }>
}) {
  const params            = await searchParams
  const defaultClienteId  = params.clienteId  || ""
  const defaultContratoId = params.contratoId || ""

  const clientesRaw = await prisma.cliente.findMany({
    where: { estadoConexion: { not: "BAJA" } },
    include: {
      persona: { select: { nombres: true, apellidos: true } },
      contratos: {
        where: { estado: { in: ["ACTIVO", "PENDIENTE"] } },
        include: {
          tarifaPlan: { select: { nombrePlan: true } },
          facturas: {
            where: { saldoPendiente: { gt: 0 } },
            select: {
              id: true, periodoFacturado: true,
              fechaVencimiento: true, montoTotal: true, saldoPendiente: true,
            },
            orderBy: { periodoFacturado: "asc" },
          },
        },
      },
    },
    orderBy: { persona: { apellidos: "asc" } },
  })

  const clientes = clientesRaw.map((c) => ({
    id:         c.id,
    nombre:     `${c.persona.nombres} ${c.persona.apellidos ?? ""}`.trim(),
    codigo:     c.codigoCliente,
    saldoFavor: Number(c.saldoFavor),
    contratos:  c.contratos.map((ct) => ({
      id:          ct.id,
      plan:        ct.tarifaPlan.nombrePlan,
      montoActual: Number(ct.montoActual),
      facturasPendientes: ct.facturas.map((f) => ({
        id:               f.id,
        periodoFacturado: f.periodoFacturado.toISOString().split("T")[0],
        fechaVencimiento: f.fechaVencimiento.toISOString().split("T")[0],
        montoTotal:       Number(f.montoTotal),
        saldoPendiente:   Number(f.saldoPendiente),
      })),
    })),
  }))

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/facturacion/pagos">
          <Button variant="ghost" size="icon" className="dark:hover:bg-slate-800">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Registrar Pago</h1>
          <p className="text-muted-foreground mt-1">
            Registra el cobro y aplícalo a las facturas pendientes del cliente.
          </p>
        </div>
      </div>
      <Card className="dark:bg-slate-900/50">
        <CardHeader><CardTitle>Datos del Pago</CardTitle></CardHeader>
        <CardContent>
          <PagoForm
            clientes={clientes}
            defaultClienteId={defaultClienteId}
            defaultContratoId={defaultContratoId}
          />
        </CardContent>
      </Card>
    </div>
  )
}
