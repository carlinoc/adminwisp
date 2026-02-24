"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { EstadoContrato } from "@prisma/client"

const REVALIDATE = (clienteId?: string) => {
  revalidatePath("/dashboard/contratos")
  if (clienteId) revalidatePath(`/dashboard/clientes/${clienteId}`)
}

export async function crearContrato(formData: FormData) {
  try {
    const clienteId              = formData.get("clienteId")              as string
    const tarifaPlanId           = formData.get("tarifaPlanId")           as string
    const ubicacionInstalacionId = formData.get("ubicacionInstalacionId") as string
    const fechaContrato          = formData.get("fechaContrato")          as string
    const fechaInicioServicio    = formData.get("fechaInicioServicio")    as string
    const cicloFacturacion       = parseInt(formData.get("cicloFacturacion") as string || "1", 10)
    const montoActual            = parseFloat(formData.get("montoActual") as string)
    const estado                 = (formData.get("estado") as EstadoContrato) || "PENDIENTE"

    if (!clienteId || clienteId === "none")
      return { error: "El cliente es obligatorio" }
    if (!tarifaPlanId || tarifaPlanId === "none")
      return { error: "El plan de tarifa es obligatorio" }
    if (!ubicacionInstalacionId || ubicacionInstalacionId === "none")
      return { error: "La ubicación de instalación es obligatoria" }
    if (isNaN(montoActual) || montoActual <= 0)
      return { error: "El monto debe ser un número positivo" }
    if (isNaN(cicloFacturacion) || cicloFacturacion < 1 || cicloFacturacion > 28)
      return { error: "El día de ciclo de facturación debe estar entre 1 y 28" }

    // Verificar que la ubicación pertenece al cliente
    const ubicacion = await prisma.ubicacionInstalacion.findFirst({
      where: { id: ubicacionInstalacionId, clienteId },
    })
    if (!ubicacion)
      return { error: "La ubicación seleccionada no pertenece a este cliente" }

    // Obtener comisión del plan
    const plan = await prisma.tarifaPlan.findUnique({ where: { id: tarifaPlanId } })
    if (!plan) return { error: "Plan de tarifa no encontrado" }

    const comisionGenerada = Number(plan.comisionVenta)

    const contrato = await prisma.contrato.create({
      data: {
        clienteId,
        tarifaPlanId,
        ubicacionInstalacionId,
        fechaContrato:       fechaContrato       ? new Date(fechaContrato)       : new Date(),
        fechaInicioServicio: fechaInicioServicio ? new Date(fechaInicioServicio) : null,
        cicloFacturacion,
        montoActual,
        comisionGenerada,
        estado,
      },
    })

    REVALIDATE(clienteId)
    return { success: true, data: { id: contrato.id } }
  } catch (error) {
    console.error("Error al crear contrato:", error)
    return { error: "Error interno al crear el contrato" }
  }
}

export async function actualizarContrato(contratoId: string, formData: FormData) {
  try {
    const tarifaPlanId        = formData.get("tarifaPlanId")        as string
    const fechaInicioServicio = formData.get("fechaInicioServicio") as string
    const cicloFacturacion    = parseInt(formData.get("cicloFacturacion") as string || "1", 10)
    const montoActual         = parseFloat(formData.get("montoActual") as string)
    const estado              = formData.get("estado") as EstadoContrato

    if (!tarifaPlanId || tarifaPlanId === "none")
      return { error: "El plan de tarifa es obligatorio" }
    if (isNaN(montoActual) || montoActual <= 0)
      return { error: "El monto debe ser un número positivo" }
    if (isNaN(cicloFacturacion) || cicloFacturacion < 1 || cicloFacturacion > 28)
      return { error: "El ciclo debe estar entre 1 y 28" }

    const contrato = await prisma.contrato.findUnique({
      where: { id: contratoId },
      select: { clienteId: true },
    })

    await prisma.contrato.update({
      where: { id: contratoId },
      data: {
        tarifaPlanId,
        fechaInicioServicio: fechaInicioServicio ? new Date(fechaInicioServicio) : null,
        cicloFacturacion,
        montoActual,
        estado,
      },
    })

    REVALIDATE(contrato?.clienteId)
    revalidatePath(`/dashboard/contratos/${contratoId}`)
    return { success: true }
  } catch (error) {
    console.error("Error al actualizar contrato:", error)
    return { error: "Error al actualizar el contrato" }
  }
}

export async function cambiarEstadoContrato(
  contratoId: string,
  nuevoEstado: EstadoContrato
) {
  try {
    const contrato = await prisma.contrato.findUnique({
      where:  { id: contratoId },
      select: { clienteId: true, estado: true },
    })
    if (!contrato) return { error: "Contrato no encontrado" }

    await prisma.contrato.update({
      where: { id: contratoId },
      data:  { estado: nuevoEstado },
    })

    REVALIDATE(contrato.clienteId)
    revalidatePath(`/dashboard/contratos/${contratoId}`)
    return { success: true }
  } catch (error) {
    console.error("Error al cambiar estado:", error)
    return { error: "Error al cambiar el estado del contrato" }
  }
}

export async function eliminarContrato(contratoId: string) {
  try {
    const pagos = await prisma.pago.count({ where: { contratoId } })
    if (pagos > 0)
      return { error: `No se puede eliminar: tiene ${pagos} pago(s) registrado(s)` }

    const facturas = await prisma.facturaRecibo.count({ where: { contratoId } })
    if (facturas > 0)
      return { error: `No se puede eliminar: tiene ${facturas} factura(s) emitida(s)` }

    const contrato = await prisma.contrato.findUnique({
      where:  { id: contratoId },
      select: { clienteId: true },
    })

    await prisma.contrato.delete({ where: { id: contratoId } })

    REVALIDATE(contrato?.clienteId)
    return { success: true }
  } catch (error) {
    console.error("Error al eliminar contrato:", error)
    return { error: "Error al eliminar el contrato" }
  }
}
