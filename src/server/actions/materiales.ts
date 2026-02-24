"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

const REVALIDATE = () => {
  revalidatePath("/dashboard/materiales/lista")
  revalidatePath("/dashboard/materiales/inventario")
}

export async function crearMaterial(formData: FormData) {
  try {
    const nombre     = (formData.get("nombre") as string)?.trim()
    const descripcion = (formData.get("descripcion") as string)?.trim()
    const marca      = (formData.get("marca") as string)?.trim()
    const modelo     = (formData.get("modelo") as string)?.trim()
    const unidadMedida = (formData.get("unidadMedida") as string)?.trim()
    const categoria  = (formData.get("categoria") as string)?.trim()
    const requiereDevolucion = formData.get("requiereDevolucion") === "true"

    // Stock inicial
    const cantidadInicial = parseInt(formData.get("cantidadInicial") as string || "0", 10)
    const puntoReorden    = parseInt(formData.get("puntoReorden")    as string || "0", 10)
    const ubicacionAlmacen = (formData.get("ubicacionAlmacen") as string)?.trim()

    if (!nombre)       return { error: "El nombre es obligatorio" }
    if (!unidadMedida) return { error: "La unidad de medida es obligatoria" }
    if (!categoria)    return { error: "La categoría es obligatoria" }

    const resultado = await prisma.$transaction(async (tx) => {
      const material = await tx.material.create({
        data: {
          nombre,
          descripcion:       descripcion || null,
          marca:             marca       || null,
          modelo:            modelo      || null,
          unidadMedida,
          categoria,
          requiereDevolucion,
        },
      })

      // Crear registro de inventario automáticamente
      const inventario = await tx.inventario.create({
        data: {
          materialId:         material.id,
          cantidadDisponible: isNaN(cantidadInicial) ? 0 : cantidadInicial,
          puntoReorden:       isNaN(puntoReorden)    ? 0 : puntoReorden,
          ubicacionAlmacen:   ubicacionAlmacen       || null,
        },
      })

      return { material, inventario }
    })

    REVALIDATE()
    return { success: true, data: { id: resultado.material.id } }
  } catch (error) {
    console.error("Error al crear material:", error)
    return { error: "Error interno al crear el material" }
  }
}

export async function actualizarMaterial(materialId: string, formData: FormData) {
  try {
    const nombre      = (formData.get("nombre") as string)?.trim()
    const descripcion = (formData.get("descripcion") as string)?.trim()
    const marca       = (formData.get("marca") as string)?.trim()
    const modelo      = (formData.get("modelo") as string)?.trim()
    const unidadMedida = (formData.get("unidadMedida") as string)?.trim()
    const categoria   = (formData.get("categoria") as string)?.trim()
    const requiereDevolucion = formData.get("requiereDevolucion") === "true"

    if (!nombre)       return { error: "El nombre es obligatorio" }
    if (!unidadMedida) return { error: "La unidad de medida es obligatoria" }
    if (!categoria)    return { error: "La categoría es obligatoria" }

    await prisma.material.update({
      where: { id: materialId },
      data: {
        nombre,
        descripcion:       descripcion || null,
        marca:             marca       || null,
        modelo:            modelo      || null,
        unidadMedida,
        categoria,
        requiereDevolucion,
      },
    })

    REVALIDATE()
    revalidatePath(`/dashboard/materiales/lista/${materialId}`)
    return { success: true }
  } catch (error) {
    console.error("Error al actualizar material:", error)
    return { error: "Error interno al actualizar el material" }
  }
}

export async function eliminarMaterial(materialId: string) {
  try {
    const asignados = await prisma.materialAsignado.count({ where: { materialId } })
    if (asignados > 0)
      return { error: `No se puede eliminar: tiene ${asignados} asignación(es) registrada(s)` }

    // Inventario se elimina en cascada al borrar el material
    await prisma.inventario.deleteMany({ where: { materialId } })
    await prisma.material.delete({ where: { id: materialId } })

    REVALIDATE()
    return { success: true }
  } catch (error) {
    console.error("Error al eliminar material:", error)
    return { error: "Error al eliminar el material" }
  }
}
