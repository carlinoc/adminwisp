import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import CajaNapForm from "@/components/features/infraestructura/CajaNapForm"

export default async function NuevaCajaNapPage() {
  const [zonas, puertosLibres] = await Promise.all([
    prisma.zona.findMany({
      where: { esActivo: true },
      select: { id: true, codigo: true, nombre: true, cabecera: { select: { nombre: true } } },
      orderBy: [{ cabecera: { nombre: "asc" } }, { nombre: "asc" }],
    }),
    prisma.puerto.findMany({
      where: {
        estado: "DISPONIBLE",
        // Puerto disponible que no tenga ya una caja hija alimentada
        cajasNapAlimentadas: { none: {} },
      },
      include: {
        cajaNap: {
          select: {
            direccion: true,
            zona: { select: { nombre: true } },
          },
        },
      },
      orderBy: [{ cajaNap: { zona: { nombre: "asc" } } }, { numeroPuerto: "asc" }],
    }),
  ])

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/infraestructura/cajas">
          <Button variant="ghost" size="icon" className="dark:hover:bg-slate-800">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Nueva Caja NAP</h1>
          <p className="text-muted-foreground mt-1">
            Los puertos se crean automáticamente según la capacidad definida.
          </p>
        </div>
      </div>

      <Card className="dark:bg-slate-900/50">
        <CardHeader><CardTitle>Datos de la Caja NAP</CardTitle></CardHeader>
        <CardContent>
          <CajaNapForm zonas={zonas} puertosLibres={puertosLibres} />
        </CardContent>
      </Card>
    </div>
  )
}
