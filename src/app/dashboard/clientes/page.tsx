import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Search } from "lucide-react"
import Link from "next/link"
import ClientesTable from "@/components/features/clientes/ClientesTable"
import ClientesSearch from "@/components/features/clientes/ClientesSearch"

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; estado?: string }>
}) {
  const params = await searchParams
  const search = params.search || ""
  const estado = params.estado || ""

  // Construir filtros
  const where: any = {}

  if (search) {
    where.OR = [
      { codigoCliente: { contains: search, mode: "insensitive" } },
      { persona: { nombres: { contains: search, mode: "insensitive" } } },
      { persona: { apellidos: { contains: search, mode: "insensitive" } } },
      { persona: { dni: { contains: search, mode: "insensitive" } } },
      { persona: { email: { contains: search, mode: "insensitive" } } },
    ]
  }

  if (estado) {
    where.estadoConexion = estado
  }

  // Obtener clientes
  const clientesRaw = await prisma.cliente.findMany({
    where,
    include: {
      persona: true,
      zona: true,
      vendedor: true,
    },
    orderBy: {
      fechaAlta: "desc",
    },
  })

  // Convertir Decimal a número para componentes cliente
  const clientes = clientesRaw.map(cliente => ({
    ...cliente,
    saldoFavor: Number(cliente.saldoFavor),
  }))

  // Estadísticas
  const stats = {
    total: await prisma.cliente.count(),
    activos: await prisma.cliente.count({ where: { estadoConexion: "ACTIVO" } }),
    suspendidos: await prisma.cliente.count({ where: { estadoConexion: "SUSPENDIDO" } }),
    cortados: await prisma.cliente.count({ where: { estadoConexion: "CORTADO" } }),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          {/* CAMBIO: text-foreground se adapta automáticamente a blanco en dark y negro en light */}
          <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
          {/* CAMBIO: text-muted-foreground para subtítulos secundarios */}
          <p className="text-muted-foreground mt-1">
            Gestiona todos los clientes del sistema
          </p>
        </div>
        <Link href="/dashboard/clientes/nuevo">
          {/* CAMBIO: Los botones de shadcn deberían ser automáticos, 
              pero asegúrate de que el componente Button no tenga clases de color fijas */}
          <Button className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-500">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Cliente
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="dark:bg-slate-900/50">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Total Clientes</div>
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card className="dark:bg-slate-900/50">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Activos</div>
            {/* Colores semánticos (verde/rojo) suelen verse bien, pero puedes usar variantes dark si son muy oscuros */}
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.activos}</div>
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-900/50">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Suspendidos</div>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.suspendidos}</div>
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-900/50">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Cortados</div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.cortados}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <ClientesSearch />

      {/* Table */}
      <Card className="dark:bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-foreground">Lista de Clientes ({clientes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ClientesTable clientes={clientes} />
        </CardContent>
      </Card>
    </div>
  )
}