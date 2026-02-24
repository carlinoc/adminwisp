import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import PedidoForm from "@/components/features/pedidos/PedidoForm"
import { getPedidoFormData } from "@/lib/pedidoHelpers"

export default async function NuevoPedidoPage({
  searchParams,
}: {
  searchParams: Promise<{ clienteId?: string }>
}) {
  const params           = await searchParams
  const defaultClienteId = params.clienteId || ""

  const { tipos, clientes, empleados } = await getPedidoFormData()

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/pedidos">
          <Button variant="ghost" size="icon" className="dark:hover:bg-slate-800">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Nuevo Pedido</h1>
          <p className="text-muted-foreground mt-1">
            Registra una solicitud de un cliente.
          </p>
        </div>
      </div>
      <Card className="dark:bg-slate-900/50">
        <CardHeader><CardTitle>Datos del Pedido</CardTitle></CardHeader>
        <CardContent>
          <PedidoForm
            tipos={tipos}
            clientes={clientes}
            empleados={empleados}
            defaultClienteId={defaultClienteId}
          />
        </CardContent>
      </Card>
    </div>
  )
}
