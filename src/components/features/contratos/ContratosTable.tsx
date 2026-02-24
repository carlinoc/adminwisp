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
  CheckCircle, PauseCircle, XCircle, Clock,
} from "lucide-react"
import { eliminarContrato, cambiarEstadoContrato } from "@/server/actions/contratos"
import { formatCurrency, formatDate } from "@/lib/utils"
import { toast } from "sonner"

const ESTADO_CONFIG = {
  ACTIVO:     { color: "bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-400",  Icon: CheckCircle },
  SUSPENDIDO: { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", Icon: PauseCircle },
  CANCELADO:  { color: "bg-red-100    text-red-800    dark:bg-red-900/30    dark:text-red-400",    Icon: XCircle },
  PENDIENTE:  { color: "bg-blue-100   text-blue-800   dark:bg-blue-900/30   dark:text-blue-400",   Icon: Clock },
}

type Contrato = {
  id: string
  estado: string
  fechaContrato: string
  fechaInicioServicio: string | null
  montoActual: number
  cicloFacturacion: number
  cliente: {
    id: string
    codigoCliente: string | null
    persona: { nombres: string; apellidos: string | null }
  }
  tarifaPlan: { nombrePlan: string; velocidadDescarga: string; velocidadSubida: string }
  ubicacionInstalacion: { direccion: string }
  _count: { pagos: number; facturas: number }
}

export default function ContratosTable({ contratos }: { contratos: Contrato[] }) {
  const [pendingId,    setPendingId]    = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Contrato | null>(null)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setPendingId(deleteTarget.id)
    const result = await eliminarContrato(deleteTarget.id)
    setPendingId(null)
    setDeleteTarget(null)
    result.success ? toast.success("Contrato eliminado") : toast.error(result.error ?? "Error")
  }

  const handleEstado = async (id: string, estado: string) => {
    setPendingId(id)
    const result = await cambiarEstadoContrato(id, estado as "ACTIVO"|"SUSPENDIDO"|"CANCELADO"|"PENDIENTE")
    setPendingId(null)
    result.success ? toast.success("Estado actualizado") : toast.error(result.error ?? "Error")
  }

  if (contratos.length === 0)
    return <div className="text-center py-12 text-muted-foreground">No se encontraron contratos</div>

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Instalación</TableHead>
              <TableHead className="text-right">Monto/mes</TableHead>
              <TableHead className="text-center">Ciclo</TableHead>
              <TableHead className="text-center">Estado</TableHead>
              <TableHead>Inicio</TableHead>
              <TableHead className="text-center">Pagos</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contratos.map((c) => {
              const cfg = ESTADO_CONFIG[c.estado as keyof typeof ESTADO_CONFIG] ?? ESTADO_CONFIG.PENDIENTE
              const Icon = cfg.Icon
              return (
                <TableRow key={c.id}
                  className={pendingId === c.id ? "opacity-50 pointer-events-none" : ""}>
                  <TableCell>
                    <Link href={`/dashboard/clientes/${c.cliente.id}`}
                      className="hover:underline">
                      <p className="font-medium text-sm">
                        {c.cliente.persona.nombres} {c.cliente.persona.apellidos ?? ""}
                      </p>
                      <p className="text-xs text-muted-foreground">{c.cliente.codigoCliente ?? "—"}</p>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">{c.tarifaPlan.nombrePlan}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.tarifaPlan.velocidadDescarga}↓ / {c.tarifaPlan.velocidadSubida}↑
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="text-xs text-muted-foreground max-w-[160px] truncate">
                      {c.ubicacionInstalacion.direccion}
                    </p>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-bold text-green-600">{formatCurrency(c.montoActual)}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-xs text-muted-foreground">Día {c.cicloFacturacion}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className={`${cfg.color} flex items-center gap-1 w-fit mx-auto text-xs`}>
                      <Icon className="h-3 w-3" />{c.estado}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {c.fechaInicioServicio ? formatDate(c.fechaInicioServicio) : "—"}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary"
                      className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs">
                      {c._count.pagos}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={pendingId === c.id}>
                          {pendingId === c.id
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <MoreHorizontal className="h-4 w-4" />}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/contratos/${c.id}`}>
                            <Eye className="mr-2 h-4 w-4" />Ver detalle
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/contratos/${c.id}/editar`}>
                            <Pencil className="mr-2 h-4 w-4" />Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                          Cambiar estado
                        </DropdownMenuLabel>
                        {(["ACTIVO","SUSPENDIDO","CANCELADO","PENDIENTE"] as const)
                          .filter((e) => e !== c.estado)
                          .map((estado) => {
                            const ec = ESTADO_CONFIG[estado]
                            const EIcon = ec.Icon
                            return (
                              <DropdownMenuItem key={estado}
                                onClick={() => handleEstado(c.id, estado)}>
                                <EIcon className={`mr-2 h-4 w-4`} />{estado}
                              </DropdownMenuItem>
                            )
                          })}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50"
                          onClick={() => setDeleteTarget(c)}
                          disabled={c._count.pagos > 0 || c._count.facturas > 0}>
                          <Trash2 className="mr-2 h-4 w-4" />Eliminar
                        </DropdownMenuItem>
                        {(c._count.pagos > 0 || c._count.facturas > 0) && (
                          <p className="px-2 pb-1 text-xs text-muted-foreground">Tiene pagos/facturas — no eliminable</p>
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
            <AlertDialogTitle>¿Eliminar contrato?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar el contrato de{" "}
              <strong>
                {deleteTarget?.cliente.persona.nombres} {deleteTarget?.cliente.persona.apellidos}
              </strong>{" "}
              — plan <strong>{deleteTarget?.tarifaPlan.nombrePlan}</strong>.
              Solo se puede eliminar si no tiene pagos ni facturas.
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
