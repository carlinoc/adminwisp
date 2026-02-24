"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

const REVALIDATE = () => revalidatePath("/dashboard/infraestructura/cajas")

// ═══════════════════════════════════════════════════════════════
//  CAJA NAP
// ═══════════════════════════════════════════════════════════════

export async function crearCajaNap(formData: FormData) {
  try {
    const zonaId               = formData.get("zonaId")            as string
    const splitterInstalado    = (formData.get("splitterInstalado") as string)?.trim()
    const capacidadStr         = formData.get("capacidadPuertosTotal") as string
    const direccion            = (formData.get("direccion") as string)?.trim()
    const latitudStr           = (formData.get("latitud")  as string)?.trim()
    const longitudStr          = (formData.get("longitud") as string)?.trim()
    const puertoAlimentadorId  = formData.get("puertoAlimentadorId") as string

    if (!zonaId || zonaId === "none") return { error: "La zona es obligatoria" }
    const capacidad = parseInt(capacidadStr, 10)
    if (isNaN(capacidad) || capacidad < 1 || capacidad > 64)
      return { error: "La capacidad debe ser entre 1 y 64 puertos" }

    // Verificar que la zona existe
    const zona = await prisma.zona.findUnique({ where: { id: zonaId } })
    if (!zona) return { error: "La zona seleccionada no existe" }

    // Verificar puerto alimentador si se especificó
    if (puertoAlimentadorId && puertoAlimentadorId !== "none") {
      const puerto = await prisma.puerto.findUnique({ where: { id: puertoAlimentadorId } })
      if (!puerto) return { error: "El puerto alimentador no existe" }
      if (puerto.estado !== "DISPONIBLE")
        return { error: "El puerto alimentador seleccionado no está disponible" }
    }

    const cajaNap = await prisma.$transaction(async (tx) => {
      // Crear la caja NAP
      const caja = await tx.cajaNap.create({
        data: {
          zonaId,
          splitterInstalado:   splitterInstalado || null,
          capacidadPuertosTotal: capacidad,
          puertosUtilizados:   0,
          direccion:           direccion  || null,
          latitud:             latitudStr  ? parseFloat(latitudStr)  : null,
          longitud:            longitudStr ? parseFloat(longitudStr) : null,
          puertoAlimentadorId: puertoAlimentadorId && puertoAlimentadorId !== "none"
            ? puertoAlimentadorId : null,
        },
      })

      // Crear todos los puertos automáticamente
      const puertos = Array.from({ length: capacidad }, (_, i) => ({
        cajaNapId:    caja.id,
        numeroPuerto: i + 1,
        estado:       "DISPONIBLE",
      }))
      await tx.puerto.createMany({ data: puertos })

      // Si tiene puerto alimentador, marcarlo como usado
      if (puertoAlimentadorId && puertoAlimentadorId !== "none") {
        await tx.puerto.update({
          where: { id: puertoAlimentadorId },
          data:  { estado: "USADO_ALIMENTADOR" },
        })
        // Incrementar puertosUtilizados de la caja padre
        const puertoPadre = await tx.puerto.findUnique({
          where:   { id: puertoAlimentadorId },
          include: { cajaNap: true },
        })
        if (puertoPadre) {
          await tx.cajaNap.update({
            where: { id: puertoPadre.cajaNapId },
            data:  { puertosUtilizados: { increment: 1 } },
          })
        }
      }

      return caja
    })

    REVALIDATE()
    return { success: true, data: { id: cajaNap.id } }
  } catch (error) {
    console.error("Error al crear caja NAP:", error)
    return { error: "Error interno al crear la caja NAP" }
  }
}

export async function actualizarCajaNap(cajaId: string, formData: FormData) {
  try {
    const zonaId            = formData.get("zonaId")            as string
    const splitterInstalado = (formData.get("splitterInstalado") as string)?.trim()
    const direccion         = (formData.get("direccion")         as string)?.trim()
    const latitudStr        = (formData.get("latitud")           as string)?.trim()
    const longitudStr       = (formData.get("longitud")          as string)?.trim()

    if (!zonaId || zonaId === "none") return { error: "La zona es obligatoria" }

    // No permitir cambiar capacidad (afectaría puertos existentes)
    await prisma.cajaNap.update({
      where: { id: cajaId },
      data: {
        zonaId,
        splitterInstalado: splitterInstalado || null,
        direccion:         direccion         || null,
        latitud:           latitudStr        ? parseFloat(latitudStr)  : null,
        longitud:          longitudStr       ? parseFloat(longitudStr) : null,
      },
    })

    REVALIDATE()
    revalidatePath(`/dashboard/infraestructura/cajas/${cajaId}`)
    return { success: true }
  } catch (error) {
    console.error("Error al actualizar caja NAP:", error)
    return { error: "Error al actualizar la caja NAP" }
  }
}

export async function eliminarCajaNap(cajaId: string) {
  try {
    // Verificar que no tenga puertos asignados a clientes
    const puertosOcupados = await prisma.puerto.count({
      where: { cajaNapId: cajaId, clienteAsignadoId: { not: null } },
    })
    if (puertosOcupados > 0)
      return { error: `No se puede eliminar: ${puertosOcupados} puerto(s) tienen clientes asignados` }

    // Verificar que no sea puerto alimentador de otras cajas
    const cajasAlimentadas = await prisma.cajaNap.count({
      where: { puertoAlimentador: { cajaNapId: cajaId } },
    })
    if (cajasAlimentadas > 0)
      return { error: `No se puede eliminar: alimenta a ${cajasAlimentadas} caja(s) NAP hija(s)` }

    // Liberar el puerto alimentador si tenía uno
    const caja = await prisma.cajaNap.findUnique({
      where: { id: cajaId },
      include: { puertoAlimentador: true },
    })

    await prisma.$transaction(async (tx) => {
      // Liberar puerto alimentador padre
      if (caja?.puertoAlimentadorId) {
        await tx.puerto.update({
          where: { id: caja.puertoAlimentadorId },
          data:  { estado: "DISPONIBLE" },
        })
        await tx.cajaNap.update({
          where: { id: caja.puertoAlimentador!.cajaNapId },
          data:  { puertosUtilizados: { decrement: 1 } },
        })
      }
      // Eliminar puertos y caja
      await tx.puerto.deleteMany({ where: { cajaNapId: cajaId } })
      await tx.cajaNap.delete({ where: { id: cajaId } })
    })

    REVALIDATE()
    return { success: true }
  } catch (error) {
    console.error("Error al eliminar caja NAP:", error)
    return { error: "Error al eliminar la caja NAP" }
  }
}

// ═══════════════════════════════════════════════════════════════
//  PUERTOS
// ═══════════════════════════════════════════════════════════════

export async function cambiarEstadoPuerto(
  puertoId: string,
  nuevoEstado: string,
) {
  try {
    const puerto = await prisma.puerto.findUnique({
      where: { id: puertoId },
      include: { clienteAsignado: true },
    })
    if (!puerto) return { error: "Puerto no encontrado" }

    // No permitir cambiar estado si tiene cliente asignado
    if (puerto.clienteAsignadoId && nuevoEstado !== "OCUPADO")
      return { error: "El puerto tiene un cliente asignado. Desasígnalo primero." }

    const updateData: { estado: string; clienteAsignadoId?: null } = { estado: nuevoEstado }

    // Si pasa a DAÑADO/RESERVADO y estaba ocupado, limpiar cliente
    if (["DAÑADO", "RESERVADO", "DISPONIBLE"].includes(nuevoEstado)) {
      updateData.clienteAsignadoId = null
    }

    await prisma.$transaction(async (tx) => {
      const anteriorEstado = puerto.estado
      await tx.puerto.update({ where: { id: puertoId }, data: updateData })

      // Actualizar contador de puertosUtilizados en la caja
      const eraOcupado  = ["OCUPADO", "USADO_ALIMENTADOR"].includes(anteriorEstado)
      const seraOcupado = ["OCUPADO", "USADO_ALIMENTADOR"].includes(nuevoEstado)

      if (eraOcupado && !seraOcupado) {
        await tx.cajaNap.update({
          where: { id: puerto.cajaNapId },
          data:  { puertosUtilizados: { decrement: 1 } },
        })
      } else if (!eraOcupado && seraOcupado) {
        await tx.cajaNap.update({
          where: { id: puerto.cajaNapId },
          data:  { puertosUtilizados: { increment: 1 } },
        })
      }
    })

    revalidatePath(`/dashboard/infraestructura/cajas/${puerto.cajaNapId}`)
    REVALIDATE()
    return { success: true }
  } catch (error) {
    console.error("Error al cambiar estado puerto:", error)
    return { error: "Error al cambiar el estado del puerto" }
  }
}

export async function quitarPuerto(puertoId: string) {
  try {
    const puerto = await prisma.puerto.findUnique({
      where:   { id: puertoId },
      include: { cajaNap: true, cajasNapAlimentadas: { take: 1 } },
    })
    if (!puerto) return { error: "Puerto no encontrado" }
    if (puerto.clienteAsignadoId)
      return { error: "El puerto tiene un cliente asignado. Desasígnalo primero." }
    if (puerto.cajasNapAlimentadas.length > 0)
      return { error: "Este puerto alimenta una caja NAP hija. Elimina la caja hija primero." }

    const eraOcupado = ["OCUPADO", "USADO_ALIMENTADOR"].includes(puerto.estado)

    await prisma.$transaction(async (tx) => {
      await tx.puerto.delete({ where: { id: puertoId } })
      await tx.cajaNap.update({
        where: { id: puerto.cajaNapId },
        data: {
          capacidadPuertosTotal: { decrement: 1 },
          puertosUtilizados:     eraOcupado ? { decrement: 1 } : undefined,
        },
      })
    })

    revalidatePath(`/dashboard/infraestructura/cajas/${puerto.cajaNapId}`)
    REVALIDATE()
    return { success: true }
  } catch (error) {
    console.error("Error al quitar puerto:", error)
    return { error: "Error al quitar el puerto" }
  }
}

export async function agregarPuertos(cajaId: string, cantidad: number) {
  try {
    if (cantidad < 1 || cantidad > 32)
      return { error: "La cantidad debe estar entre 1 y 32" }

    const caja = await prisma.cajaNap.findUnique({
      where:   { id: cajaId },
      include: { puertos: { orderBy: { numeroPuerto: "desc" }, take: 1 } },
    })
    if (!caja) return { error: "Caja NAP no encontrada" }

    const ultimoNumero = caja.puertos[0]?.numeroPuerto ?? 0
    const nuevaCapacidad = caja.capacidadPuertosTotal + cantidad

    await prisma.$transaction(async (tx) => {
      const puertos = Array.from({ length: cantidad }, (_, i) => ({
        cajaNapId:    cajaId,
        numeroPuerto: ultimoNumero + i + 1,
        estado:       "DISPONIBLE",
      }))
      await tx.puerto.createMany({ data: puertos })
      await tx.cajaNap.update({
        where: { id: cajaId },
        data:  { capacidadPuertosTotal: nuevaCapacidad },
      })
    })

    revalidatePath(`/dashboard/infraestructura/cajas/${cajaId}`)
    REVALIDATE()
    return { success: true }
  } catch (error) {
    console.error("Error al agregar puertos:", error)
    return { error: "Error al agregar puertos" }
  }
}
