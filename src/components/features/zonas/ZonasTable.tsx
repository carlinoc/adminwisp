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
import { MoreHorizontal, Pencil, Trash2, Loader2, ToggleLeft, ToggleRight, Eye } from "lucide-react"
import { eliminarZona, toggleEstadoZona } from "@/server/actions/zonas"
import { toast } from "sonner"

type Zona = {
  id: string
  codigo: string
  nombre: string
  descripcion: string | null
  esActivo: boolean
  cabecera: { codigo: string; nombre: string }
  _count: { clientes: number; cajasNap: number }
}

export default function ZonasTable({ zonas }: { zonas: Zona[] }) {
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Zona | null>(null)

  const handleToggle = async (zona: Zona) => {
    setPendingId(zona.id)
    const result = await toggleEstadoZona(zona.id, !zona.esActivo)
    setPendingId(null)
    if (result.success) {
      toast.success(`Zona ${zona.esActivo ? "desactivada" : "activada"}`)
    } else {
      toast.error(result.error ?? "Error al cambiar estado")
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setPendingId(deleteTarget.id)
    const result = await eliminarZona(deleteTarget.id)
    setPendingId(null)
    setDeleteTarget(null)
    if (result.success) {
      toast.success("Zona eliminada")
    } else {
      toast.error(result.error ?? "Error al eliminar")
    }
  }

  if (zonas.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No se encontraron zonas
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Cabecera</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-center">Clientes</TableHead>
              <TableHead className="text-center">Cajas NAP</TableHead>
              <TableHead className="text-center">Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {zonas.map((zona) => (
              <TableRow
                key={zona.id}
                className={pendingId === zona.id ? "opacity-50 pointer-events-none" : ""}
              >
                <TableCell className="font-mono font-medium text-sm">{zona.codigo}</TableCell>
                <TableCell className="font-medium">{zona.nombre}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    <p className="font-medium">{zona.cabecera.nombre}</p>
                    <p className="text-muted-foreground text-xs font-mono">{zona.cabecera.codigo}</p>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                  {zona.descripcion || "—"}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    {zona._count.clientes}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                    {zona._count.cajasNap}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant="secondary"
                    className={zona.esActivo
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}
                  >
                    {zona.esActivo ? "Activa" : "Inactiva"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={pendingId === zona.id}>
                        {pendingId === zona.id
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <MoreHorizontal className="h-4 w-4" />}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/zonas/${zona.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalle
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/zonas/${zona.id}/editar`}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggle(zona)}>
                        {zona.esActivo
                          ? <><ToggleLeft className="mr-2 h-4 w-4 text-yellow-600" />Desactivar</>
                          : <><ToggleRight className="mr-2 h-4 w-4 text-green-600" />Activar</>}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50"
                        onClick={() => setDeleteTarget(zona)}
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

      {/* Confirm delete dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar zona?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar la zona <strong>{deleteTarget?.nombre}</strong> [{deleteTarget?.codigo}].
              Esta acción no se puede deshacer. Solo se puede eliminar si no tiene clientes ni cajas NAP asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDelete}
            >
              Eliminar zona
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
