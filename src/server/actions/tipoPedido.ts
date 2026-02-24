"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

const PRIORIDADES = ["BAJA", "NORMAL", "MEDIA", "ALTA", "URGENTE"] as const

const REVALIDATE = () => {
  revalidatePath("/dashboard/pedidos/tipos")
  revalidatePath("/dashboard/pedidos")
}

export async function crearTipoPedido(formData: FormData) {
  try {
    const nombre             = (formData.get("nombre")      as string)?.trim()
    const descripcion        = (formData.get("descripcion") as string)?.trim()
    const prioridadDefault   = (formData.get("prioridadDefault") as string) || "NORMAL"
    const requiereAprobacion = formData.get("requiereAprobacion") === "true"

    if (!nombre) return { error: "El nombre es obligatorio" }
    if (!PRIORIDADES.includes(prioridadDefault as typeof PRIORIDADES[number]))
      return { error: "Prioridad inválida" }

    const existe = await prisma.tipoPedido.findFirst({
      where: { nombre: { equals: nombre, mode: "insensitive" } },
    })
    if (existe) return { error: "Ya existe un tipo de pedido con ese nombre" }

    const tipo = await prisma.tipoPedido.create({
      data: {
        nombre,
        descripcion: descripcion || null,
        prioridadDefault,
        requiereAprobacion,
      },
    })

    REVALIDATE()
    return { success: true, data: { id: tipo.id } }
  } catch (error) {
    console.error("Error al crear tipo de pedido:", error)
    return { error: "Error interno al crear el tipo de pedido" }
  }
}

export async function actualizarTipoPedido(tipoId: string, formData: FormData) {
  try {
    const nombre             = (formData.get("nombre")      as string)?.trim()
    const descripcion        = (formData.get("descripcion") as string)?.trim()
    const prioridadDefault   = (formData.get("prioridadDefault") as string) || "NORMAL"
    const requiereAprobacion = formData.get("requiereAprobacion") === "true"

    if (!nombre) return { error: "El nombre es obligatorio" }
    if (!PRIORIDADES.includes(prioridadDefault as typeof PRIORIDADES[number]))
      return { error: "Prioridad inválida" }

    const existe = await prisma.tipoPedido.findFirst({
      where: { nombre: { equals: nombre, mode: "insensitive" }, NOT: { id: tipoId } },
    })
    if (existe) return { error: "Ya existe otro tipo con ese nombre" }

    await prisma.tipoPedido.update({
      where: { id: tipoId },
      data: { nombre, descripcion: descripcion || null, prioridadDefault, requiereAprobacion },
    })

    REVALIDATE()
    return { success: true }
  } catch (error) {
    console.error("Error al actualizar tipo de pedido:", error)
    return { error: "Error al actualizar el tipo de pedido" }
  }
}

export async function eliminarTipoPedido(tipoId: string) {
  try {
    const count = await prisma.pedido.count({ where: { tipoPedidoId: tipoId } })
    if (count > 0)
      return { error: `No se puede eliminar: tiene ${count} pedido(s) asociado(s)` }

    await prisma.tipoPedido.delete({ where: { id: tipoId } })
    REVALIDATE()
    return { success: true }
  } catch (error) {
    console.error("Error al eliminar tipo:", error)
    return { error: "Error al eliminar el tipo de pedido" }
  }
}
