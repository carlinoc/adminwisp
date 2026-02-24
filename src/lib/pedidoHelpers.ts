import { prisma } from "@/lib/prisma"

export async function getPedidoFormData() {
  const [tiposRaw, clientesRaw, empleadosRaw] = await Promise.all([
    prisma.tipoPedido.findMany({ orderBy: { nombre: "asc" } }),
    prisma.cliente.findMany({
      where: { estadoConexion: { not: "BAJA" } },
      include: {
        persona: { select: { nombres: true, apellidos: true } },
        contratos: {
          where: { estado: { in: ["ACTIVO", "PENDIENTE"] } },
          include: { tarifaPlan: { select: { nombrePlan: true } } },
          orderBy: { fechaContrato: "desc" },
        },
      },
      orderBy: { persona: { apellidos: "asc" } },
    }),
    prisma.personaEmpleado.findMany({
      where: { estadoLaboral: "ACTIVO" },
      include: { persona: { select: { nombres: true, apellidos: true } } },
      orderBy: { persona: { nombres: "asc" } },
    }),
  ])

  const tipos = tiposRaw.map((t) => ({
    id: t.id,
    nombre: t.nombre,
    prioridadDefault: t.prioridadDefault,
    requiereAprobacion: t.requiereAprobacion,
  }))

  const clientes = clientesRaw.map((c) => ({
    id:     c.id,
    nombre: `${c.persona.nombres} ${c.persona.apellidos ?? ""}`.trim(),
    codigo: c.codigoCliente,
    contratos: c.contratos.map((ct) => ({
      id:     ct.id,
      plan:   ct.tarifaPlan.nombrePlan,
      estado: ct.estado,
    })),
  }))

  const empleados = empleadosRaw.map((e) => ({
    id:        e.id,
    nombre:    `${e.persona.nombres} ${e.persona.apellidos ?? ""}`.trim(),
    esTecnico: e.esTecnico,
  }))

  return { tipos, clientes, empleados }
}
