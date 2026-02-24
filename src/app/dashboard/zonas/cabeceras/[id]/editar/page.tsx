export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import CabeceraForm from "@/components/features/zonas/CabeceraForm"

export default async function EditarCabeceraPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [cabecera, personas] = await Promise.all([
    prisma.cabecera.findUnique({ where: { id } }),
    prisma.persona.findMany({
      where: { tipoEntidad: "NATURAL" },
      select: { id: true, nombres: true, apellidos: true, dni: true },
      orderBy: { nombres: "asc" },
    }),
  ])

  if (!cabecera) notFound()

  const initialData = {
    ...cabecera,
    latitud:  cabecera.latitud  ? Number(cabecera.latitud)  : null,
    longitud: cabecera.longitud ? Number(cabecera.longitud) : null,
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/zonas/cabeceras/${id}`}>
          <Button variant="ghost" size="icon" className="dark:hover:bg-slate-800">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Editar Cabecera</h1>
          <p className="text-muted-foreground font-mono text-sm mt-0.5">
            {cabecera.codigo} — {cabecera.nombre}
          </p>
        </div>
      </div>

      <Card className="dark:bg-slate-900/50">
        <CardHeader><CardTitle>Datos de la Cabecera</CardTitle></CardHeader>
        <CardContent>
          <CabeceraForm personas={personas} initialData={initialData} />
        </CardContent>
      </Card>
    </div>
  )
}
