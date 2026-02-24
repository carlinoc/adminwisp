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
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  MoreHorizontal, Eye, Pencil, Trash2, Loader2,
  Clock, PlayCircle, CheckCircle2, XCircle,
} from "lucide-react"
import { eliminarPedido, cambiarEstadoPedido } from "@/server/actions/pedidos"
import { formatDate } from "@/lib/utils"
import { toast } from "sonner"

const ESTADO_CONFIG = {
  PENDIENTE:  { color: "bg-blue-100   text-blue-800   dark:bg-blue-900/30  dark:text-blue-400",   Icon: Clock        },
  EN_PROCESO: { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", Icon: PlayCircle   },
  COMPLETADO: { color: "bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-400",  Icon: CheckCircle2 },
  CANCELADO:  { color: "bg-red-100    text-red-800    dark:bg-red-900/30    dark:text-red-400",    Icon: XCircle      },
}
const PRIORIDAD_CONFIG: Record<string, { label: string; color: string }> = {
  BAJA:    { label: "Baja",    color: "bg-slate-100  text-slate-600  dark:bg-slate-800 dark:text-slate-400" },
  NORMAL:  { label: "Normal",  color: "bg-blue-100   text-blue-700   dark:bg-blue-900/30 dark:text-blue-400" },
  MEDIA:   { label: "Media",   color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  ALTA:    { label: "Alta",    color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  URGENTE: { label: "Urgente", color: "bg-red-100    text-red-700    dark:bg-red-900/30 dark:text-red-400" },
}

type Pedido = {
  id: string
  numero: string
  estado: string
  fechaSolicitud: string
  motivoCancelacion: string | null
  cliente: { id: string; persona: { nombres: string; apellidos: string | null }; codigoCliente: string | null }
  tipoPedido: { nombre: string; prioridadDefault: string }
  empleadoReceptor: { persona: { nombres: string; apellidos: string | null } }
}

export default function PedidosTable({ pedidos }: { pedidos: Pedido[] }) {
  const [pendingId,    setPendingId]    = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Pedido | null>(null)
  const [cancelTarget, setCancelTarget] = useState<Pedido | null>(null)
  const [motivo,       setMotivo]       = useState("")

  const handleDelete = async () => {
    if (!deleteTarget) return
    setPendingId(deleteTarget.id)
    const result = await eliminarPedido(deleteTarget.id)
    setPendingId(null)
    setDeleteTarget(null)
    result.success ? toast.success("Pedido eliminado") : toast.error(result.error ?? "Error")
  }

  const handleEstado = async (id: string, estado: "PENDIENTE"|"EN_PROCESO"|"COMPLETADO"|"CANCELADO") => {
    setPendingId(id)
    const result = await cambiarEstadoPedido(id, estado)
    setPendingId(null)
    result.success ? toast.success("Estado actualizado") : toast.error(result.error ?? "Error")
  }

  const handleCancelar = async () => {
    if (!cancelTarget || !motivo.trim()) return
    setPendingId(cancelTarget.id)
    const result = await cambiarEstadoPedido(cancelTarget.id, "CANCELADO", motivo)
    setPendingId(null)
    setCancelTarget(null)
    setMotivo("")
    result.success ? toast.success("Pedido cancelado") : toast.error(result.error ?? "Error")
  }

  if (pedidos.length === 0)
    return <div className="text-center py-12 text-muted-foreground">No se encontraron pedidos</div>

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-center">Prioridad</TableHead>
              <TableHead className="text-center">Estado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Receptor</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pedidos.map((p) => {
              const eCfg = ESTADO_CONFIG[p.estado as keyof typeof ESTADO_CONFIG] ?? ESTADO_CONFIG.PENDIENTE
              const pCfg = PRIORIDAD_CONFIG[p.tipoPedido.prioridadDefault] ?? PRIORIDAD_CONFIG.NORMAL
              const Icon = eCfg.Icon
              return (
                <TableRow key={p.id}
                  className={pendingId === p.id ? "opacity-50 pointer-events-none" : ""}>
                  <TableCell>
                    <Link href={`/dashboard/pedidos/${p.id}`}
                      className="font-mono text-xs font-semibold text-blue-600 hover:underline">
                      {p.numero}
                    </Link>
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
                    <p className="text-sm">{p.tipoPedido.nombre}</p>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className={`${pCfg.color} text-xs`}>
                      {pCfg.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary"
                      className={`${eCfg.color} flex items-center gap-1 w-fit mx-auto text-xs`}>
                      <Icon className="h-3 w-3" />
                      {p.estado.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(p.fechaSolicitud)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {p.empleadoReceptor.persona.nombres} {p.empleadoReceptor.persona.apellidos ?? ""}
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
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/pedidos/${p.id}`}>
                            <Eye className="mr-2 h-4 w-4" />Ver detalle
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/pedidos/${p.id}/editar`}>
                            <Pencil className="mr-2 h-4 w-4" />Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                          Cambiar estado
                        </DropdownMenuLabel>
                        {(["PENDIENTE","EN_PROCESO","COMPLETADO"] as const)
                          .filter((e) => e !== p.estado)
                          .map((estado) => {
                            const ec = ESTADO_CONFIG[estado]
                            const EIcon = ec.Icon
                            return (
                              <DropdownMenuItem key={estado}
                                onClick={() => handleEstado(p.id, estado)}>
                                <EIcon className="mr-2 h-4 w-4" />
                                {estado.replace("_", " ")}
                              </DropdownMenuItem>
                            )
                          })}
                        {p.estado !== "CANCELADO" && (
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50"
                            onClick={() => { setCancelTarget(p); setMotivo("") }}>
                            <XCircle className="mr-2 h-4 w-4" />Cancelar pedido
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50"
                          onClick={() => setDeleteTarget(p)}
                          disabled={p.estado === "EN_PROCESO"}>
                          <Trash2 className="mr-2 h-4 w-4" />Eliminar
                        </DropdownMenuItem>
                        {p.estado === "EN_PROCESO" && (
                          <p className="px-2 pb-1 text-xs text-muted-foreground">
                            En proceso — cancela primero
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

      {/* Dialog cancelar con motivo */}
      <Dialog open={!!cancelTarget} onOpenChange={(o) => { if (!o) { setCancelTarget(null); setMotivo("") } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar pedido {cancelTarget?.numero}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Motivo de cancelación *</Label>
            <Textarea rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)}
              placeholder="Describe el motivo de la cancelación…"
              className="dark:bg-slate-950 resize-none" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCancelTarget(null); setMotivo("") }}>
              Volver
            </Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white"
              disabled={!motivo.trim() || !!pendingId}
              onClick={handleCancelar}>
              {pendingId ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirmar cancelación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog eliminar */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar el pedido <strong>{deleteTarget?.numero}</strong>.
              Esta acción no se puede deshacer.
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
