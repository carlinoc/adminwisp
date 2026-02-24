import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Pencil, Wrench, ShieldCheck, CalendarDays, Mail, Phone, MapPin } from "lucide-react"
import Link from "next/link"
import {
  CambiarPasswordModal,
  CambiarEstadoAccesoDropdown,
  CambiarEstadoLaboralDropdown,
} from "@/components/features/personal/PersonalActions"

const ROL_LABEL: Record<string, string> = {
  ADMIN: "Administrador", VENDEDOR: "Vendedor",
  TECNICO: "Técnico", SOPORTE: "Soporte", CONTADOR: "Contador",
}
const ROL_COLORS: Record<string, string> = {
  ADMIN:    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  VENDEDOR: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  TECNICO:  "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  SOPORTE:  "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  CONTADOR: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
}

export default async function DetallePersonalPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const persona = await prisma.persona.findUnique({
    where: { id },
    include: {
      personaEmpleado: true,
      personaUsuario: { select: { rolPrincipal: true, estadoAcceso: true } },
    },
  })

  if (!persona || !persona.personaEmpleado || !persona.personaUsuario) notFound()

  const emp = persona.personaEmpleado
  const usr = persona.personaUsuario

  const diasTrabajados = Math.floor(
    (Date.now() - new Date(emp.fechaContratacion).getTime()) / (1000 * 60 * 60 * 24)
  )
  const años = Math.floor(diasTrabajados / 365)
  const meses = Math.floor((diasTrabajados % 365) / 30)

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/personal">
            <Button variant="ghost" size="icon" className="dark:hover:bg-slate-800">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            {/* Avatar grande */}
            <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
              {persona.nombres.charAt(0)}{persona.apellidos?.charAt(0) ?? ""}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-foreground">
                  {persona.nombres} {persona.apellidos ?? ""}
                </h1>
                <Badge variant="secondary" className={ROL_COLORS[usr.rolPrincipal]}>
                  {ROL_LABEL[usr.rolPrincipal]}
                </Badge>
                {emp.esTecnico && (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                    <Wrench className="h-3 w-3 mr-1" />Técnico de campo
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground font-mono text-sm mt-0.5">
                DNI: {persona.dni ?? "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-wrap gap-2">
          <CambiarEstadoLaboralDropdown personaId={id} estadoActual={emp.estadoLaboral} />
          <CambiarEstadoAccesoDropdown  personaId={id} estadoActual={usr.estadoAcceso} />
          <CambiarPasswordModal personaId={id} />
          <Link href={`/dashboard/personal/${id}/editar`}>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
              <Pencil className="h-4 w-4" />
              Editar
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda */}
        <div className="space-y-6">
          {/* Contacto */}
          <Card className="dark:bg-slate-900/50">
            <CardHeader><CardTitle className="text-base">Contacto</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{persona.email ?? "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span>{persona.telefono ?? "—"}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{persona.direccion ?? "—"}</span>
              </div>
              {persona.fechaNacimiento && (
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span>
                    {new Date(persona.fechaNacimiento).toLocaleDateString("es-PE", {
                      day: "2-digit", month: "long", year: "numeric",
                    })}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Acceso */}
          <Card className="dark:bg-slate-900/50">
            <CardHeader><CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />Acceso al Sistema
            </CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Rol</span>
                <Badge variant="secondary" className={ROL_COLORS[usr.rolPrincipal]}>
                  {ROL_LABEL[usr.rolPrincipal]}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Estado acceso</span>
                <Badge variant="secondary" className={
                  usr.estadoAcceso === "ACTIVO"   ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" :
                  usr.estadoAcceso === "PENDIENTE"? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" :
                                                    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                }>
                  {usr.estadoAcceso}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Email de acceso</span>
                <span className="font-mono text-xs truncate max-w-32">{persona.email}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna derecha */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info laboral */}
          <Card className="dark:bg-slate-900/50">
            <CardHeader><CardTitle className="text-base">Información Laboral</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div className="p-3 rounded-lg bg-muted/30 border border-border">
                  <p className="text-muted-foreground text-xs mb-1">Estado laboral</p>
                  <Badge variant="secondary" className={
                    emp.estadoLaboral === "ACTIVO"     ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" :
                    emp.estadoLaboral === "VACACIONES" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" :
                    emp.estadoLaboral === "SUSPENDIDO" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" :
                                                         "bg-gray-100 text-gray-600"
                  }>
                    {emp.estadoLaboral}
                  </Badge>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 border border-border">
                  <p className="text-muted-foreground text-xs mb-1">Tipo</p>
                  <p className="font-medium">{emp.esTecnico ? "Técnico de campo" : "Administrativo"}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 border border-border">
                  <p className="text-muted-foreground text-xs mb-1">Fecha contratación</p>
                  <p className="font-medium">
                    {new Date(emp.fechaContratacion).toLocaleDateString("es-PE")}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 border border-border md:col-span-3">
                  <p className="text-muted-foreground text-xs mb-1">Antigüedad</p>
                  <p className="font-semibold text-blue-600 dark:text-blue-400">
                    {años > 0 ? `${años} año${años > 1 ? "s" : ""} ` : ""}
                    {meses > 0 ? `${meses} mes${meses > 1 ? "es" : ""}` : ""}
                    {años === 0 && meses === 0 ? `${diasTrabajados} días` : ""}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Registro del sistema */}
          <Card className="dark:bg-slate-900/50">
            <CardHeader><CardTitle className="text-base">Registro del Sistema</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <div className="flex justify-between">
                <span>Fecha de alta en sistema</span>
                <span>{new Date(persona.fechaCreacion).toLocaleDateString("es-PE", {
                  day: "2-digit", month: "long", year: "numeric",
                })}</span>
              </div>
              <div className="flex justify-between">
                <span>ID interno</span>
                <span className="font-mono text-xs">{persona.id}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
