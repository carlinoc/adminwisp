export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ClipboardList, Plus, ShieldCheck, Shield, Layers } from "lucide-react"
import Link from "next/link"
import TiposPedidoTable from "@/components/features/pedidos/TiposPedidoTable"

export default async function TiposPedidoPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const params = await searchParams
  const search = params.search || ""

  const where = search
    ? { nombre: { contains: search, mode: "insensitive" as const } }
    : {}

  const [tipos, totalPedidos] = await Promise.all([
    prisma.tipoPedido.findMany({
      where,
      include: { _count: { select: { pedidos: true } } },
      orderBy: { nombre: "asc" },
    }),
    prisma.pedido.count(),
  ])

  const conAprobacion   = tipos.filter((t) => t.requiereAprobacion).length
  const sinAprobacion   = tipos.filter((t) => !t.requiereAprobacion).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tipos de Pedido</h1>
          <p className="text-muted-foreground mt-1">
            Catálogo de tipos y configuración de prioridades
          </p>
        </div>
        <Link href="/dashboard/pedidos/tipos/nuevo">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" />Nuevo Tipo
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="dark:bg-slate-900/50">
          <CardContent className="p-4 flex items-center gap-3">
            <Layers className="h-8 w-8 text-blue-600 flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Total Tipos</p>
              <p className="text-2xl font-bold">{tipos.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-900/50">
          <CardContent className="p-4 flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Con Aprobación</p>
              <p className="text-2xl font-bold text-amber-600">{conAprobacion}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-900/50">
          <CardContent className="p-4 flex items-center gap-3">
            <Shield className="h-8 w-8 text-slate-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Sin Aprobación</p>
              <p className="text-2xl font-bold">{sinAprobacion}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-900/50">
          <CardContent className="p-4 flex items-center gap-3">
            <ClipboardList className="h-8 w-8 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Total Pedidos</p>
              <p className="text-2xl font-bold text-green-600">{totalPedidos}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtro */}
      <form method="GET" className="flex gap-3">
        <Input name="search" defaultValue={search}
          placeholder="Buscar por nombre…" className="max-w-sm" />
        <Button type="submit">Buscar</Button>
        {search && (
          <Link href="/dashboard/pedidos/tipos">
            <Button variant="outline">Limpiar</Button>
          </Link>
        )}
      </form>

      {/* Tabla */}
      <Card className="dark:bg-slate-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />Tipos de Pedido ({tipos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TiposPedidoTable tipos={tipos} />
        </CardContent>
      </Card>
    </div>
  )
}
