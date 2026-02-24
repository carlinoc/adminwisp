"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { isValidDNI, isValidEmail } from "@/lib/utils"
import { RolPrincipal, EstadoLaboral, EstadoAcceso } from "@prisma/client"
import bcrypt from "bcryptjs"

const REVALIDATE = () => revalidatePath("/dashboard/personal")

// ═══════════════════════════════════════════════════════════════
//  CREAR PERSONAL  (Persona + PersonaEmpleado + PersonaUsuario)
// ═══════════════════════════════════════════════════════════════
export async function crearPersonal(formData: FormData) {
  try {
    // ── Datos personales ────────────────────────────────────────
    const nombres           = (formData.get("nombres") as string)?.trim()
    const apellidos         = (formData.get("apellidos") as string)?.trim()
    const dni               = (formData.get("dni") as string)?.trim()
    const email             = (formData.get("email") as string)?.trim()
    const telefono          = (formData.get("telefono") as string)?.trim()
    const direccion         = (formData.get("direccion") as string)?.trim()
    const fechaNacimiento   = formData.get("fechaNacimiento") as string

    // ── Datos de empleado ───────────────────────────────────────
    const fechaContratacion = formData.get("fechaContratacion") as string
    const esTecnicoStr      = formData.get("esTecnico") as string
    const estadoLaboral     = formData.get("estadoLaboral") as EstadoLaboral

    // ── Datos de acceso al sistema ──────────────────────────────
    const rolPrincipal      = formData.get("rolPrincipal") as RolPrincipal
    const estadoAcceso      = formData.get("estadoAcceso") as EstadoAcceso
    const password          = formData.get("password") as string
    const confirmarPassword = formData.get("confirmarPassword") as string

    // ── Validaciones ────────────────────────────────────────────
    if (!nombres)    return { error: "El nombre es obligatorio" }
    if (!apellidos)  return { error: "Los apellidos son obligatorios" }
    if (!dni)        return { error: "El DNI es obligatorio" }
    if (!email)      return { error: "El email es obligatorio" }
    if (!fechaContratacion) return { error: "La fecha de contratación es obligatoria" }
    if (!rolPrincipal)      return { error: "El rol es obligatorio" }
    if (!password)   return { error: "La contraseña es obligatoria" }

    if (!isValidDNI(dni))   return { error: "El DNI debe tener 8 dígitos numéricos" }
    if (!isValidEmail(email)) return { error: "El email no tiene un formato válido" }
    if (password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres" }
    if (password !== confirmarPassword) return { error: "Las contraseñas no coinciden" }

    // ── Verificar unicidad ──────────────────────────────────────
    const [dniExiste, emailExiste] = await Promise.all([
      prisma.persona.findUnique({ where: { dni } }),
      prisma.persona.findUnique({ where: { email } }),
    ])
    if (dniExiste)   return { error: `Ya existe una persona registrada con el DNI ${dni}` }
    if (emailExiste) return { error: `Ya existe una persona registrada con el email ${email}` }

    // ── Hash de contraseña ──────────────────────────────────────
    const passwordHash = await bcrypt.hash(password, 12)

    // ── Transacción atómica ─────────────────────────────────────
    const resultado = await prisma.$transaction(async (tx) => {
      const persona = await tx.persona.create({
        data: {
          tipoEntidad: "NATURAL",
          nombres,
          apellidos,
          dni,
          email,
          telefono:        telefono        || null,
          direccion:       direccion       || null,
          fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
        },
      })

      const empleado = await tx.personaEmpleado.create({
        data: {
          personaId:        persona.id,
          fechaContratacion: new Date(fechaContratacion),
          esTecnico:         esTecnicoStr === "true",
          estadoLaboral:     estadoLaboral || "ACTIVO",
        },
      })

      const usuario = await tx.personaUsuario.create({
        data: {
          personaId:    persona.id,
          password:     passwordHash,
          rolPrincipal: rolPrincipal,
          estadoAcceso: estadoAcceso || "PENDIENTE",
        },
      })

      return { persona, empleado, usuario }
    })

    REVALIDATE()
    return { success: true, data: { personaId: resultado.persona.id } }
  } catch (error) {
    console.error("Error al crear personal:", error)
    return { error: "Error interno al crear el personal" }
  }
}

// ═══════════════════════════════════════════════════════════════
//  ACTUALIZAR PERSONAL
// ═══════════════════════════════════════════════════════════════
export async function actualizarPersonal(personaId: string, formData: FormData) {
  try {
    const nombres           = (formData.get("nombres") as string)?.trim()
    const apellidos         = (formData.get("apellidos") as string)?.trim()
    const dni               = (formData.get("dni") as string)?.trim()
    const email             = (formData.get("email") as string)?.trim()
    const telefono          = (formData.get("telefono") as string)?.trim()
    const direccion         = (formData.get("direccion") as string)?.trim()
    const fechaNacimiento   = formData.get("fechaNacimiento") as string

    const fechaContratacion = formData.get("fechaContratacion") as string
    const esTecnicoStr      = formData.get("esTecnico") as string
    const estadoLaboral     = formData.get("estadoLaboral") as EstadoLaboral

    const rolPrincipal      = formData.get("rolPrincipal") as RolPrincipal
    const estadoAcceso      = formData.get("estadoAcceso") as EstadoAcceso

    // ── Validaciones ────────────────────────────────────────────
    if (!nombres)   return { error: "El nombre es obligatorio" }
    if (!apellidos) return { error: "Los apellidos son obligatorios" }
    if (!dni)       return { error: "El DNI es obligatorio" }
    if (!email)     return { error: "El email es obligatorio" }
    if (!fechaContratacion) return { error: "La fecha de contratación es obligatoria" }
    if (!rolPrincipal)      return { error: "El rol es obligatorio" }

    if (!isValidDNI(dni))     return { error: "El DNI debe tener 8 dígitos numéricos" }
    if (!isValidEmail(email)) return { error: "El email no tiene un formato válido" }

    // ── Verificar unicidad excluyendo el actual ─────────────────
    const [dniExiste, emailExiste] = await Promise.all([
      prisma.persona.findFirst({ where: { dni, NOT: { id: personaId } } }),
      prisma.persona.findFirst({ where: { email, NOT: { id: personaId } } }),
    ])
    if (dniExiste)   return { error: `El DNI ${dni} ya está en uso por otra persona` }
    if (emailExiste) return { error: `El email ${email} ya está en uso por otra persona` }

    await prisma.$transaction(async (tx) => {
      await tx.persona.update({
        where: { id: personaId },
        data: {
          nombres,
          apellidos,
          dni,
          email,
          telefono:        telefono        || null,
          direccion:       direccion       || null,
          fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
        },
      })

      await tx.personaEmpleado.update({
        where: { personaId },
        data: {
          fechaContratacion: new Date(fechaContratacion),
          esTecnico:         esTecnicoStr === "true",
          estadoLaboral,
        },
      })

      await tx.personaUsuario.update({
        where: { personaId },
        data: { rolPrincipal, estadoAcceso },
      })
    })

    REVALIDATE()
    revalidatePath(`/dashboard/personal/${personaId}`)
    return { success: true }
  } catch (error) {
    console.error("Error al actualizar personal:", error)
    return { error: "Error interno al actualizar el personal" }
  }
}

// ═══════════════════════════════════════════════════════════════
//  CAMBIAR CONTRASEÑA
// ═══════════════════════════════════════════════════════════════
export async function cambiarPassword(personaId: string, formData: FormData) {
  try {
    const nuevaPassword    = formData.get("nuevaPassword") as string
    const confirmarPassword = formData.get("confirmarPassword") as string

    if (!nuevaPassword)   return { error: "La contraseña es obligatoria" }
    if (nuevaPassword.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres" }
    if (nuevaPassword !== confirmarPassword) return { error: "Las contraseñas no coinciden" }

    const passwordHash = await bcrypt.hash(nuevaPassword, 12)

    await prisma.personaUsuario.update({
      where: { personaId },
      data: { password: passwordHash },
    })

    REVALIDATE()
    revalidatePath(`/dashboard/personal/${personaId}`)
    return { success: true }
  } catch (error) {
    console.error("Error al cambiar contraseña:", error)
    return { error: "Error al cambiar la contraseña" }
  }
}

// ═══════════════════════════════════════════════════════════════
//  CAMBIAR ESTADO DE ACCESO  (bloquear / activar)
// ═══════════════════════════════════════════════════════════════
export async function cambiarEstadoAcceso(personaId: string, nuevoEstado: EstadoAcceso) {
  try {
    await prisma.personaUsuario.update({
      where: { personaId },
      data: { estadoAcceso: nuevoEstado },
    })
    REVALIDATE()
    revalidatePath(`/dashboard/personal/${personaId}`)
    return { success: true }
  } catch (error) {
    console.error("Error al cambiar estado de acceso:", error)
    return { error: "Error al cambiar el estado de acceso" }
  }
}

// ═══════════════════════════════════════════════════════════════
//  CAMBIAR ESTADO LABORAL
// ═══════════════════════════════════════════════════════════════
export async function cambiarEstadoLaboral(personaId: string, nuevoEstado: EstadoLaboral) {
  try {
    await prisma.personaEmpleado.update({
      where: { personaId },
      data: { estadoLaboral: nuevoEstado },
    })
    REVALIDATE()
    revalidatePath(`/dashboard/personal/${personaId}`)
    return { success: true }
  } catch (error) {
    console.error("Error al cambiar estado laboral:", error)
    return { error: "Error al cambiar el estado laboral" }
  }
}

// ═══════════════════════════════════════════════════════════════
//  ELIMINAR PERSONAL
// ═══════════════════════════════════════════════════════════════
export async function eliminarPersonal(personaId: string) {
  try {
    // Verificar que no sea el único admin activo
    const persona = await prisma.persona.findUnique({
      where: { id: personaId },
      include: { personaUsuario: true },
    })
    if (!persona) return { error: "Personal no encontrado" }

    if (persona.personaUsuario?.rolPrincipal === "ADMIN") {
      const otrosAdmins = await prisma.personaUsuario.count({
        where: {
          rolPrincipal: "ADMIN",
          estadoAcceso: "ACTIVO",
          NOT: { personaId },
        },
      })
      if (otrosAdmins === 0) {
        return { error: "No puedes eliminar al único administrador activo del sistema" }
      }
    }

    // Verificar todas las referencias que impiden la eliminación
    const [materialesAsignados, pedidosAsignados, cabeceras, clientesVendedor] = await Promise.all([
      prisma.materialAsignado.count({
        where: {
          personalEntrega: {
            personaId: personaId
          }
        },
      }),
      prisma.pedido.count({
        where: { empleadoReceptorId: personaId },
      }),
      prisma.cabecera.count({
        where: { arrendadorId: personaId },
      }),
      prisma.cliente.count({
        where: { vendedorId: personaId },
      }),
    ])

    if (materialesAsignados > 0) {
      return { error: `No se puede eliminar este personal: tiene ${materialesAsignados} material(es) asignado(s)` }
    }
    
    if (pedidosAsignados > 0) {
      return { error: `No se puede eliminar este personal: tiene ${pedidosAsignados} pedido(s) asignado(s)` }
    }
    
    if (cabeceras > 0) {
      return { error: `No se puede eliminar este personal: es arrendador de ${cabeceras} cabecera(s)` }
    }
    
    if (clientesVendedor > 0) {
      return { error: `No se puede eliminar este personal: es vendedor de ${clientesVendedor} cliente(s)` }
    }

    // Cascade: elimina persona → elimina empleado y usuario automáticamente
    await prisma.persona.delete({ where: { id: personaId } })

    REVALIDATE()
    return { success: true }
  } catch (error) {
    console.error("Error al eliminar personal:", error)
    return { error: "Error al eliminar el personal" }
  }
}
