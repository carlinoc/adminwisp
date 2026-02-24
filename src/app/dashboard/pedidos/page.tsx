export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  ClipboardList, Plus, Clock, PlayCircle,
  CheckCircle2, XCircle,
} from "lucide-react"
import Link from "next/link"
import PedidosTable from "@/components/features/pedidos/PedidosTable"

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; estado?: string; tipo?: string }>
}) {
  const params = await searchParams
  const search = params.search || ""
  const estado = params.estado || ""
  const tipo   = params.tipo   || ""

  const where: Record<string, unknown> = {}
  if (estado) where.estado = estado
  if (tipo)   where.tipoPedidoId = tipo
  if (search) {
    where.OR = [
      { numero: { contains: search, mode: "insensitive" } },
      { cliente: { persona: { nombres:   { contains: search, mode: "insensitive" } } } },
      { cliente: { persona: { apellidos: { contains: search, mode: "insensitive" } } } },
      { cliente: { codigoCliente: { contains: search, mode: "insensitive" } } },
      { tipoPedido: { nombre: { contains: search, mode: "insensitive" } } },
    ]
  }

  const [pedidosRaw, stats, tipos] = await Promise.all([
    prisma.pedido.findMany({
      where,
      include: {
        cliente: {
          select: {
            id: true, codigoCliente: true,
            persona: { select: { nombres: true, apellidos: true } },
          },
        },
        tipoPedido: { select: { nombre: true, prioridadDefault: true } },
        contrato:   { select: { id: true } },
      },
      orderBy: { fechaSolicitud: "desc" },
    }),
    prisma.pedido.groupBy({ by: ["estado"], _count: { id: true } }),
    prisma.tipoPedido.findMany({ orderBy: { nombre: "asc" }, select: { id: true, nombre: true } }),
  ])

  // Obtener empleados receptores (FK sin relación declarada)
  const empleadoIds = [...new Set(pedidosRaw.map((p) => p.empleadoReceptorId))]
  const empleadosRaw = empleadoIds.length > 0
    ? await prisma.personaEmpleado.findMany({
        where: { id: { in: empleadoIds } },
        include: { persona: { select: { nombres: true, apellidos: true } } },
      })
    : []
  const empleadoMap = new Map(empleadosRaw.map((e) => [e.id, e]))

  const pedidos = pedidosRaw.map((p) => {
    const emp = empleadoMap.get(p.empleadoReceptorId)
    return {
      id:                p.id,
      numero:            p.numero,
      estado:            p.estado,
      fechaSolicitud:    p.fechaSolicitud.toISOString().split("T")[0],
      motivoCancelacion: p.motivoCancelacion,
      cliente:           p.cliente,
      tipoPedido:        p.tipoPedido,
      empleadoReceptor: {
        persona: {
          nombres:   emp?.persona.nombres   ?? "—",
          apellidos: emp?.persona.apellidos ?? null,
        },
      },
    }
  })

  const byEstado = Object.fromEntries(stats.map((s) => [s.estado, s._count.id]))

  const ESTADOS = [
    { key: "PENDIENTE",  label: "Pendientes",  Icon: Clock,        color: "text-blue-600"   },
    { key: "EN_PROCESO", label: "En Proceso",  Icon: PlayCircle,   color: "text-yellow-600" },
    { key: "COMPLETADO", label: "Completados", Icon: CheckCircle2, color: "text-green-600"  },
    { key: "CANCELADO",  label: "Cancelados",  Icon: XCircle,      color: "text-red-600"    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pedidos</h1>
          <p className="text-muted-foreground mt-1">Gestión de solicitudes de clientes</p>
        </div>
        <Link href="/dashboard/pedidos/nuevo">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" />Nuevo Pedido
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {ESTADOS.map(({ key, label, Icon, color }) => (
          <Card key={key} className="dark:bg-slate-900/50">
            <CardContent className="p-4 flex items-center gap-3">
              <Icon className={`h-8 w-8 ${color} flex-shrink-0`} />
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={`text-2xl font-bold ${color}`}>{byEstado[key] ?? 0}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <form method="GET" className="flex flex-wrap gap-3">
        <Input name="search" defaultValue={search}
          placeholder="Buscar por número, cliente o tipo…"
          className="flex-1 min-w-52" />
        <select name="estado" defaultValue={estado}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm dark:bg-slate-950">
          <option value="">Todos los estados</option>
          {ESTADOS.map(({ key, label }) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select name="tipo" defaultValue={tipo}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm dark:bg-slate-950">
          <option value="">Todos los tipos</option>
          {tipos.map((t) => (
            <option key={t.id} value={t.id}>{t.nombre}</option>
          ))}
        </select>
        <Button type="submit">Filtrar</Button>
        {(search || estado || tipo) && (
          <Link href="/dashboard/pedidos">
            <Button variant="outline">Limpiar</Button>
          </Link>
        )}
      </form>

      {/* Tabla */}
      <Card className="dark:bg-slate-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />Pedidos ({pedidos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PedidosTable pedidos={pedidos} />
        </CardContent>
      </Card>
    </div>
  )
}
