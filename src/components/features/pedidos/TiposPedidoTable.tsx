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
import { MoreHorizontal, Pencil, Trash2, Loader2, ShieldCheck, Shield } from "lucide-react"
import { eliminarTipoPedido } from "@/server/actions/tipoPedido"
import { toast } from "sonner"

const PRIORIDAD_CONFIG: Record<string, { label: string; color: string }> = {
  BAJA:    { label: "Baja",    color: "bg-slate-100  text-slate-700  dark:bg-slate-800  dark:text-slate-300" },
  NORMAL:  { label: "Normal",  color: "bg-blue-100   text-blue-700   dark:bg-blue-900/30 dark:text-blue-400" },
  MEDIA:   { label: "Media",   color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  ALTA:    { label: "Alta",    color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  URGENTE: { label: "Urgente", color: "bg-red-100    text-red-700    dark:bg-red-900/30  dark:text-red-400" },
}

type TipoPedido = {
  id: string
  nombre: string
  descripcion: string | null
  prioridadDefault: string
  requiereAprobacion: boolean
  _count: { pedidos: number }
}

export default function TiposPedidoTable({ tipos }: { tipos: TipoPedido[] }) {
  const [pendingId,    setPendingId]    = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TipoPedido | null>(null)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setPendingId(deleteTarget.id)
    const result = await eliminarTipoPedido(deleteTarget.id)
    setPendingId(null)
    setDeleteTarget(null)
    result.success ? toast.success("Tipo eliminado") : toast.error(result.error ?? "Error")
  }

  if (tipos.length === 0)
    return (
      <div className="text-center py-12 text-muted-foreground">
        No hay tipos de pedido registrados
      </div>
    )

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-center">Prioridad default</TableHead>
              <TableHead className="text-center">Aprobación</TableHead>
              <TableHead className="text-center">Pedidos</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tipos.map((t) => {
              const pCfg = PRIORIDAD_CONFIG[t.prioridadDefault] ?? PRIORIDAD_CONFIG.NORMAL
              return (
                <TableRow key={t.id}
                  className={pendingId === t.id ? "opacity-50 pointer-events-none" : ""}>
                  <TableCell>
                    <p className="font-semibold text-sm">{t.nombre}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-muted-foreground max-w-xs truncate">
                      {t.descripcion ?? "—"}
                    </p>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className={pCfg.color}>
                      {pCfg.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {t.requiereAprobacion
                      ? <span className="flex items-center justify-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                          <ShieldCheck className="h-3.5 w-3.5" />Sí
                        </span>
                      : <span className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                          <Shield className="h-3.5 w-3.5" />No
                        </span>}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary"
                      className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {t._count.pedidos}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={pendingId === t.id}>
                          {pendingId === t.id
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <MoreHorizontal className="h-4 w-4" />}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/pedidos/tipos/${t.id}/editar`}>
                            <Pencil className="mr-2 h-4 w-4" />Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50"
                          onClick={() => setDeleteTarget(t)}
                          disabled={t._count.pedidos > 0}>
                          <Trash2 className="mr-2 h-4 w-4" />Eliminar
                        </DropdownMenuItem>
                        {t._count.pedidos > 0 && (
                          <p className="px-2 pb-1 text-xs text-muted-foreground">
                            Tiene pedidos — no eliminable
                          </p>
                        )}
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
            <AlertDialogTitle>¿Eliminar tipo de pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar <strong>{deleteTarget?.nombre}</strong>.
              Solo es posible si no tiene pedidos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
