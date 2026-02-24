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
  CheckCircle2, Clock, AlertTriangle,
} from "lucide-react"
import { eliminarFactura } from "@/server/actions/facturas"
import { formatCurrency, formatDate } from "@/lib/utils"
import { toast } from "sonner"

type Factura = {
  id: string
  periodoFacturado: string
  fechaVencimiento: string
  montoTotal: number
  saldoPendiente: number
  contrato: {
    id: string
    cliente: {
      id: string
      codigoCliente: string | null
      persona: { nombres: string; apellidos: string | null }
    }
    tarifaPlan: { nombrePlan: string }
  }
  _count: { detallesPagoFactura: number }
}

function getEstadoFactura(factura: Factura) {
  if (factura.saldoPendiente <= 0)
    return { label: "Pagada",   color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",  Icon: CheckCircle2 }
  const hoy     = new Date()
  const vence   = new Date(factura.fechaVencimiento)
  const diasRestantes = Math.ceil((vence.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
  if (diasRestantes < 0)
    return { label: "Vencida",  color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",          Icon: AlertTriangle }
  if (diasRestantes <= 5)
    return { label: "Por vencer", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400", Icon: AlertTriangle }
  return   { label: "Pendiente", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",      Icon: Clock }
}

export default function FacturasTable({ facturas }: { facturas: Factura[] }) {
  const [pendingId,    setPendingId]    = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Factura | null>(null)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setPendingId(deleteTarget.id)
    const result = await eliminarFactura(deleteTarget.id)
    setPendingId(null)
    setDeleteTarget(null)
    result.success ? toast.success("Factura eliminada") : toast.error(result.error ?? "Error")
  }

  if (facturas.length === 0)
    return <div className="text-center py-12 text-muted-foreground">No se encontraron facturas</div>

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Saldo pendiente</TableHead>
              <TableHead className="text-center">Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {facturas.map((f) => {
              const estado = getEstadoFactura(f)
              const EIcon  = estado.Icon
              return (
                <TableRow key={f.id}
                  className={pendingId === f.id ? "opacity-50 pointer-events-none" : ""}>
                  <TableCell>
                    <Link href={`/dashboard/clientes/${f.contrato.cliente.id}`}
                      className="hover:underline">
                      <p className="font-medium text-sm">
                        {f.contrato.cliente.persona.nombres} {f.contrato.cliente.persona.apellidos ?? ""}
                      </p>
                      <p className="text-xs text-muted-foreground">{f.contrato.cliente.codigoCliente ?? "—"}</p>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{f.contrato.tarifaPlan.nombrePlan}</p>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">
                      {new Date(f.periodoFacturado + "T12:00:00").toLocaleDateString("es-PE", { year: "numeric", month: "long" })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{formatDate(f.fechaVencimiento)}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-semibold">{formatCurrency(f.montoTotal)}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`font-bold ${f.saldoPendiente <= 0 ? "text-green-600" : "text-orange-600"}`}>
                      {formatCurrency(f.saldoPendiente)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary"
                      className={`${estado.color} flex items-center gap-1 w-fit mx-auto text-xs`}>
                      <EIcon className="h-3 w-3" />{estado.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={pendingId === f.id}>
                          {pendingId === f.id
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <MoreHorizontal className="h-4 w-4" />}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/facturacion/facturas/${f.id}`}>
                            <Eye className="mr-2 h-4 w-4" />Ver detalle
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/facturacion/facturas/${f.id}/editar`}>
                            <Pencil className="mr-2 h-4 w-4" />Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/facturacion/pagos/nuevo?contratoId=${f.contrato.id}&clienteId=${f.contrato.cliente.id}`}>
                            <CheckCircle2 className="mr-2 h-4 w-4" />Registrar pago
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50"
                          onClick={() => setDeleteTarget(f)}
                          disabled={f._count.detallesPagoFactura > 0}>
                          <Trash2 className="mr-2 h-4 w-4" />Eliminar
                        </DropdownMenuItem>
                        {f._count.detallesPagoFactura > 0 && (
                          <p className="px-2 pb-1 text-xs text-muted-foreground">Tiene pagos — no eliminable</p>
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
            <AlertDialogTitle>¿Eliminar factura?</AlertDialogTitle>
            <AlertDialogDescription>
              Factura de{" "}
              <strong>
                {deleteTarget?.contrato.cliente.persona.nombres}{" "}
                {deleteTarget?.contrato.cliente.persona.apellidos}
              </strong>{" "}
              — período{" "}
              {deleteTarget && new Date(deleteTarget.periodoFacturado + "T12:00:00")
                .toLocaleDateString("es-PE", { year: "numeric", month: "long" })}.
              Solo se puede eliminar si no tiene pagos aplicados.
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
