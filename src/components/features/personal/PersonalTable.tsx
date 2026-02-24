"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  MoreHorizontal, Eye, Pencil, Trash2, Loader2,
  ShieldCheck, ShieldOff, Wrench,
} from "lucide-react"
import { eliminarPersonal, cambiarEstadoAcceso } from "@/server/actions/personal"
import { toast } from "sonner"
import { EstadoAcceso } from "@prisma/client"

const ROL_LABEL: Record<string, string> = {
  ADMIN:    "Administrador",
  VENDEDOR: "Vendedor",
  TECNICO:  "Técnico",
  SOPORTE:  "Soporte",
  CONTADOR: "Contador",
}

const ROL_COLORS: Record<string, string> = {
  ADMIN:    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  VENDEDOR: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  TECNICO:  "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  SOPORTE:  "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  CONTADOR: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
}

const LABORAL_COLORS: Record<string, string> = {
  ACTIVO:     "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  VACACIONES: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  SUSPENDIDO: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  INACTIVO:   "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
}

const ACCESO_COLORS: Record<string, string> = {
  ACTIVO:   "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  PENDIENTE:"bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  BLOQUEADO:"bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
}

type Personal = {
  personaId:     string
  nombres:       string
  apellidos:     string | null
  dni:           string | null
  email:         string | null
  telefono:      string | null
  esTecnico:     boolean
  estadoLaboral: string
  rolPrincipal:  string
  estadoAcceso:  string
  fechaContratacion: Date
}

export default function PersonalTable({ personal }: { personal: Personal[] }) {
  const [pendingId,    setPendingId]    = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Personal | null>(null)

  const handleToggleAcceso = async (p: Personal) => {
    const nuevoEstado: EstadoAcceso =
      p.estadoAcceso === "ACTIVO" ? "BLOQUEADO" : "ACTIVO"
    setPendingId(p.personaId)
    const result = await cambiarEstadoAcceso(p.personaId, nuevoEstado)
    setPendingId(null)
    if (result.success) {
      toast.success(`Acceso ${nuevoEstado === "ACTIVO" ? "activado" : "bloqueado"} para ${p.nombres}`)
    } else {
      toast.error(result.error ?? "Error al cambiar estado")
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setPendingId(deleteTarget.personaId)
    const result = await eliminarPersonal(deleteTarget.personaId)
    setPendingId(null)
    setDeleteTarget(null)
    if (result.success) {
      toast.success("Personal eliminado correctamente")
    } else {
      toast.error(result.error ?? "Error al eliminar")
    }
  }

  if (personal.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No se encontró personal
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>DNI / Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead className="text-center">Tipo</TableHead>
              <TableHead className="text-center">Estado Laboral</TableHead>
              <TableHead className="text-center">Acceso</TableHead>
              <TableHead>Contratación</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {personal.map((p) => (
              <TableRow
                key={p.personaId}
                className={pendingId === p.personaId ? "opacity-50 pointer-events-none" : ""}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {p.nombres.charAt(0)}{p.apellidos?.charAt(0) ?? ""}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{p.nombres} {p.apellidos ?? ""}</p>
                      <p className="text-xs text-muted-foreground">{p.telefono ?? "—"}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="font-mono text-sm">{p.dni ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{p.email ?? "—"}</p>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={ROL_COLORS[p.rolPrincipal]}>
                    {ROL_LABEL[p.rolPrincipal] ?? p.rolPrincipal}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {p.esTecnico ? (
                    <span className="inline-flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                      <Wrench className="h-3 w-3" /> Técnico
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Administrativo</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary" className={LABORAL_COLORS[p.estadoLaboral]}>
                    {p.estadoLaboral}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary" className={ACCESO_COLORS[p.estadoAcceso]}>
                    {p.estadoAcceso}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(p.fechaContratacion).toLocaleDateString("es-PE")}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={pendingId === p.personaId}>
                        {pendingId === p.personaId
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <MoreHorizontal className="h-4 w-4" />}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/personal/${p.personaId}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalle
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/personal/${p.personaId}/editar`}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleToggleAcceso(p)}>
                        {p.estadoAcceso === "ACTIVO"
                          ? <><ShieldOff className="mr-2 h-4 w-4 text-red-500" />Bloquear acceso</>
                          : <><ShieldCheck className="mr-2 h-4 w-4 text-green-500" />Activar acceso</>}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50"
                        onClick={() => setDeleteTarget(p)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar personal?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar a <strong>{deleteTarget?.nombres} {deleteTarget?.apellidos}</strong>. Se eliminarán también sus credenciales de acceso al sistema. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDelete}
            >
              Eliminar definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
