"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

const REVALIDATE = (contratoId?: string, clienteId?: string) => {
  revalidatePath("/dashboard/facturacion")
  revalidatePath("/dashboard/facturacion/facturas")
  if (contratoId) revalidatePath(`/dashboard/contratos/${contratoId}`)
  if (clienteId)  revalidatePath(`/dashboard/clientes/${clienteId}`)
}

export async function crearFactura(formData: FormData) {
  try {
    const contratoId       = (formData.get("contratoId")       as string)?.trim()
    const periodoFacturado = (formData.get("periodoFacturado") as string)?.trim()
    const fechaVencimiento = (formData.get("fechaVencimiento") as string)?.trim()
    const montoTotal       = parseFloat(formData.get("montoTotal") as string)

    if (!contratoId || contratoId === "none") return { error: "El contrato es obligatorio" }
    if (!periodoFacturado) return { error: "El período facturado es obligatorio" }
    if (!fechaVencimiento) return { error: "La fecha de vencimiento es obligatoria" }
    if (isNaN(montoTotal) || montoTotal <= 0) return { error: "El monto debe ser mayor a 0" }

    const contrato = await prisma.contrato.findUnique({
      where:  { id: contratoId },
      select: { id: true, clienteId: true, estado: true },
    })
    if (!contrato) return { error: "Contrato no encontrado" }

    // Verificar que no exista ya una factura para ese período y contrato
    const periodoDate = new Date(periodoFacturado + "-01") // primer día del mes
    const existe = await prisma.facturaRecibo.findFirst({
      where: {
        contratoId,
        periodoFacturado: {
          gte: new Date(periodoDate.getFullYear(), periodoDate.getMonth(), 1),
          lt:  new Date(periodoDate.getFullYear(), periodoDate.getMonth() + 1, 1),
        },
      },
    })
    if (existe) return { error: "Ya existe una factura para ese contrato y período" }

    const factura = await prisma.facturaRecibo.create({
      data: {
        contratoId,
        periodoFacturado: new Date(periodoFacturado + "-01"),
        fechaVencimiento: new Date(fechaVencimiento),
        montoTotal,
        saldoPendiente:   montoTotal, // al crear, saldo = monto total
      },
    })

    REVALIDATE(contratoId, contrato.clienteId)
    return { success: true, data: { id: factura.id } }
  } catch (error) {
    console.error("Error al crear factura:", error)
    return { error: "Error interno al crear la factura" }
  }
}

export async function actualizarFactura(facturaId: string, formData: FormData) {
  try {
    const fechaVencimiento = (formData.get("fechaVencimiento") as string)?.trim()
    const montoTotal       = parseFloat(formData.get("montoTotal") as string)

    if (!fechaVencimiento) return { error: "La fecha de vencimiento es obligatoria" }
    if (isNaN(montoTotal) || montoTotal <= 0) return { error: "El monto debe ser mayor a 0" }

    const factura = await prisma.facturaRecibo.findUnique({
      where:   { id: facturaId },
      include: { detallesPagoFactura: { select: { montoAplicado: true } } },
    })
    if (!factura) return { error: "Factura no encontrada" }

    const totalPagado = factura.detallesPagoFactura.reduce(
      (s, d) => s + Number(d.montoAplicado), 0
    )
    if (montoTotal < totalPagado)
      return { error: `El monto no puede ser menor al total ya pagado (${totalPagado.toFixed(2)})` }

    const saldoPendiente = Math.max(0, montoTotal - totalPagado)

    const contrato = await prisma.contrato.findUnique({
      where:  { id: factura.contratoId },
      select: { clienteId: true },
    })

    await prisma.facturaRecibo.update({
      where: { id: facturaId },
      data:  { fechaVencimiento: new Date(fechaVencimiento), montoTotal, saldoPendiente },
    })

    REVALIDATE(factura.contratoId, contrato?.clienteId)
    revalidatePath(`/dashboard/facturacion/facturas/${facturaId}`)
    return { success: true }
  } catch (error) {
    console.error("Error al actualizar factura:", error)
    return { error: "Error al actualizar la factura" }
  }
}

export async function eliminarFactura(facturaId: string) {
  try {
    const detalles = await prisma.detallePagoFactura.count({ where: { facturaReciboId: facturaId } })
    if (detalles > 0)
      return { error: `No se puede eliminar: tiene ${detalles} pago(s) aplicado(s)` }

    const factura = await prisma.facturaRecibo.findUnique({
      where:   { id: facturaId },
      include: { contrato: { select: { clienteId: true } } },
    })

    await prisma.facturaRecibo.delete({ where: { id: facturaId } })
    REVALIDATE(factura?.contratoId, factura?.contrato.clienteId)
    return { success: true }
  } catch (error) {
    console.error("Error al eliminar factura:", error)
    return { error: "Error al eliminar la factura" }
  }
}
