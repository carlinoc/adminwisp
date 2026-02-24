"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

const REVALIDATE = () => {
  revalidatePath("/dashboard/contratos/planes")
  revalidatePath("/dashboard/contratos")
}

export async function crearTarifaPlan(formData: FormData) {
  try {
    const nombrePlan       = (formData.get("nombrePlan")       as string)?.trim()
    const velocidadDescarga = (formData.get("velocidadDescarga") as string)?.trim()
    const velocidadSubida   = (formData.get("velocidadSubida")   as string)?.trim()
    const tarifaMensual     = parseFloat(formData.get("tarifaMensual") as string)
    const comisionVenta     = parseFloat(formData.get("comisionVenta") as string || "0")
    const incluyeTv         = formData.get("incluyeTv") === "true"
    const nroTvsBase        = parseInt(formData.get("nroTvsBase") as string || "0", 10)

    if (!nombrePlan)        return { error: "El nombre del plan es obligatorio" }
    if (!velocidadDescarga) return { error: "La velocidad de descarga es obligatoria" }
    if (!velocidadSubida)   return { error: "La velocidad de subida es obligatoria" }
    if (isNaN(tarifaMensual) || tarifaMensual <= 0)
      return { error: "La tarifa mensual debe ser un número positivo" }

    const existe = await prisma.tarifaPlan.findFirst({ where: { nombrePlan } })
    if (existe) return { error: "Ya existe un plan con ese nombre" }

    const plan = await prisma.tarifaPlan.create({
      data: {
        nombrePlan,
        velocidadDescarga,
        velocidadSubida,
        tarifaMensual,
        comisionVenta: isNaN(comisionVenta) ? 0 : comisionVenta,
        incluyeTv,
        nroTvsBase: incluyeTv ? (isNaN(nroTvsBase) ? 0 : nroTvsBase) : 0,
      },
    })

    REVALIDATE()
    return { success: true, data: { id: plan.id } }
  } catch (error) {
    console.error("Error al crear plan:", error)
    return { error: "Error interno al crear el plan" }
  }
}

export async function actualizarTarifaPlan(planId: string, formData: FormData) {
  try {
    const nombrePlan        = (formData.get("nombrePlan")       as string)?.trim()
    const velocidadDescarga = (formData.get("velocidadDescarga") as string)?.trim()
    const velocidadSubida   = (formData.get("velocidadSubida")   as string)?.trim()
    const tarifaMensual     = parseFloat(formData.get("tarifaMensual") as string)
    const comisionVenta     = parseFloat(formData.get("comisionVenta") as string || "0")
    const incluyeTv         = formData.get("incluyeTv") === "true"
    const nroTvsBase        = parseInt(formData.get("nroTvsBase") as string || "0", 10)

    if (!nombrePlan)        return { error: "El nombre del plan es obligatorio" }
    if (!velocidadDescarga) return { error: "La velocidad de descarga es obligatoria" }
    if (!velocidadSubida)   return { error: "La velocidad de subida es obligatoria" }
    if (isNaN(tarifaMensual) || tarifaMensual <= 0)
      return { error: "La tarifa mensual debe ser un número positivo" }

    // Unicidad excluyendo el actual
    const existe = await prisma.tarifaPlan.findFirst({
      where: { nombrePlan, NOT: { id: planId } },
    })
    if (existe) return { error: "Ya existe otro plan con ese nombre" }

    await prisma.tarifaPlan.update({
      where: { id: planId },
      data: {
        nombrePlan,
        velocidadDescarga,
        velocidadSubida,
        tarifaMensual,
        comisionVenta: isNaN(comisionVenta) ? 0 : comisionVenta,
        incluyeTv,
        nroTvsBase: incluyeTv ? (isNaN(nroTvsBase) ? 0 : nroTvsBase) : 0,
      },
    })

    REVALIDATE()
    revalidatePath(`/dashboard/contratos/planes/${planId}`)
    return { success: true }
  } catch (error) {
    console.error("Error al actualizar plan:", error)
    return { error: "Error interno al actualizar el plan" }
  }
}

export async function eliminarTarifaPlan(planId: string) {
  try {
    const contratos = await prisma.contrato.count({ where: { tarifaPlanId: planId } })
    if (contratos > 0)
      return { error: `No se puede eliminar: tiene ${contratos} contrato(s) asociado(s)` }

    await prisma.tarifaPlan.delete({ where: { id: planId } })
    REVALIDATE()
    return { success: true }
  } catch (error) {
    console.error("Error al eliminar plan:", error)
    return { error: "Error al eliminar el plan" }
  }
}
