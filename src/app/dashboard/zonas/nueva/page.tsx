import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import ZonaForm from "@/components/features/zonas/ZonaForm"

export default async function NuevaZonaPage({
  searchParams,
}: {
  searchParams: Promise<{ cabeceraId?: string }>
}) {
  const params = await searchParams
  const cabeceras = await prisma.cabecera.findMany({
    select: { id: true, codigo: true, nombre: true },
    orderBy: { codigo: "asc" },
  })

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/zonas">
          <Button variant="ghost" size="icon" className="dark:hover:bg-slate-800">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Nueva Zona</h1>
          <p className="text-muted-foreground mt-1">Registra una nueva zona de cobertura</p>
        </div>
      </div>

      <Card className="dark:bg-slate-900/50">
        <CardHeader>
          <CardTitle>Datos de la Zona</CardTitle>
        </CardHeader>
        <CardContent>
          <ZonaForm cabeceras={cabeceras} defaultCabeceraId={params.cabeceraId} />
        </CardContent>
      </Card>
    </div>
  )
}
