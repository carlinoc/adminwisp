import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, Package, DollarSign, TrendingUp, Activity } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { formatCurrency } from "@/lib/utils"

export default async function DashboardPage() {
  // Obtener estadísticas
  const [
    totalClientes,
    clientesActivos,
    totalContratos,
    contratosActivos,
    totalMateriales,
    materialesDisponibles,
  ] = await Promise.all([
    prisma.cliente.count(),
    prisma.cliente.count({ where: { estadoConexion: "ACTIVO" } }),
    prisma.contrato.count(),
    prisma.contrato.count({ where: { estado: "ACTIVO" } }),
    prisma.material.count(),
    prisma.inventario.aggregate({ _sum: { cantidadDisponible: true } }),
  ])

  // Calcular ingresos del mes actual
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const pagosDelMes = await prisma.pago.aggregate({
    where: {
      fechaPago: {
        gte: startOfMonth,
      },
    },
    _sum: {
      montoPagado: true,
    },
  })

  const stats = [
    {
      title: "Clientes Totales",
      value: totalClientes,
      subtitle: `${clientesActivos} activos`,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Contratos",
      value: totalContratos,
      subtitle: `${contratosActivos} activos`,
      icon: FileText,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Ingresos del Mes",
      value: formatCurrency(Number(pagosDelMes._sum.montoPagado) || 0),
      subtitle: "Pagos recibidos",
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      title: "Materiales",
      value: materialesDisponibles._sum.cantidadDisponible || 0,
      subtitle: `${totalMateriales} tipos`,
      icon: Package,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ]

  // Obtener últimos clientes
  const ultimosClientes = await prisma.cliente.findMany({
    take: 5,
    orderBy: { fechaAlta: "desc" },
    include: {
      persona: true,
      zona: true,
    },
  })

  // Obtener últimos pagos
  const ultimosPagos = await prisma.pago.findMany({
    take: 5,
    orderBy: { fechaPago: "desc" },
    include: {
      cliente: {
        include: { persona: true },
      },
    },
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Resumen general del sistema ADMINISP
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {stat.value}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {stat.subtitle}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor} dark:bg-opacity-20`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimos Clientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Últimos Clientes Registrados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ultimosClientes.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                No hay clientes registrados
              </p>
            ) : (
              <div className="space-y-3">
                {ultimosClientes.map((cliente) => (
                  <div
                    key={cliente.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {cliente.persona.nombres} {cliente.persona.apellidos}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {cliente.codigoCliente} • {cliente.zona?.nombre || "Sin zona"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${
                          cliente.estadoConexion === "ACTIVO"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {cliente.estadoConexion}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Últimos Pagos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Últimos Pagos Recibidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ultimosPagos.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                No hay pagos registrados
              </p>
            ) : (
              <div className="space-y-3">
                {ultimosPagos.map((pago) => (
                  <div
                    key={pago.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {pago.cliente.persona.nombres}{" "}
                        {pago.cliente.persona.apellidos}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(pago.fechaPago).toLocaleDateString("es-PE")} •{" "}
                        {pago.tipoPago}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        {formatCurrency(Number(pago.montoPagado))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Acciones Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/dashboard/clientes"
              className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-center"
            >
              <Users className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="font-medium text-gray-900 dark:text-white">Gestionar Clientes</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Ver, crear y editar clientes
              </p>
            </a>
            <a
              href="/dashboard/contratos"
              className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors text-center"
            >
              <FileText className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="font-medium text-gray-900 dark:text-white">Gestionar Contratos</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Administrar contratos activos
              </p>
            </a>
            <a
              href="/dashboard/inventario"
              className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-center"
            >
              <Package className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="font-medium text-gray-900 dark:text-white">Control de Inventario</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Gestionar materiales y stock
              </p>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}