"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { generateCode, isValidDNI, isValidEmail, isValidRUC } from "@/lib/utils"
import { TipoEntidad, EstadoConexion } from "@prisma/client"

// ─── CREAR CLIENTE ────────────────────────────────────────────────────────────
export async function crearCliente(formData: FormData) {
  try {
    const tipoEntidad = formData.get("tipoEntidad") as TipoEntidad
    const email = (formData.get("email") as string)?.trim()
    const telefono = (formData.get("telefono") as string)?.trim()
    const direccion = (formData.get("direccion") as string)?.trim()
    const zonaId = formData.get("zonaId") as string
    const estadoConexion = formData.get("estadoConexion") as EstadoConexion
    const rawVendedorId = formData.get("vendedorId") as string

    if (!direccion) return { error: "La dirección es obligatoria" }
    if (email && !isValidEmail(email)) return { error: "El email no es válido" }
    if (!zonaId || zonaId === "none") return { error: "La zona es obligatoria" }

    const zonaExiste = await prisma.zona.findUnique({ where: { id: zonaId } })
    if (!zonaExiste) return { error: "La zona seleccionada no existe" }

    let persona
    let personaJuridica

    if (tipoEntidad === "NATURAL") {
      const nombres = (formData.get("nombres") as string)?.trim()
      const apellidos = (formData.get("apellidos") as string)?.trim()
      const dni = (formData.get("dni") as string)?.trim()
      const fechaNacimiento = formData.get("fechaNacimiento") as string

      if (!nombres || !apellidos || !dni || !telefono)
        return { error: "Nombres, apellidos, DNI y teléfono son obligatorios" }
      if (!isValidDNI(dni)) return { error: "El DNI debe tener 8 dígitos numéricos" }

      const dniExiste = await prisma.persona.findUnique({ where: { dni } })
      if (dniExiste) return { error: "Ya existe una persona con este DNI" }

      if (email) {
        const emailExiste = await prisma.persona.findUnique({ where: { email } })
        if (emailExiste) return { error: "Ya existe una persona con este email" }
      }

      persona = await prisma.persona.create({
        data: {
          tipoEntidad,
          nombres,
          apellidos,
          dni,
          fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
          email: email || null,
          telefono,
          direccion,
        },
      })
    } else {
      const razonSocial = (formData.get("razonSocial") as string)?.trim()
      const ruc = (formData.get("ruc") as string)?.trim()
      const telefonoEmpresa = (formData.get("telefonoEmpresa") as string)?.trim()
      const representanteLegalId = formData.get("representanteLegalId") as string

      if (!razonSocial || !ruc || !representanteLegalId || representanteLegalId === "none")
        return { error: "Razón social, RUC y representante legal son obligatorios" }
      if (!isValidRUC(ruc))
        return { error: "El RUC debe tener 11 dígitos y comenzar con 10 o 20" }

      const rucExiste = await prisma.personaJuridica.findUnique({ where: { ruc } })
      if (rucExiste) return { error: "Ya existe una empresa con este RUC" }

      if (email) {
        const emailExiste = await prisma.persona.findUnique({ where: { email } })
        if (emailExiste) return { error: "Ya existe una persona con este email" }
      }

      const representante = await prisma.persona.findUnique({ where: { id: representanteLegalId } })
      if (!representante) return { error: "El representante legal seleccionado no existe" }

      const result = await prisma.$transaction(async (tx) => {
        const personaCreada = await tx.persona.create({
          data: {
            tipoEntidad,
            nombres: razonSocial,
            apellidos: "",
            email: email || null,
            telefono: telefono || null,
            direccion,
          },
        })
        const personaJuridicaCreada = await tx.personaJuridica.create({
          data: {
            personaId: personaCreada.id,
            razonSocial,
            ruc,
            telefono: telefonoEmpresa || null,
            representanteLegalId,
          },
        })
        return { persona: personaCreada, personaJuridica: personaJuridicaCreada }
      })

      persona = result.persona
      personaJuridica = result.personaJuridica
    }

    const vendedorId = rawVendedorId && rawVendedorId !== "none" ? rawVendedorId : null

    const cliente = await prisma.cliente.create({
      data: {
        personaId: persona.id,
        zonaId,
        vendedorId,
        codigoCliente: generateCode("CLI-"),
        estadoConexion,
        saldoFavor: 0,
      },
    })

    revalidatePath("/dashboard/clientes")
    return {
      success: true,
      data: {
        persona,
        personaJuridica,
        cliente: { ...cliente, saldoFavor: Number(cliente.saldoFavor) },
      },
    }
  } catch (error) {
    console.error("Error al crear cliente:", error)
    return { error: "Error interno al crear el cliente" }
  }
}

// ─── ACTUALIZAR CLIENTE ───────────────────────────────────────────────────────
export async function actualizarCliente(clienteId: string, formData: FormData) {
  try {
    const tipoEntidad = formData.get("tipoEntidad") as "NATURAL" | "JURIDICO"
    const email = (formData.get("email") as string)?.trim()
    const telefono = (formData.get("telefono") as string)?.trim()
    const direccion = (formData.get("direccion") as string)?.trim()
    const zonaId = formData.get("zonaId") as string
    const estadoConexion = formData.get("estadoConexion") as EstadoConexion
    const rawVendedorId = formData.get("vendedorId") as string

    const nombres =
      tipoEntidad === "JURIDICO"
        ? (formData.get("razonSocial") as string)?.trim()
        : (formData.get("nombres") as string)?.trim()
    const apellidos =
      tipoEntidad === "JURIDICO" ? null : (formData.get("apellidos") as string)?.trim()

    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      include: { persona: { include: { personaJuridica: true } } },
    })
    if (!cliente) return { error: "Cliente no encontrado" }

    if (!nombres) return { error: "El nombre o razón social es obligatorio" }
    if (!zonaId || zonaId === "none") return { error: "La zona es obligatoria" }
    if (email && !isValidEmail(email)) return { error: "El email no es válido" }

    if (email && email !== cliente.persona.email) {
      const emailExiste = await prisma.persona.findFirst({
        where: { email, NOT: { id: cliente.personaId } },
      })
      if (emailExiste) return { error: "El email ya está en uso por otra persona" }
    }

    const vendedorId = rawVendedorId === "none" || rawVendedorId === "" ? null : rawVendedorId

    await prisma.$transaction(async (tx) => {
      await tx.persona.update({
        where: { id: cliente.personaId },
        data: { nombres, apellidos, email: email || null, telefono, direccion },
      })

      if (tipoEntidad === "JURIDICO") {
        const ruc = (formData.get("ruc") as string)?.trim()
        const representanteLegalId = formData.get("representanteLegalId") as string
        await tx.personaJuridica.upsert({
          where: { personaId: cliente.personaId },
          update: {
            ruc,
            representanteLegalId: representanteLegalId === "none" ? null : representanteLegalId,
          },
          create: {
            personaId: cliente.personaId,
            razonSocial: nombres,
            ruc,
            representanteLegalId: representanteLegalId === "none" ? null : representanteLegalId,
          },
        })
      }

      await tx.cliente.update({
        where: { id: clienteId },
        data: { zonaId, vendedorId, estadoConexion },
      })
    })

    revalidatePath("/dashboard/clientes")
    revalidatePath(`/dashboard/clientes/${clienteId}`)
    return { success: true }
  } catch (error) {
    console.error("Error al actualizar cliente:", error)
    return { error: "Error interno al actualizar el cliente" }
  }
}

// ─── ELIMINAR CLIENTE ─────────────────────────────────────────────────────────
export async function eliminarCliente(clienteId: string) {
  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      include: { contratos: true },
    })
    if (!cliente) return { error: "Cliente no encontrado" }

    const contratosActivos = cliente.contratos.filter((c) => c.estado === "ACTIVO")
    if (contratosActivos.length > 0)
      return { error: "No se puede eliminar un cliente con contratos activos" }

    await prisma.$transaction(async (tx) => {
      const ubicaciones = await tx.ubicacionInstalacion.findMany({ where: { clienteId } })
      for (const ub of ubicaciones) {
        await tx.configuracionOnt.deleteMany({ where: { ubicacionInstalacionId: ub.id } })
      }
      await tx.ubicacionInstalacion.deleteMany({ where: { clienteId } })
      await tx.cliente.delete({ where: { id: clienteId } })
    })

    revalidatePath("/dashboard/clientes")
    return { success: true }
  } catch (error) {
    console.error("Error al eliminar cliente:", error)
    return { error: "Error al eliminar el cliente" }
  }
}

// ─── CAMBIAR ESTADO DE CONEXIÓN ───────────────────────────────────────────────
export async function cambiarEstadoConexion(clienteId: string, nuevoEstado: EstadoConexion) {
  try {
    await prisma.cliente.update({
      where: { id: clienteId },
      data: { estadoConexion: nuevoEstado },
    })
    revalidatePath("/dashboard/clientes")
    revalidatePath(`/dashboard/clientes/${clienteId}`)
    return { success: true }
  } catch (error) {
    console.error("Error al cambiar estado:", error)
    return { error: "Error al cambiar el estado del cliente" }
  }
}

// ─── CRUD UBICACIÓN DE INSTALACIÓN ───────────────────────────────────────────
export async function crearUbicacionInstalacion(clienteId: string, formData: FormData) {
  try {
    const direccion = (formData.get("direccion") as string)?.trim()
    const latitudStr = formData.get("latitud") as string
    const longitudStr = formData.get("longitud") as string
    const referenciaVisual = (formData.get("referenciaVisual") as string)?.trim()

    if (!direccion) return { error: "La dirección es obligatoria" }

    const ubicacion = await prisma.ubicacionInstalacion.create({
      data: {
        clienteId,
        direccion,
        latitud: latitudStr ? parseFloat(latitudStr) : null,
        longitud: longitudStr ? parseFloat(longitudStr) : null,
        referenciaVisual: referenciaVisual || null,
      },
    })

    revalidatePath(`/dashboard/clientes/${clienteId}`)
    return { success: true, data: ubicacion }
  } catch (error) {
    console.error("Error al crear ubicación:", error)
    return { error: "Error al crear la ubicación de instalación" }
  }
}

export async function actualizarUbicacionInstalacion(
  ubicacionId: string,
  clienteId: string,
  formData: FormData
) {
  try {
    const direccion = (formData.get("direccion") as string)?.trim()
    const latitudStr = formData.get("latitud") as string
    const longitudStr = formData.get("longitud") as string
    const referenciaVisual = (formData.get("referenciaVisual") as string)?.trim()

    if (!direccion) return { error: "La dirección es obligatoria" }

    await prisma.ubicacionInstalacion.update({
      where: { id: ubicacionId },
      data: {
        direccion,
        latitud: latitudStr ? parseFloat(latitudStr) : null,
        longitud: longitudStr ? parseFloat(longitudStr) : null,
        referenciaVisual: referenciaVisual || null,
      },
    })

    revalidatePath(`/dashboard/clientes/${clienteId}`)
    return { success: true }
  } catch (error) {
    console.error("Error al actualizar ubicación:", error)
    return { error: "Error al actualizar la ubicación" }
  }
}

export async function eliminarUbicacionInstalacion(ubicacionId: string, clienteId: string) {
  try {
    const contratosAsociados = await prisma.contrato.count({
      where: { ubicacionInstalacionId: ubicacionId },
    })
    if (contratosAsociados > 0)
      return { error: "No se puede eliminar una ubicación con contratos asociados" }

    await prisma.configuracionOnt.deleteMany({ where: { ubicacionInstalacionId: ubicacionId } })
    await prisma.ubicacionInstalacion.delete({ where: { id: ubicacionId } })

    revalidatePath(`/dashboard/clientes/${clienteId}`)
    return { success: true }
  } catch (error) {
    console.error("Error al eliminar ubicación:", error)
    return { error: "Error al eliminar la ubicación" }
  }
}

// ─── ASIGNAR / DESASIGNAR PUERTO NAP ─────────────────────────────────────────

export async function asignarPuerto(clienteId: string, puertoId: string) {
  try {
    // Verificar que el puerto existe y está disponible
    const puerto = await prisma.puerto.findUnique({ where: { id: puertoId } })
    if (!puerto)                        return { error: "Puerto no encontrado" }
    if (puerto.estado !== "DISPONIBLE") return { error: "El puerto no está disponible" }
    if (puerto.clienteAsignadoId)       return { error: "El puerto ya tiene un cliente asignado" }

    // Si el cliente ya tiene otro puerto, liberarlo primero
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      select: { puertoId: true },
    })

    await prisma.$transaction(async (tx) => {
      // Liberar puerto anterior si tenía
      if (cliente?.puertoId) {
        await tx.puerto.update({
          where: { id: cliente.puertoId },
          data:  { estado: "DISPONIBLE", clienteAsignadoId: null },
        })
        await tx.cajaNap.update({
          where: { id: (await tx.puerto.findUnique({ where: { id: cliente.puertoId }, select: { cajaNapId: true } }))!.cajaNapId },
          data:  { puertosUtilizados: { decrement: 1 } },
        })
      }

      // Asignar nuevo puerto
      await tx.puerto.update({
        where: { id: puertoId },
        data:  { estado: "OCUPADO", clienteAsignadoId: clienteId },
      })
      await tx.cajaNap.update({
        where: { id: puerto.cajaNapId },
        data:  { puertosUtilizados: { increment: 1 } },
      })

      // Actualizar puertoId en el cliente
      await tx.cliente.update({
        where: { id: clienteId },
        data:  { puertoId },
      })
    })

    revalidatePath(`/dashboard/clientes/${clienteId}`)
    revalidatePath(`/dashboard/infraestructura/cajas/${puerto.cajaNapId}`)
    return { success: true }
  } catch (error) {
    console.error("Error al asignar puerto:", error)
    return { error: "Error al asignar el puerto" }
  }
}

export async function desasignarPuerto(clienteId: string) {
  try {
    const cliente = await prisma.cliente.findUnique({
      where:  { id: clienteId },
      select: { puertoId: true },
    })
    if (!cliente?.puertoId) return { error: "El cliente no tiene puerto asignado" }

    const puerto = await prisma.puerto.findUnique({
      where:  { id: cliente.puertoId },
      select: { cajaNapId: true },
    })

    await prisma.$transaction(async (tx) => {
      await tx.puerto.update({
        where: { id: cliente.puertoId! },
        data:  { estado: "DISPONIBLE", clienteAsignadoId: null },
      })
      if (puerto) {
        await tx.cajaNap.update({
          where: { id: puerto.cajaNapId },
          data:  { puertosUtilizados: { decrement: 1 } },
        })
      }
      await tx.cliente.update({
        where: { id: clienteId },
        data:  { puertoId: null },
      })
    })

    revalidatePath(`/dashboard/clientes/${clienteId}`)
    if (puerto) revalidatePath(`/dashboard/infraestructura/cajas/${puerto.cajaNapId}`)
    return { success: true }
  } catch (error) {
    console.error("Error al desasignar puerto:", error)
    return { error: "Error al desasignar el puerto" }
  }
}
