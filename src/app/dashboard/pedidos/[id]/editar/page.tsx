import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import PedidoForm from "@/components/features/pedidos/PedidoForm"
import { getPedidoFormData } from "@/lib/pedidoHelpers"

export default async function EditarPedidoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [pedidoRaw, formData] = await Promise.all([
    prisma.pedido.findUnique({
      where: { id },
      include: {
        cliente: {
          include: {
            persona: { select: { nombres: true, apellidos: true } },
            contratos: {
              where: { estado: { in: ["ACTIVO", "PENDIENTE"] } },
              include: { tarifaPlan: { select: { nombrePlan: true } } },
            },
          },
        },
      },
    }),
    getPedidoFormData(),
  ])

  if (!pedidoRaw) notFound()

  // Ensure the cliente is in the clientes list even if status is BAJA
  const clienteEnLista = formData.clientes.find((c) => c.id === pedidoRaw.clienteId)
  if (!clienteEnLista) {
    formData.clientes.unshift({
      id:     pedidoRaw.cliente.id,
      nombre: `${pedidoRaw.cliente.persona.nombres} ${pedidoRaw.cliente.persona.apellidos ?? ""}`.trim(),
      codigo: pedidoRaw.cliente.codigoCliente,
      contratos: pedidoRaw.cliente.contratos.map((c) => ({
        id: c.id, plan: c.tarifaPlan.nombrePlan, estado: c.estado,
      })),
    })
  }

  const initialData = {
    id:                pedidoRaw.id,
    clienteId:         pedidoRaw.clienteId,
    contratoId:        pedidoRaw.contratoId,
    empleadoReceptorId: pedidoRaw.empleadoReceptorId,
    tipoPedidoId:      pedidoRaw.tipoPedidoId,
    fechaSolicitud:    pedidoRaw.fechaSolicitud.toISOString(),
    estado:            pedidoRaw.estado,
    motivoCancelacion: pedidoRaw.motivoCancelacion,
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/pedidos/${id}`}>
          <Button variant="ghost" size="icon" className="dark:hover:bg-slate-800">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Editar Pedido</h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm">{pedidoRaw.numero}</p>
        </div>
      </div>
      <Card className="dark:bg-slate-900/50">
        <CardHeader><CardTitle>Datos del Pedido</CardTitle></CardHeader>
        <CardContent>
          <PedidoForm
            tipos={formData.tipos}
            clientes={formData.clientes}
            empleados={formData.empleados}
            initialData={initialData}
          />
        </CardContent>
      </Card>
    </div>
  )
}
