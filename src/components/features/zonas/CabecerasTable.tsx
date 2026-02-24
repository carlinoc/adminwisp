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
import { MoreHorizontal, Pencil, Trash2, Loader2, Eye, MapPin } from "lucide-react"
import { eliminarCabecera } from "@/server/actions/zonas"
import { toast } from "sonner"

type Cabecera = {
  id: string
  codigo: string
  nombre: string
  ubicacion: string | null
  latitud: number | null
  longitud: number | null
  arrendador: { nombres: string; apellidos: string | null }
  _count: { zonas: number }
}

export default function CabecerasTable({ cabeceras }: { cabeceras: Cabecera[] }) {
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Cabecera | null>(null)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setPendingId(deleteTarget.id)
    const result = await eliminarCabecera(deleteTarget.id)
    setPendingId(null)
    setDeleteTarget(null)
    if (result.success) {
      toast.success("Cabecera eliminada")
    } else {
      toast.error(result.error ?? "Error al eliminar")
    }
  }

  if (cabeceras.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No se encontraron cabeceras
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
              <TableHead>Arrendador</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead>Coordenadas</TableHead>
              <TableHead className="text-center">Zonas</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cabeceras.map((cab) => (
              <TableRow
                key={cab.id}
                className={pendingId === cab.id ? "opacity-50 pointer-events-none" : ""}
              >
                <TableCell className="font-mono font-semibold text-sm">{cab.codigo}</TableCell>
                <TableCell className="font-medium">{cab.nombre}</TableCell>
                <TableCell className="text-sm">
                  {cab.arrendador.nombres} {cab.arrendador.apellidos ?? ""}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-[180px] truncate">
                  {cab.ubicacion
                    ? <span className="flex items-center gap-1"><MapPin className="h-3 w-3 flex-shrink-0" />{cab.ubicacion}</span>
                    : "—"}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {cab.latitud && cab.longitud
                    ? `${Number(cab.latitud).toFixed(4)}, ${Number(cab.longitud).toFixed(4)}`
                    : "—"}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
                    {cab._count.zonas}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={pendingId === cab.id}>
                        {pendingId === cab.id
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <MoreHorizontal className="h-4 w-4" />}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/zonas/cabeceras/${cab.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalle
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/zonas/cabeceras/${cab.id}/editar`}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50"
                        onClick={() => setDeleteTarget(cab)}
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
            <AlertDialogTitle>¿Eliminar cabecera?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar <strong>{deleteTarget?.nombre}</strong> [{deleteTarget?.codigo}].
              No se puede eliminar si tiene zonas asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDelete}
            >
              Eliminar cabecera
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
