"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { generateCode, isValidDNI, isValidEmail, isValidRUC } from "@/lib/utils"
import { TipoEntidad, EstadoConexion } from "@prisma/client"

export async function crearCliente(formData: FormData) {
  try {
    const tipoEntidad = formData.get("tipoEntidad") as TipoEntidad
    const email = formData.get("email") as string
    const telefono = formData.get("telefono") as string
    const direccion = formData.get("direccion") as string
    const zonaId = formData.get("zonaId") as string
    const vendedorId = formData.get("vendedorId") as string
    const estadoConexion = formData.get("estadoConexion") as EstadoConexion

    // Validar campos comunes
    if (!direccion) {
      return { error: "La dirección es obligatoria" }
    }

    if (email && !isValidEmail(email)) {
      return { error: "El email no es válido" }
    }

    let persona;
    let personaJuridica;

    if (tipoEntidad === "NATURAL") {
      // Validar campos de persona natural
      const nombres = formData.get("nombres") as string
      const apellidos = formData.get("apellidos") as string
      const dni = formData.get("dni") as string
      const fechaNacimiento = formData.get("fechaNacimiento") as string

      if (!nombres || !apellidos || !dni || !telefono) {
        return { error: "Todos los campos obligatorios deben estar completos" }
      }

      if (!isValidDNI(dni)) {
        return { error: "El DNI debe tener 8 dígitos" }
      }

      // Verificar si el DNI ya existe
      const dniExiste = await prisma.persona.findUnique({
        where: { dni },
      })

      if (dniExiste) {
        return { error: "Ya existe una persona con este DNI" }
      }

      // Verificar email
      if (email) {
        const emailExiste = await prisma.persona.findUnique({
          where: { email },
        })

        if (emailExiste) {
          return { error: "Ya existe una persona con este email" }
        }
      }

      // Crear persona natural
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
      // PERSONA JURIDICA
      const razonSocial = formData.get("razonSocial") as string
      const ruc = formData.get("ruc") as string
      const telefonoEmpresa = formData.get("telefonoEmpresa") as string
      const representanteLegalId = formData.get("representanteLegalId") as string

      if (!razonSocial || !ruc || !representanteLegalId) {
        return { error: "Todos los campos obligatorios deben estar completos" }
      }

      if (!isValidRUC(ruc)) {
        return { error: "El RUC debe tener 11 dígitos" }
      }

      // Verificar si el RUC ya existe
      const rucExiste = await prisma.personaJuridica.findUnique({
        where: { ruc },
      })

      if (rucExiste) {
        return { error: "Ya existe una empresa con este RUC" }
      }

      // Verificar email
      if (email) {
        const emailExiste = await prisma.persona.findUnique({
          where: { email },
        })

        if (emailExiste) {
          return { error: "Ya existe una persona con este email" }
        }
      }

      // Verificar que el representante legal existe
      const representante = await prisma.persona.findUnique({
        where: { id: representanteLegalId },
      })

      if (!representante) {
        return { error: "El representante legal seleccionado no existe" }
      }

      // Crear en transacción
      const result = await prisma.$transaction(async (tx) => {
        // Crear persona base
        const personaCreada = await tx.persona.create({
          data: {
            tipoEntidad,
            nombres: razonSocial, // Usamos razonSocial como nombres
            apellidos: "",
            email: email || null,
            telefono: telefono || null,
            direccion,
          },
        })

        // Crear persona jurídica
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

    // Generar código de cliente
    const codigoCliente = generateCode("CLI-")

    // Crear cliente
    const cliente = await prisma.cliente.create({
      data: {
        personaId: persona.id,
        zonaId,
        vendedorId,
        codigoCliente,
        estadoConexion,
        saldoFavor: 0,
      },
    })

    revalidatePath("/dashboard/clientes")
    return { success: true, data: { persona, personaJuridica, cliente } }
  } catch (error) {
    console.error("Error al crear cliente:", error)
    return { error: "Error al crear el cliente" }
  }
}

export async function actualizarCliente(clienteId: string, formData: FormData) {
  try {
    const nombres = formData.get("nombres") as string
    const apellidos = formData.get("apellidos") as string
    const email = formData.get("email") as string
    const telefono = formData.get("telefono") as string
    const direccion = formData.get("direccion") as string
    const zonaId = formData.get("zonaId") as string
    const vendedorId = formData.get("vendedorId") as string
    const estadoConexion = formData.get("estadoConexion") as EstadoConexion

    // Obtener cliente con persona
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      include: { persona: true },
    })

    if (!cliente) {
      return { error: "Cliente no encontrado" }
    }

    // Validar email si cambió
    if (email && email !== cliente.persona.email) {
      if (!isValidEmail(email)) {
        return { error: "El email no es válido" }
      }

      const emailExiste = await prisma.persona.findUnique({
        where: { email },
      })

      if (emailExiste && emailExiste.id !== cliente.persona.id) {
        return { error: "Ya existe una persona con este email" }
      }
    }

    // Actualizar en transacción
    await prisma.$transaction(async (tx) => {
      // Actualizar persona
      await tx.persona.update({
        where: { id: cliente.personaId },
        data: {
          nombres,
          apellidos,
          email: email || null,
          telefono,
          direccion,
        },
      })

      // Actualizar cliente
      await tx.cliente.update({
        where: { id: clienteId },
        data: {
          zonaId,
          vendedorId,
          estadoConexion,
        },
      })
    })

    revalidatePath("/dashboard/clientes")
    revalidatePath(`/dashboard/clientes/${clienteId}`)
    return { success: true }
  } catch (error) {
    console.error("Error al actualizar cliente:", error)
    return { error: "Error al actualizar el cliente" }
  }
}

export async function eliminarCliente(clienteId: string) {
  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      include: {
        contratos: true,
        pagos: true,
      },
    })

    if (!cliente) {
      return { error: "Cliente no encontrado" }
    }

    // Verificar si tiene contratos activos
    const contratosActivos = cliente.contratos.filter(
      (c) => c.estado === "ACTIVO"
    )

    if (contratosActivos.length > 0) {
      return {
        error: "No se puede eliminar un cliente con contratos activos",
      }
    }

    // Eliminar cliente (la persona se mantiene por si tiene otros roles)
    await prisma.cliente.delete({
      where: { id: clienteId },
    })

    revalidatePath("/dashboard/clientes")
    return { success: true }
  } catch (error) {
    console.error("Error al eliminar cliente:", error)
    return { error: "Error al eliminar el cliente" }
  }
}