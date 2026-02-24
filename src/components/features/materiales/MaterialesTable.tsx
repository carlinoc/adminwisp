"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
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
import { MoreHorizontal, Eye, Pencil, Trash2, Loader2, RotateCcw, Package2 } from "lucide-react"
import { eliminarMaterial } from "@/server/actions/materiales"
import { toast } from "sonner"

const CAT_COLORS: Record<string, string> = {
  Equipos:     "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  Cables:      "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  Conectores:  "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  Herramientas:"bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  Accesorios:  "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  Consumibles: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Otros:       "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
}

type Material = {
  id: string
  nombre: string
  descripcion: string | null
  marca: string | null
  modelo: string | null
  unidadMedida: string
  categoria: string
  requiereDevolucion: boolean
  inventarios: { cantidadDisponible: number; puntoReorden: number }[]
  _count: { materialesAsignados: number }
}

export default function MaterialesTable({ materiales }: { materiales: Material[] }) {
  const [pendingId,    setPendingId]    = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Material | null>(null)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setPendingId(deleteTarget.id)
    const result = await eliminarMaterial(deleteTarget.id)
    setPendingId(null)
    setDeleteTarget(null)
    result.success ? toast.success("Material eliminado") : toast.error(result.error ?? "Error al eliminar")
  }

  if (materiales.length === 0)
    return <div className="text-center py-12 text-muted-foreground">No se encontraron materiales</div>

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Material</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Unidad</TableHead>
              <TableHead className="text-center">Stock</TableHead>
              <TableHead className="text-center">Reorden</TableHead>
              <TableHead className="text-center">Asignaciones</TableHead>
              <TableHead className="text-center">Devolución</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {materiales.map((m) => {
              const inv = m.inventarios[0]
              const stock = inv?.cantidadDisponible ?? 0
              const reorden = inv?.puntoReorden ?? 0
              const stockBajo = stock <= reorden && reorden > 0
              const sinStock  = stock === 0

              return (
                <TableRow key={m.id} className={pendingId === m.id ? "opacity-50 pointer-events-none" : ""}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-muted">
                        <Package2 className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{m.nombre}</p>
                        <p className="text-xs text-muted-foreground">
                          {[m.marca, m.modelo].filter(Boolean).join(" · ") || "—"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={CAT_COLORS[m.categoria] ?? CAT_COLORS.Otros}>
                      {m.categoria}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{m.unidadMedida}</TableCell>
                  <TableCell className="text-center">
                    <span className={`font-bold text-sm ${sinStock ? "text-red-600" : stockBajo ? "text-yellow-600" : "text-green-600 dark:text-green-400"}`}>
                      {stock}
                    </span>
                  </TableCell>
                  <TableCell className="text-center text-sm text-muted-foreground">{reorden}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {m._count.materialesAsignados}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {m.requiereDevolucion
                      ? <RotateCcw className="h-4 w-4 text-blue-500 mx-auto" />
                      : <span className="text-muted-foreground text-xs">—</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={pendingId === m.id}>
                          {pendingId === m.id
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <MoreHorizontal className="h-4 w-4" />}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/materiales/lista/${m.id}`}>
                            <Eye className="mr-2 h-4 w-4" />Ver detalle
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/materiales/lista/${m.id}/editar`}>
                            <Pencil className="mr-2 h-4 w-4" />Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50"
                          onClick={() => setDeleteTarget(m)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar material?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar <strong>{deleteTarget?.nombre}</strong> junto con su registro de inventario.
              No se puede eliminar si tiene asignaciones registradas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
