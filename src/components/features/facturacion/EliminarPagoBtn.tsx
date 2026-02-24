"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Trash2, Loader2 } from "lucide-react"
import { eliminarPago } from "@/server/actions/pagos"
import { formatCurrency } from "@/lib/utils"
import { toast } from "sonner"

export default function EliminarPagoBtn({
  pagoId,
  monto,
}: {
  pagoId: string
  monto:  number
}) {
  const router = useRouter()
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    const result = await eliminarPago(pagoId)
    setLoading(false)
    if (result.error) {
      toast.error(result.error)
      setOpen(false)
      return
    }
    toast.success("Pago eliminado y saldos revertidos correctamente")
    router.push("/dashboard/facturacion/pagos")
    router.refresh()
  }

  return (
    <>
      <Button
        variant="outline"
        className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30"
        onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4 mr-2" />
        Eliminar pago
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este pago?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el pago de <strong>{formatCurrency(monto)}</strong>.
              Los saldos de todas las facturas a las que fue aplicado serán
              revertidos automáticamente. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={loading}
              onClick={handleDelete}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Eliminar y revertir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
