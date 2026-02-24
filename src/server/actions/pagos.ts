"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { TipoPago } from "@prisma/client"

const REVALIDATE = (clienteId?: string, contratoId?: string) => {
  revalidatePath("/dashboard/facturacion")
  revalidatePath("/dashboard/facturacion/pagos")
  revalidatePath("/dashboard/facturacion/facturas")
  if (clienteId)  revalidatePath(`/dashboard/clientes/${clienteId}`)
  if (contratoId) revalidatePath(`/dashboard/contratos/${contratoId}`)
}

export async function registrarPago(formData: FormData) {
  try {
    const clienteId   = (formData.get("clienteId")   as string)?.trim()
    const contratoId  = (formData.get("contratoId")  as string)?.trim()
    const fechaPago   = (formData.get("fechaPago")   as string)?.trim()
    const montoPagado = parseFloat(formData.get("montoPagado") as string)
    const tipoPago    = (formData.get("tipoPago")    as TipoPago)
    const masDetalles = (formData.get("masDetalles") as string)?.trim()

    // IDs de facturas a las que se aplica este pago
    const facturasAplicar = JSON.parse(formData.get("facturasAplicar") as string || "[]") as
      Array<{ facturaId: string; monto: number }>

    if (!clienteId  || clienteId  === "none") return { error: "El cliente es obligatorio" }
    if (!contratoId || contratoId === "none") return { error: "El contrato es obligatorio" }
    if (!tipoPago)                            return { error: "El tipo de pago es obligatorio" }
    if (isNaN(montoPagado) || montoPagado <= 0) return { error: "El monto debe ser mayor a 0" }

    // Validar que el contrato pertenece al cliente
    const contrato = await prisma.contrato.findFirst({
      where: { id: contratoId, clienteId },
      select: { id: true, clienteId: true },
    })
    if (!contrato) return { error: "El contrato no pertenece a este cliente" }

    // Validar que la suma de montos aplicados no supera el pago
    if (facturasAplicar.length > 0) {
      const totalAplicado = facturasAplicar.reduce((s, f) => s + f.monto, 0)
      if (totalAplicado > montoPagado + 0.01)
        return { error: `El total aplicado (${totalAplicado.toFixed(2)}) no puede superar el monto pagado` }
    }

    // Todo en una transacción atómica
    const pago = await prisma.$transaction(async (tx) => {
      const nuevoPago = await tx.pago.create({
        data: {
          clienteId,
          contratoId,
          fechaPago:   fechaPago ? new Date(fechaPago) : new Date(),
          montoPagado,
          tipoPago,
          masDetalles: masDetalles || null,
        },
      })

      // Aplicar el pago a las facturas seleccionadas y actualizar saldos
      for (const { facturaId, monto } of facturasAplicar) {
        if (monto <= 0) continue

        const factura = await tx.facturaRecibo.findUnique({
          where:  { id: facturaId },
          select: { saldoPendiente: true },
        })
        if (!factura) continue

        const saldoActual = Number(factura.saldoPendiente)
        const montoReal   = Math.min(monto, saldoActual)
        if (montoReal <= 0) continue

        await tx.detallePagoFactura.create({
          data: {
            pagoId:         nuevoPago.id,
            facturaReciboId: facturaId,
            montoAplicado:  montoReal,
          },
        })

        await tx.facturaRecibo.update({
          where: { id: facturaId },
          data:  { saldoPendiente: Math.max(0, saldoActual - montoReal) },
        })
      }

      // Si hay saldo sobrante, abonarlo al saldo a favor del cliente
      const totalAplicado = facturasAplicar.reduce((s, f) => s + f.monto, 0)
      const sobrante = montoPagado - totalAplicado
      if (sobrante > 0.01) {
        await tx.cliente.update({
          where: { id: clienteId },
          data:  { saldoFavor: { increment: sobrante } },
        })
      }

      return nuevoPago
    })

    REVALIDATE(clienteId, contratoId)
    revalidatePath(`/dashboard/facturacion/pagos/${pago.id}`)
    return { success: true, data: { id: pago.id } }
  } catch (error) {
    console.error("Error al registrar pago:", error)
    return { error: "Error interno al registrar el pago" }
  }
}

export async function eliminarPago(pagoId: string) {
  try {
    const pago = await prisma.pago.findUnique({
      where:   { id: pagoId },
      include: { detallesPagoFactura: true },
    })
    if (!pago) return { error: "Pago no encontrado" }

    await prisma.$transaction(async (tx) => {
      // Revertir saldos de facturas afectadas
      for (const detalle of pago.detallesPagoFactura) {
        await tx.facturaRecibo.update({
          where: { id: detalle.facturaReciboId },
          data:  { saldoPendiente: { increment: Number(detalle.montoAplicado) } },
        })
      }

      // Eliminar detalles y luego el pago
      await tx.detallePagoFactura.deleteMany({ where: { pagoId } })
      await tx.pago.delete({ where: { id: pagoId } })
    })

    REVALIDATE(pago.clienteId, pago.contratoId)
    return { success: true }
  } catch (error) {
    console.error("Error al eliminar pago:", error)
    return { error: "Error al eliminar el pago" }
  }
}

// Aplicar saldo a favor del cliente a facturas pendientes
export async function aplicarSaldoFavor(clienteId: string, facturaId: string, monto: number) {
  try {
    if (monto <= 0) return { error: "El monto debe ser mayor a 0" }

    const [cliente, factura] = await Promise.all([
      prisma.cliente.findUnique({ where: { id: clienteId }, select: { saldoFavor: true } }),
      prisma.facturaRecibo.findUnique({ where: { id: facturaId }, select: { saldoPendiente: true, contratoId: true } }),
    ])
    if (!cliente) return { error: "Cliente no encontrado" }
    if (!factura) return { error: "Factura no encontrada" }

    const saldoDisponible = Number(cliente.saldoFavor)
    const saldoFactura    = Number(factura.saldoPendiente)
    if (saldoDisponible < monto) return { error: "Saldo a favor insuficiente" }
    if (saldoFactura    < monto) return { error: "El monto supera el saldo pendiente de la factura" }

    await prisma.$transaction([
      prisma.cliente.update({
        where: { id: clienteId },
        data:  { saldoFavor: { decrement: monto } },
      }),
      prisma.facturaRecibo.update({
        where: { id: facturaId },
        data:  { saldoPendiente: { decrement: monto } },
      }),
    ])

    REVALIDATE(clienteId, factura.contratoId)
    return { success: true }
  } catch (error) {
    console.error("Error al aplicar saldo:", error)
    return { error: "Error al aplicar el saldo a favor" }
  }
}
