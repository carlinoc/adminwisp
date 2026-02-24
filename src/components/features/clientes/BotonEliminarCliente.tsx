"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash2, Loader2 } from "lucide-react"
import { eliminarCliente } from "@/server/actions/clientes"
import { toast } from "sonner"

export function BotonEliminarCliente({ id, nombre }: { id: string, nombre: string }) {
  const [isPending, setIsPending] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`¿Estás seguro de eliminar al cliente ${nombre}?`)) return

    setIsPending(true)
    const result = await eliminarCliente(id)
    setIsPending(false)

    if (result.success) {
      toast.success("Cliente eliminado con éxito")
    } else {
      toast.error(result.error || "No se pudo eliminar")
    }
  }

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={handleDelete}
      disabled={isPending}
      className="text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20"
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </Button>
  )
}