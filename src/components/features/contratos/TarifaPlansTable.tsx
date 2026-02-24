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
  MoreHorizontal, Pencil, Trash2, Loader2,
  Tv, Zap, ArrowDown, ArrowUp,
} from "lucide-react"
import { eliminarTarifaPlan } from "@/server/actions/tarifaPlan"
import { formatCurrency } from "@/lib/utils"
import { toast } from "sonner"

type Plan = {
  id: string
  nombrePlan: string
  velocidadDescarga: string
  velocidadSubida: string
  tarifaMensual: number
  comisionVenta: number
  incluyeTv: boolean
  nroTvsBase: number
  _count: { contratos: number }
}

export default function TarifaPlansTable({ planes }: { planes: Plan[] }) {
  const [pendingId,    setPendingId]    = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Plan | null>(null)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setPendingId(deleteTarget.id)
    const result = await eliminarTarifaPlan(deleteTarget.id)
    setPendingId(null)
    setDeleteTarget(null)
    result.success ? toast.success("Plan eliminado") : toast.error(result.error ?? "Error")
  }

  if (planes.length === 0)
    return <div className="text-center py-12 text-muted-foreground">No hay planes de tarifa registrados</div>

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plan</TableHead>
              <TableHead>Velocidad</TableHead>
              <TableHead className="text-right">Tarifa/mes</TableHead>
              <TableHead className="text-right">Comisión</TableHead>
              <TableHead className="text-center">TV</TableHead>
              <TableHead className="text-center">Contratos</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {planes.map((p) => (
              <TableRow key={p.id}
                className={pendingId === p.id ? "opacity-50 pointer-events-none" : ""}>
                <TableCell>
                  <p className="font-semibold text-sm">{p.nombrePlan}</p>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="flex items-center gap-0.5 text-green-600 dark:text-green-400 font-medium">
                      <ArrowDown className="h-3 w-3" />{p.velocidadDescarga}
                    </span>
                    <span className="text-muted-foreground">/</span>
                    <span className="flex items-center gap-0.5 text-blue-600 dark:text-blue-400 font-medium">
                      <ArrowUp className="h-3 w-3" />{p.velocidadSubida}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-bold text-green-600">{formatCurrency(p.tarifaMensual)}</span>
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-sm text-muted-foreground">{formatCurrency(p.comisionVenta)}</span>
                </TableCell>
                <TableCell className="text-center">
                  {p.incluyeTv
                    ? <span className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 justify-center">
                        <Tv className="h-3.5 w-3.5" />{p.nroTvsBase} TV{p.nroTvsBase !== 1 ? "s" : ""}
                      </span>
                    : <span className="text-muted-foreground text-xs">—</span>}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary"
                    className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {p._count.contratos}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={pendingId === p.id}>
                        {pendingId === p.id
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <MoreHorizontal className="h-4 w-4" />}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/contratos/planes/${p.id}/editar`}>
                          <Pencil className="mr-2 h-4 w-4" />Editar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50"
                        onClick={() => setDeleteTarget(p)}
                        disabled={p._count.contratos > 0}>
                        <Trash2 className="mr-2 h-4 w-4" />Eliminar
                      </DropdownMenuItem>
                      {p._count.contratos > 0 && (
                        <p className="px-2 pb-1 text-xs text-muted-foreground">
                          Tiene contratos — no eliminable
                        </p>
                      )}
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
            <AlertDialogTitle>¿Eliminar plan?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar el plan <strong>{deleteTarget?.nombrePlan}</strong>.
              Solo se puede eliminar si no tiene contratos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
