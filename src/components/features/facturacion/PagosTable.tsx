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
import { MoreHorizontal, Eye, Trash2, Loader2, CreditCard } from "lucide-react"
import { eliminarPago } from "@/server/actions/pagos"
import { formatCurrency, formatDate } from "@/lib/utils"
import { toast } from "sonner"

const TIPO_PAGO_COLOR: Record<string, string> = {
  EFECTIVO:      "bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-400",
  TRANSFERENCIA: "bg-blue-100   text-blue-800   dark:bg-blue-900/30   dark:text-blue-400",
  TARJETA:       "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  YAPE:          "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400",
  PLIN:          "bg-cyan-100   text-cyan-800   dark:bg-cyan-900/30   dark:text-cyan-400",
}

type Pago = {
  id: string
  fechaPago: string
  montoPagado: number
  tipoPago: string
  masDetalles: string | null
  cliente: {
    id: string
    codigoCliente: string | null
    persona: { nombres: string; apellidos: string | null }
  }
  contrato: { tarifaPlan: { nombrePlan: string } }
  _count: { detallesPagoFactura: number }
}

export default function PagosTable({ pagos }: { pagos: Pago[] }) {
  const [pendingId,    setPendingId]    = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Pago | null>(null)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setPendingId(deleteTarget.id)
    const result = await eliminarPago(deleteTarget.id)
    setPendingId(null)
    setDeleteTarget(null)
    result.success ? toast.success("Pago eliminado y saldos revertidos") : toast.error(result.error ?? "Error")
  }

  if (pagos.length === 0)
    return <div className="text-center py-12 text-muted-foreground">No se encontraron pagos</div>

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead className="text-center">Tipo</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead className="text-center">Facturas aplicadas</TableHead>
              <TableHead>Detalles</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagos.map((p) => (
              <TableRow key={p.id}
                className={pendingId === p.id ? "opacity-50 pointer-events-none" : ""}>
                <TableCell>
                  <span className="text-sm font-medium">{formatDate(p.fechaPago)}</span>
                </TableCell>
                <TableCell>
                  <Link href={`/dashboard/clientes/${p.cliente.id}`}
                    className="hover:underline">
                    <p className="font-medium text-sm">
                      {p.cliente.persona.nombres} {p.cliente.persona.apellidos ?? ""}
                    </p>
                    <p className="text-xs text-muted-foreground">{p.cliente.codigoCliente ?? "—"}</p>
                  </Link>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {p.contrato.tarifaPlan.nombrePlan}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary"
                    className={`${TIPO_PAGO_COLOR[p.tipoPago] ?? ""} text-xs`}>
                    {p.tipoPago}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-bold text-green-600">{formatCurrency(p.montoPagado)}</span>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary"
                    className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {p._count.detallesPagoFactura}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground truncate max-w-[120px] block">
                    {p.masDetalles ?? "—"}
                  </span>
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
                        <Link href={`/dashboard/facturacion/pagos/${p.id}`}>
                          <Eye className="mr-2 h-4 w-4" />Ver detalle
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50"
                        onClick={() => setDeleteTarget(p)}>
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
            <AlertDialogTitle>¿Eliminar pago?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar el pago de{" "}
              <strong>{formatCurrency(deleteTarget?.montoPagado ?? 0)}</strong>{" "}
              de{" "}
              <strong>
                {deleteTarget?.cliente.persona.nombres}{" "}
                {deleteTarget?.cliente.persona.apellidos}
              </strong>.
              Los saldos de las facturas aplicadas serán revertidos automáticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDelete}>
              Eliminar y revertir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
