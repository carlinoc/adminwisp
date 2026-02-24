import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import CabeceraForm from "@/components/features/zonas/CabeceraForm"

export default async function NuevaCabeceraPage() {
  // Personas naturales como posibles arrendadores
  const personas = await prisma.persona.findMany({
    where: { tipoEntidad: "NATURAL" },
    select: { id: true, nombres: true, apellidos: true, dni: true },
    orderBy: { nombres: "asc" },
  })

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/zonas/cabeceras">
          <Button variant="ghost" size="icon" className="dark:hover:bg-slate-800">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Nueva Cabecera</h1>
          <p className="text-muted-foreground mt-1">Registra un nodo de cabecera de red</p>
        </div>
      </div>

      <Card className="dark:bg-slate-900/50">
        <CardHeader><CardTitle>Datos de la Cabecera</CardTitle></CardHeader>
        <CardContent>
          <CabeceraForm personas={personas} />
        </CardContent>
      </Card>
    </div>
  )
}
