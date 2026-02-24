export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import CajaNapForm from "@/components/features/infraestructura/CajaNapForm"

export default async function EditarCajaNapPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [caja, zonas] = await Promise.all([
    prisma.cajaNap.findUnique({
      where: { id },
      select: {
        id: true,
        zonaId: true,
        splitterInstalado: true,
        capacidadPuertosTotal: true,
        direccion: true,
        latitud: true,
        longitud: true,
        puertoAlimentadorId: true,
      },
    }),
    prisma.zona.findMany({
      where: { esActivo: true },
      select: { id: true, codigo: true, nombre: true, cabecera: { select: { nombre: true } } },
      orderBy: [{ cabecera: { nombre: "asc" } }, { nombre: "asc" }],
    }),
  ])

  if (!caja) notFound()

  // Serializar Decimal
  const initialData = {
    ...caja,
    latitud:  caja.latitud  ? Number(caja.latitud)  : null,
    longitud: caja.longitud ? Number(caja.longitud) : null,
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/infraestructura/cajas/${id}`}>
          <Button variant="ghost" size="icon" className="dark:hover:bg-slate-800">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Editar Caja NAP</h1>
          <p className="text-muted-foreground mt-1">
            La capacidad de puertos no puede modificarse desde aquí. Usa "Agregar puertos" en el detalle.
          </p>
        </div>
      </div>

      <Card className="dark:bg-slate-900/50">
        <CardHeader><CardTitle>Datos de la Caja NAP</CardTitle></CardHeader>
        <CardContent>
          {/* puertosLibres vacío en edición — no se permite cambiar puerto alimentador */}
          <CajaNapForm zonas={zonas} puertosLibres={[]} initialData={initialData} />
        </CardContent>
      </Card>
    </div>
  )
}
