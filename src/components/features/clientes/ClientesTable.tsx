"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import { ESTADO_COLORS } from "@/lib/utils"

type Cliente = {
  id: string
  codigoCliente: string | null
  estadoConexion: string
  fechaAlta: Date
  saldoFavor: number
  persona: {
    nombres: string
    apellidos: string | null
    dni: string | null
    email: string | null
    telefono: string | null
  }
  zona: {
    nombre: string
  } | null
  vendedor: {
    nombres: string
    apellidos: string | null
  } | null
}

export default function ClientesTable({ clientes }: { clientes: Cliente[] }) {
  if (clientes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No se encontraron clientes</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>DNI</TableHead>
            <TableHead>Contacto</TableHead>
            <TableHead>Zona</TableHead>
            <TableHead>Vendedor</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Fecha Alta</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clientes.map((cliente) => (
            <TableRow key={cliente.id}>
              <TableCell className="font-medium">
                {cliente.codigoCliente || "Sin código"}
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">
                    {cliente.persona.nombres} {cliente.persona.apellidos}
                  </p>
                  <p className="text-sm text-gray-500">{cliente.persona.email}</p>
                </div>
              </TableCell>
              <TableCell>{cliente.persona.dni || "-"}</TableCell>
              <TableCell>{cliente.persona.telefono || "-"}</TableCell>
              <TableCell>{cliente.zona?.nombre || "Sin zona"}</TableCell>
              <TableCell>
                {cliente.vendedor
                  ? `${cliente.vendedor.nombres} ${cliente.vendedor.apellidos || ""}`
                  : "-"}
              </TableCell>
              <TableCell>
                <Badge
                  className={
                    ESTADO_COLORS[cliente.estadoConexion as keyof typeof ESTADO_COLORS] ||
                    "bg-gray-100 text-gray-800"
                  }
                  variant="secondary"
                >
                  {cliente.estadoConexion}
                </Badge>
              </TableCell>
              <TableCell>
                {new Date(cliente.fechaAlta).toLocaleDateString("es-PE")}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/clientes/${cliente.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Detalles
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/clientes/${cliente.id}/editar`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">
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
  )
}