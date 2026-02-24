import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import TipoPedidoForm from "@/components/features/pedidos/TipoPedidoForm"

export default async function EditarTipoPedidoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const tipo   = await prisma.tipoPedido.findUnique({ where: { id } })
  if (!tipo) notFound()

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/pedidos/tipos">
          <Button variant="ghost" size="icon" className="dark:hover:bg-slate-800">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Editar Tipo</h1>
          <p className="text-muted-foreground mt-1">{tipo.nombre}</p>
        </div>
      </div>
      <Card className="dark:bg-slate-900/50">
        <CardHeader><CardTitle>Datos del Tipo</CardTitle></CardHeader>
        <CardContent>
          <TipoPedidoForm initialData={tipo} />
        </CardContent>
      </Card>
    </div>
  )
}
