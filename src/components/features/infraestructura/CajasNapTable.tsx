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
  Wifi, MapPin, Zap,
} from "lucide-react"
import { eliminarCajaNap } from "@/server/actions/cajaNap"
import { toast } from "sonner"

type CajaNap = {
  id: string
  splitterInstalado: string | null
  capacidadPuertosTotal: number
  puertosUtilizados: number
  direccion: string | null
  latitud: number | null
  longitud: number | null
  puertoAlimentadorId: string | null
  zona: { codigo: string; nombre: string; cabecera: { nombre: string } }
  _count: { puertos: number }
}

export default function CajasNapTable({ cajas }: { cajas: CajaNap[] }) {
  const [pendingId,    setPendingId]    = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CajaNap | null>(null)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setPendingId(deleteTarget.id)
    const result = await eliminarCajaNap(deleteTarget.id)
    setPendingId(null)
    setDeleteTarget(null)
    result.success
      ? toast.success("Caja NAP eliminada correctamente")
      : toast.error(result.error ?? "Error al eliminar")
  }

  if (cajas.length === 0)
    return (
      <div className="text-center py-12 text-muted-foreground">
        No se encontraron cajas NAP
      </div>
    )

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Zona / Cabecera</TableHead>
              <TableHead>Dirección</TableHead>
              <TableHead>Splitter</TableHead>
              <TableHead className="text-center">Puertos</TableHead>
              <TableHead className="text-center">Ocupación</TableHead>
              <TableHead className="text-center">GPS</TableHead>
              <TableHead className="text-center">Tipo</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cajas.map((c) => {
              const libre      = c.capacidadPuertosTotal - c.puertosUtilizados
              const pct        = c.capacidadPuertosTotal > 0
                ? Math.round((c.puertosUtilizados / c.capacidadPuertosTotal) * 100)
                : 0
              const colorOcup  = pct >= 90 ? "text-red-600" : pct >= 70 ? "text-yellow-600" : "text-green-600 dark:text-green-400"
              const barColor   = pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-yellow-500" : "bg-green-500"

              return (
                <TableRow key={c.id}
                  className={pendingId === c.id ? "opacity-50 pointer-events-none" : ""}>
                  <TableCell>
                    <p className="font-medium text-sm">{c.zona.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      [{c.zona.codigo}] · {c.zona.cabecera.nombre}
                    </p>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm flex items-start gap-1">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{c.direccion ?? "—"}</span>
                    </span>
                  </TableCell>
                  <TableCell>
                    {c.splitterInstalado
                      ? <Badge variant="secondary">{c.splitterInstalado}</Badge>
                      : <span className="text-muted-foreground text-sm">—</span>}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-bold">{c.capacidadPuertosTotal}</span>
                    <span className="text-muted-foreground text-xs ml-1">
                      ({libre} libres)
                    </span>
                  </TableCell>
                  <TableCell className="text-center min-w-[110px]">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`text-xs font-bold ${colorOcup}`}>{pct}%</span>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${barColor}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {c.puertosUtilizados}/{c.capacidadPuertosTotal}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {c.latitud && c.longitud
                      ? <span className="text-xs text-green-600 dark:text-green-400 font-medium">✓ GPS</span>
                      : <span className="text-muted-foreground text-xs">—</span>}
                  </TableCell>
                  <TableCell className="text-center">
                    {c.puertoAlimentadorId
                      ? <span className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 justify-center">
                          <Zap className="h-3 w-3" />Hija
                        </span>
                      : <span className="text-xs text-muted-foreground flex items-center gap-1 justify-center">
                          <Wifi className="h-3 w-3" />Principal
                        </span>}
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
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/infraestructura/cajas/${c.id}`}>
                            <Eye className="mr-2 h-4 w-4" />Ver puertos
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/infraestructura/cajas/${c.id}/editar`}>
                            <Pencil className="mr-2 h-4 w-4" />Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50"
                          onClick={() => setDeleteTarget(c)}
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
            <AlertDialogTitle>¿Eliminar caja NAP?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar la caja NAP de <strong>{deleteTarget?.zona.nombre}</strong>
              {deleteTarget?.direccion ? ` en "${deleteTarget.direccion}"` : ""}. Se eliminarán
              todos sus puertos. No se puede eliminar si tiene clientes o cajas hijas asignadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDelete}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
