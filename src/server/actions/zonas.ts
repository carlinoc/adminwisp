"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

const REVALIDATE_PATHS = () => {
  revalidatePath("/dashboard/zonas")
  revalidatePath("/dashboard/zonas/cabeceras")
}

// ═══════════════════════════════════════════════════════════════
//  CABECERAS
// ═══════════════════════════════════════════════════════════════

export async function crearCabecera(formData: FormData) {
  try {
    const codigo     = (formData.get("codigo") as string)?.trim().toUpperCase()
    const nombre     = (formData.get("nombre") as string)?.trim()
    const ubicacion  = (formData.get("ubicacion") as string)?.trim()
    const latitudStr = (formData.get("latitud") as string)?.trim()
    const longitudStr = (formData.get("longitud") as string)?.trim()
    const arrendadorId = formData.get("arrendadorId") as string

    if (!codigo)  return { error: "El código es obligatorio" }
    if (!nombre)  return { error: "El nombre es obligatorio" }
    if (!arrendadorId || arrendadorId === "none")
      return { error: "El arrendador es obligatorio" }

    // Verificar código único
    const codigoExiste = await prisma.cabecera.findUnique({ where: { codigo } })
    if (codigoExiste) return { error: `Ya existe una cabecera con el código ${codigo}` }

    // Verificar que la persona (arrendador) existe
    const arrendador = await prisma.persona.findUnique({ where: { id: arrendadorId } })
    if (!arrendador) return { error: "El arrendador seleccionado no existe" }

    const cabecera = await prisma.cabecera.create({
      data: {
        codigo,
        nombre,
        ubicacion:  ubicacion  || null,
        latitud:    latitudStr  ? parseFloat(latitudStr)  : null,
        longitud:   longitudStr ? parseFloat(longitudStr) : null,
        arrendadorId,
      },
    })

    REVALIDATE_PATHS()
    return { success: true, data: { id: cabecera.id, codigo: cabecera.codigo } }
  } catch (error) {
    console.error("Error al crear cabecera:", error)
    return { error: "Error interno al crear la cabecera" }
  }
}

export async function actualizarCabecera(cabeceraId: string, formData: FormData) {
  try {
    const codigo      = (formData.get("codigo") as string)?.trim().toUpperCase()
    const nombre      = (formData.get("nombre") as string)?.trim()
    const ubicacion   = (formData.get("ubicacion") as string)?.trim()
    const latitudStr  = (formData.get("latitud") as string)?.trim()
    const longitudStr = (formData.get("longitud") as string)?.trim()
    const arrendadorId = formData.get("arrendadorId") as string

    if (!codigo) return { error: "El código es obligatorio" }
    if (!nombre) return { error: "El nombre es obligatorio" }
    if (!arrendadorId || arrendadorId === "none")
      return { error: "El arrendador es obligatorio" }

    // Verificar código único (excluyendo el registro actual)
    const codigoExiste = await prisma.cabecera.findFirst({
      where: { codigo, NOT: { id: cabeceraId } },
    })
    if (codigoExiste) return { error: `El código ${codigo} ya está en uso por otra cabecera` }

    await prisma.cabecera.update({
      where: { id: cabeceraId },
      data: {
        codigo,
        nombre,
        ubicacion:  ubicacion  || null,
        latitud:    latitudStr  ? parseFloat(latitudStr)  : null,
        longitud:   longitudStr ? parseFloat(longitudStr) : null,
        arrendadorId,
      },
    })

    REVALIDATE_PATHS()
    revalidatePath(`/dashboard/zonas/cabeceras/${cabeceraId}`)
    return { success: true }
  } catch (error) {
    console.error("Error al actualizar cabecera:", error)
    return { error: "Error interno al actualizar la cabecera" }
  }
}

export async function eliminarCabecera(cabeceraId: string) {
  try {
    // Verificar que no tenga zonas asociadas
    const zonasCount = await prisma.zona.count({ where: { cabeceraId } })
    if (zonasCount > 0)
      return {
        error: `No se puede eliminar: esta cabecera tiene ${zonasCount} zona(s) asociada(s). Elimínalas primero.`,
      }

    await prisma.cabecera.delete({ where: { id: cabeceraId } })
    REVALIDATE_PATHS()
    return { success: true }
  } catch (error) {
    console.error("Error al eliminar cabecera:", error)
    return { error: "Error al eliminar la cabecera" }
  }
}

// ═══════════════════════════════════════════════════════════════
//  ZONAS
// ═══════════════════════════════════════════════════════════════

export async function crearZona(formData: FormData) {
  try {
    const codigo      = (formData.get("codigo") as string)?.trim().toUpperCase()
    const nombre      = (formData.get("nombre") as string)?.trim()
    const descripcion = (formData.get("descripcion") as string)?.trim()
    const cabeceraId  = formData.get("cabeceraId") as string
    const esActivoStr = formData.get("esActivo") as string

    if (!codigo)    return { error: "El código es obligatorio" }
    if (!nombre)    return { error: "El nombre es obligatorio" }
    if (!cabeceraId || cabeceraId === "none")
      return { error: "La cabecera es obligatoria" }

    // Verificar código único global
    const codigoExiste = await prisma.zona.findUnique({ where: { codigo } })
    if (codigoExiste) return { error: `Ya existe una zona con el código ${codigo}` }

    // Verificar que la cabecera existe
    const cabecera = await prisma.cabecera.findUnique({ where: { id: cabeceraId } })
    if (!cabecera) return { error: "La cabecera seleccionada no existe" }

    const zona = await prisma.zona.create({
      data: {
        codigo,
        nombre,
        descripcion: descripcion || null,
        cabeceraId,
        esActivo: esActivoStr !== "false",
      },
    })

    REVALIDATE_PATHS()
    return { success: true, data: { id: zona.id, codigo: zona.codigo } }
  } catch (error) {
    console.error("Error al crear zona:", error)
    return { error: "Error interno al crear la zona" }
  }
}

export async function actualizarZona(zonaId: string, formData: FormData) {
  try {
    const codigo      = (formData.get("codigo") as string)?.trim().toUpperCase()
    const nombre      = (formData.get("nombre") as string)?.trim()
    const descripcion = (formData.get("descripcion") as string)?.trim()
    const cabeceraId  = formData.get("cabeceraId") as string
    const esActivoStr = formData.get("esActivo") as string

    if (!codigo) return { error: "El código es obligatorio" }
    if (!nombre) return { error: "El nombre es obligatorio" }
    if (!cabeceraId || cabeceraId === "none")
      return { error: "La cabecera es obligatoria" }

    // Verificar código único (excluyendo el actual)
    const codigoExiste = await prisma.zona.findFirst({
      where: { codigo, NOT: { id: zonaId } },
    })
    if (codigoExiste) return { error: `El código ${codigo} ya está en uso por otra zona` }

    await prisma.zona.update({
      where: { id: zonaId },
      data: {
        codigo,
        nombre,
        descripcion: descripcion || null,
        cabeceraId,
        esActivo: esActivoStr !== "false",
      },
    })

    REVALIDATE_PATHS()
    revalidatePath(`/dashboard/zonas/${zonaId}`)
    return { success: true }
  } catch (error) {
    console.error("Error al actualizar zona:", error)
    return { error: "Error interno al actualizar la zona" }
  }
}

export async function eliminarZona(zonaId: string) {
  try {
    // Verificar dependencias
    const [clientesCount, cajasCount] = await Promise.all([
      prisma.cliente.count({ where: { zonaId } }),
      prisma.cajaNap.count({ where: { zonaId } }),
    ])

    if (clientesCount > 0)
      return {
        error: `No se puede eliminar: hay ${clientesCount} cliente(s) asignado(s) a esta zona.`,
      }
    if (cajasCount > 0)
      return {
        error: `No se puede eliminar: hay ${cajasCount} caja(s) NAP en esta zona.`,
      }

    await prisma.zona.delete({ where: { id: zonaId } })
    REVALIDATE_PATHS()
    return { success: true }
  } catch (error) {
    console.error("Error al eliminar zona:", error)
    return { error: "Error al eliminar la zona" }
  }
}

export async function toggleEstadoZona(zonaId: string, esActivo: boolean) {
  try {
    await prisma.zona.update({
      where: { id: zonaId },
      data: { esActivo },
    })
    REVALIDATE_PATHS()
    return { success: true }
  } catch (error) {
    console.error("Error al cambiar estado zona:", error)
    return { error: "Error al cambiar el estado de la zona" }
  }
}
