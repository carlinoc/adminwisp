import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import ContratoForm from "@/components/features/contratos/ContratoForm"

export default async function NuevoContratoPage({
  searchParams,
}: {
  searchParams: Promise<{ clienteId?: string }>
}) {
  const params           = await searchParams
  const defaultClienteId = params.clienteId || ""

  const [planesRaw, clientesRaw] = await Promise.all([
    prisma.tarifaPlan.findMany({ orderBy: { tarifaMensual: "asc" } }),
    prisma.cliente.findMany({
      where: { estadoConexion: { not: "BAJA" } },
      include: {
        persona: { select: { nombres: true, apellidos: true } },
        ubicaciones: { select: { id: true, direccion: true } },
      },
      orderBy: { persona: { apellidos: "asc" } },
    }),
  ])

  const planes = planesRaw.map((p) => ({
    ...p,
    tarifaMensual: Number(p.tarifaMensual),
    comisionVenta: Number(p.comisionVenta),
  }))

  const clientes = clientesRaw.map((c) => ({
    id:         c.id,
    nombre:     `${c.persona.nombres} ${c.persona.apellidos ?? ""}`.trim(),
    codigo:     c.codigoCliente,
    ubicaciones: c.ubicaciones,
  }))

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/contratos">
          <Button variant="ghost" size="icon" className="dark:hover:bg-slate-800">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Nuevo Contrato</h1>
          <p className="text-muted-foreground mt-1">
            Vincula un cliente con un plan de tarifa y su ubicación de instalación.
          </p>
        </div>
      </div>

      <Card className="dark:bg-slate-900/50">
        <CardHeader><CardTitle>Datos del Contrato</CardTitle></CardHeader>
        <CardContent>
          <ContratoForm
            planes={planes}
            clientes={clientes}
            defaultClienteId={defaultClienteId}
          />
        </CardContent>
      </Card>
    </div>
  )
}
