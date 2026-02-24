"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

const REVALIDATE = () => {
  revalidatePath("/dashboard/materiales/inventario")
  revalidatePath("/dashboard/materiales/lista")
}

// Ajuste de stock: puede ser entrada (+) o salida (-)
export type TipoAjuste = "ENTRADA" | "SALIDA" | "AJUSTE_MANUAL"

export async function ajustarStock(
  inventarioId: string,
  materialId: string,
  formData: FormData
) {
  try {
    const tipo      = formData.get("tipo") as TipoAjuste
    const cantidad  = parseInt(formData.get("cantidad") as string, 10)
    const ubicacion = (formData.get("ubicacionAlmacen") as string)?.trim()
    const puntoReorden = parseInt(formData.get("puntoReorden") as string, 10)

    if (isNaN(cantidad) || cantidad <= 0)
      return { error: "La cantidad debe ser un número positivo" }

    const inventario = await prisma.inventario.findUnique({ where: { id: inventarioId } })
    if (!inventario) return { error: "Inventario no encontrado" }

    let nuevaCantidad: number
    if (tipo === "ENTRADA") {
      nuevaCantidad = inventario.cantidadDisponible + cantidad
    } else if (tipo === "SALIDA") {
      nuevaCantidad = inventario.cantidadDisponible - cantidad
      if (nuevaCantidad < 0)
        return { error: `Stock insuficiente. Disponible: ${inventario.cantidadDisponible}` }
    } else {
      // AJUSTE_MANUAL: sobrescribe directo
      nuevaCantidad = cantidad
    }

    await prisma.inventario.update({
      where: { id: inventarioId },
      data: {
        cantidadDisponible: nuevaCantidad,
        puntoReorden: isNaN(puntoReorden) ? inventario.puntoReorden : puntoReorden,
        ubicacionAlmacen: ubicacion || inventario.ubicacionAlmacen,
      },
    })

    REVALIDATE()
    revalidatePath(`/dashboard/materiales/inventario/${inventarioId}`)
    return { success: true, nuevaCantidad }
  } catch (error) {
    console.error("Error al ajustar stock:", error)
    return { error: "Error al ajustar el stock" }
  }
}

export async function actualizarInventario(inventarioId: string, formData: FormData) {
  try {
    const cantidadDisponible = parseInt(formData.get("cantidadDisponible") as string, 10)
    const puntoReorden       = parseInt(formData.get("puntoReorden")       as string, 10)
    const ubicacionAlmacen   = (formData.get("ubicacionAlmacen") as string)?.trim()

    if (isNaN(cantidadDisponible) || cantidadDisponible < 0)
      return { error: "La cantidad debe ser un número mayor o igual a 0" }

    await prisma.inventario.update({
      where: { id: inventarioId },
      data: {
        cantidadDisponible,
        puntoReorden: isNaN(puntoReorden) ? 0 : puntoReorden,
        ubicacionAlmacen: ubicacionAlmacen || null,
      },
    })

    REVALIDATE()
    revalidatePath(`/dashboard/materiales/inventario/${inventarioId}`)
    return { success: true }
  } catch (error) {
    console.error("Error al actualizar inventario:", error)
    return { error: "Error al actualizar el inventario" }
  }
}
