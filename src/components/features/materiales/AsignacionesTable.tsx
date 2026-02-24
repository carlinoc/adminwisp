"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, Trash2, Loader2, RotateCcw } from "lucide-react"
import { eliminarAsignacion } from "@/server/actions/asignaciones"
import { toast } from "sonner"

type Asignacion = {
  id: string
  cantidad: number
  serial: string | null
  fechaAsignacion: Date
  material: { nombre: string; unidadMedida: string; requiereDevolucion: boolean }
  tecnico: { persona: { nombres: string; apellidos: string | null } }
  personalEntrega: { persona: { nombres: string; apellidos: string | null } }
}

export default function AsignacionesTable({ asignaciones }: { asignaciones: Asignacion[] }) {
  const [pendingId,    setPendingId]    = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Asignacion | null>(null)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setPendingId(deleteTarget.id)
    const result = await eliminarAsignacion(deleteTarget.id)
    setPendingId(null)
    setDeleteTarget(null)
    result.success
      ? toast.success("Asignación eliminada. El stock fue devuelto al inventario.")
      : toast.error(result.error ?? "Error al eliminar")
  }

  if (asignaciones.length === 0)
    return <div className="text-center py-12 text-muted-foreground">No se encontraron asignaciones</div>

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Material</TableHead>
              <TableHead>Técnico Receptor</TableHead>
              <TableHead>Entregado por</TableHead>
              <TableHead className="text-center">Cantidad</TableHead>
              <TableHead>Serial</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {asignaciones.map((a) => (
              <TableRow key={a.id} className={pendingId === a.id ? "opacity-50 pointer-events-none" : ""}>
                <TableCell>
                  <div>
                    <p className="font-medium text-sm">{a.material.nombre}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-xs text-muted-foreground">{a.material.unidadMedida}</span>
                      {a.material.requiereDevolucion && (
                        <RotateCcw className="h-3 w-3 text-blue-500" />
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {a.tecnico.persona.nombres} {a.tecnico.persona.apellidos ?? ""}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {a.personalEntrega.persona.nombres} {a.personalEntrega.persona.apellidos ?? ""}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    {a.cantidad}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {a.serial || "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(a.fechaAsignacion).toLocaleDateString("es-PE")}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={pendingId === a.id}>
                        {pendingId === a.id
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <MoreHorizontal className="h-4 w-4" />}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/materiales/asignaciones/${a.id}`}>
                          <Eye className="mr-2 h-4 w-4" />Ver detalle
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50"
                        onClick={() => setDeleteTarget(a)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />Eliminar
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
            <AlertDialogTitle>¿Eliminar asignación?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar la asignación de <strong>{deleteTarget?.cantidad} {deleteTarget?.material.unidadMedida}(s)</strong> de{" "}
              <strong>{deleteTarget?.material.nombre}</strong> para{" "}
              <strong>{deleteTarget?.tecnico.persona.nombres} {deleteTarget?.tecnico.persona.apellidos}</strong>.
              <br /><br />
              <span className="text-green-700 dark:text-green-400 font-medium">
                ✓ El stock será devuelto automáticamente al inventario.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDelete}>
              Eliminar asignación
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
