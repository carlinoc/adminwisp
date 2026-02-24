import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import PersonalForm from "@/components/features/personal/PersonalForm"

export default function NuevoPersonalPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/personal">
          <Button variant="ghost" size="icon" className="dark:hover:bg-slate-800">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Nuevo Empleado</h1>
          <p className="text-muted-foreground mt-1">
            Registra un nuevo miembro del equipo con sus credenciales de acceso
          </p>
        </div>
      </div>

      <Card className="dark:bg-slate-900/50">
        <CardHeader>
          <CardTitle>Datos del Empleado</CardTitle>
        </CardHeader>
        <CardContent>
          <PersonalForm />
        </CardContent>
      </Card>
    </div>
  )
}
