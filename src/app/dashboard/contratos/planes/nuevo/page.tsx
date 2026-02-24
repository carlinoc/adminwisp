import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import TarifaPlanForm from "@/components/features/contratos/TarifaPlanForm"

export default function NuevoPlanPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/contratos/planes">
          <Button variant="ghost" size="icon" className="dark:hover:bg-slate-800">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Nuevo Plan de Tarifa</h1>
          <p className="text-muted-foreground mt-1">Define velocidades, precio y comisión de venta.</p>
        </div>
      </div>
      <Card className="dark:bg-slate-900/50">
        <CardHeader><CardTitle>Datos del Plan</CardTitle></CardHeader>
        <CardContent><TarifaPlanForm /></CardContent>
      </Card>
    </div>
  )
}
