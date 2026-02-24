"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

const REVALIDATE = () => {
  revalidatePath("/dashboard/materiales/asignaciones")
  revalidatePath("/dashboard/materiales/inventario")
}

export async function crearAsignacion(formData: FormData) {
  try {
    const tecnicoId         = formData.get("tecnicoId")        as string
    const personalEntregaId = formData.get("personalEntregaId") as string
    const materialId        = formData.get("materialId")        as string
    const cantidad          = parseInt(formData.get("cantidad") as string, 10)
    const serial            = (formData.get("serial") as string)?.trim()
    const fechaAsignacion   = formData.get("fechaAsignacion")   as string

    if (!tecnicoId || tecnicoId === "none")
      return { error: "El técnico receptor es obligatorio" }
    if (!personalEntregaId || personalEntregaId === "none")
      return { error: "El personal que entrega es obligatorio" }
    if (!materialId || materialId === "none")
      return { error: "El material es obligatorio" }
    if (isNaN(cantidad) || cantidad <= 0)
      return { error: "La cantidad debe ser mayor a 0" }

    // Verificar stock disponible
    const inventario = await prisma.inventario.findFirst({ where: { materialId } })
    if (!inventario) return { error: "El material no tiene registro de inventario" }
    if (inventario.cantidadDisponible < cantidad)
      return { error: `Stock insuficiente. Disponible: ${inventario.cantidadDisponible}` }

    // Crear asignación y descontar del inventario
    const resultado = await prisma.$transaction(async (tx) => {
      const asignacion = await tx.materialAsignado.create({
        data: {
          tecnicoId,
          personalEntregaId,
          materialId,
          cantidad,
          serial: serial || null,
          fechaAsignacion: fechaAsignacion ? new Date(fechaAsignacion) : new Date(),
        },
      })

      // Descontar del inventario
      await tx.inventario.update({
        where: { id: inventario.id },
        data: { cantidadDisponible: { decrement: cantidad } },
      })

      return asignacion
    })

    REVALIDATE()
    return { success: true, data: { id: resultado.id } }
  } catch (error) {
    console.error("Error al crear asignación:", error)
    return { error: "Error interno al registrar la asignación" }
  }
}

export async function actualizarAsignacion(asignacionId: string, formData: FormData) {
  try {
    const serial          = (formData.get("serial") as string)?.trim()
    const fechaAsignacion = formData.get("fechaAsignacion") as string

    // Solo permite editar el serial y la fecha (no la cantidad ni material
    // porque ya se descontó del inventario)
    await prisma.materialAsignado.update({
      where: { id: asignacionId },
      data: {
        serial: serial || null,
        fechaAsignacion: fechaAsignacion ? new Date(fechaAsignacion) : undefined,
      },
    })

    REVALIDATE()
    revalidatePath(`/dashboard/materiales/asignaciones/${asignacionId}`)
    return { success: true }
  } catch (error) {
    console.error("Error al actualizar asignación:", error)
    return { error: "Error al actualizar la asignación" }
  }
}

export async function eliminarAsignacion(asignacionId: string) {
  try {
    const asignacion = await prisma.materialAsignado.findUnique({
      where: { id: asignacionId },
    })
    if (!asignacion) return { error: "Asignación no encontrada" }

    // Devolver stock al inventario al eliminar la asignación
    await prisma.$transaction(async (tx) => {
      await tx.materialAsignado.delete({ where: { id: asignacionId } })

      const inventario = await tx.inventario.findFirst({
        where: { materialId: asignacion.materialId },
      })
      if (inventario) {
        await tx.inventario.update({
          where: { id: inventario.id },
          data: { cantidadDisponible: { increment: asignacion.cantidad } },
        })
      }
    })

    REVALIDATE()
    return { success: true }
  } catch (error) {
    console.error("Error al eliminar asignación:", error)
    return { error: "Error al eliminar la asignación" }
  }
}
