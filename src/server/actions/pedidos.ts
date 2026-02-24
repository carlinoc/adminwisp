"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { EstadoPedido } from "@prisma/client"
import { generateCode } from "@/lib/utils"

const REVALIDATE = (clienteId?: string) => {
  revalidatePath("/dashboard/pedidos")
  if (clienteId) revalidatePath(`/dashboard/clientes/${clienteId}`)
}

async function generarNumeroPedido(): Promise<string> {
  // Formato: PED-YYYYMM-XXXXXX
  const now    = new Date()
  const anio   = now.getFullYear()
  const mes    = String(now.getMonth() + 1).padStart(2, "0")
  const prefix = `PED-${anio}${mes}-`

  let numero: string
  let existe  = true
  let intentos = 0

  do {
    numero = `${prefix}${generateCode("", 5)}`
    existe = !!(await prisma.pedido.findUnique({ where: { numero } }))
    intentos++
    if (intentos > 20) throw new Error("No se pudo generar número único")
  } while (existe)

  return numero
}

export async function crearPedido(formData: FormData) {
  try {
    const clienteId        = (formData.get("clienteId")        as string)?.trim()
    const contratoId       = (formData.get("contratoId")       as string)?.trim()
    const empleadoReceptorId = (formData.get("empleadoReceptorId") as string)?.trim()
    const tipoPedidoId     = (formData.get("tipoPedidoId")     as string)?.trim()
    const fechaSolicitud   = (formData.get("fechaSolicitud")   as string)?.trim()
    const estado           = (formData.get("estado") as EstadoPedido) || "PENDIENTE"

    if (!clienteId        || clienteId        === "none") return { error: "El cliente es obligatorio" }
    if (!empleadoReceptorId || empleadoReceptorId === "none") return { error: "El empleado receptor es obligatorio" }
    if (!tipoPedidoId     || tipoPedidoId     === "none") return { error: "El tipo de pedido es obligatorio" }

    // Validar relaciones
    const [cliente, empleado, tipo] = await Promise.all([
      prisma.cliente.findUnique({ where: { id: clienteId }, select: { id: true } }),
      prisma.personaEmpleado.findUnique({ where: { id: empleadoReceptorId }, select: { id: true } }),
      prisma.tipoPedido.findUnique({ where: { id: tipoPedidoId }, select: { id: true, requiereAprobacion: true } }),
    ])
    if (!cliente)  return { error: "Cliente no encontrado" }
    if (!empleado) return { error: "Empleado receptor no encontrado" }
    if (!tipo)     return { error: "Tipo de pedido no encontrado" }

    // Si tiene contratoId, validar que pertenece al cliente
    let contratoValido: string | null = null
    if (contratoId && contratoId !== "none" && contratoId !== "") {
      const contrato = await prisma.contrato.findFirst({
        where: { id: contratoId, clienteId },
        select: { id: true },
      })
      if (!contrato) return { error: "El contrato no pertenece a este cliente" }
      contratoValido = contratoId
    }

    const numero = await generarNumeroPedido()

    const pedido = await prisma.pedido.create({
      data: {
        clienteId,
        contratoId:        contratoValido,
        empleadoReceptorId,
        tipoPedidoId,
        numero,
        fechaSolicitud:    fechaSolicitud ? new Date(fechaSolicitud) : new Date(),
        estado,
      },
    })

    REVALIDATE(clienteId)
    revalidatePath(`/dashboard/pedidos/${pedido.id}`)
    return { success: true, data: { id: pedido.id } }
  } catch (error) {
    console.error("Error al crear pedido:", error)
    return { error: "Error interno al crear el pedido" }
  }
}

export async function actualizarPedido(pedidoId: string, formData: FormData) {
  try {
    const tipoPedidoId       = (formData.get("tipoPedidoId")       as string)?.trim()
    const empleadoReceptorId = (formData.get("empleadoReceptorId") as string)?.trim()
    const estado             = (formData.get("estado") as EstadoPedido)
    const motivoCancelacion  = (formData.get("motivoCancelacion")  as string)?.trim()
    const fechaSolicitud     = (formData.get("fechaSolicitud")     as string)?.trim()

    if (!tipoPedidoId       || tipoPedidoId       === "none") return { error: "El tipo de pedido es obligatorio" }
    if (!empleadoReceptorId || empleadoReceptorId === "none") return { error: "El empleado receptor es obligatorio" }

    if (estado === "CANCELADO" && !motivoCancelacion)
      return { error: "Debe indicar el motivo de cancelación" }

    const pedido = await prisma.pedido.findUnique({
      where:  { id: pedidoId },
      select: { clienteId: true },
    })

    await prisma.pedido.update({
      where: { id: pedidoId },
      data:  {
        tipoPedidoId,
        empleadoReceptorId,
        estado,
        motivoCancelacion: estado === "CANCELADO" ? (motivoCancelacion || null) : null,
        fechaSolicitud:    fechaSolicitud ? new Date(fechaSolicitud) : undefined,
      },
    })

    REVALIDATE(pedido?.clienteId)
    revalidatePath(`/dashboard/pedidos/${pedidoId}`)
    return { success: true }
  } catch (error) {
    console.error("Error al actualizar pedido:", error)
    return { error: "Error al actualizar el pedido" }
  }
}

export async function cambiarEstadoPedido(pedidoId: string, nuevoEstado: EstadoPedido, motivo?: string) {
  try {
    if (nuevoEstado === "CANCELADO" && !motivo)
      return { error: "Debe indicar el motivo de cancelación" }

    const pedido = await prisma.pedido.findUnique({
      where:  { id: pedidoId },
      select: { clienteId: true, estado: true },
    })
    if (!pedido) return { error: "Pedido no encontrado" }

    await prisma.pedido.update({
      where: { id: pedidoId },
      data:  {
        estado:           nuevoEstado,
        motivoCancelacion: nuevoEstado === "CANCELADO" ? (motivo || null) : null,
      },
    })

    REVALIDATE(pedido.clienteId)
    revalidatePath(`/dashboard/pedidos/${pedidoId}`)
    return { success: true }
  } catch (error) {
    console.error("Error al cambiar estado:", error)
    return { error: "Error al cambiar el estado del pedido" }
  }
}

export async function eliminarPedido(pedidoId: string) {
  try {
    const pedido = await prisma.pedido.findUnique({
      where:  { id: pedidoId },
      select: { clienteId: true, estado: true },
    })
    if (!pedido) return { error: "Pedido no encontrado" }

    if (pedido.estado === "EN_PROCESO")
      return { error: "No se puede eliminar un pedido en proceso. Cancélalo primero." }

    await prisma.pedido.delete({ where: { id: pedidoId } })
    REVALIDATE(pedido.clienteId)
    return { success: true }
  } catch (error) {
    console.error("Error al eliminar pedido:", error)
    return { error: "Error al eliminar el pedido" }
  }
}
