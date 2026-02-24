import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import ZonaForm from "@/components/features/zonas/ZonaForm"

export default async function EditarZonaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [zona, cabeceras] = await Promise.all([
    prisma.zona.findUnique({ where: { id } }),
    prisma.cabecera.findMany({
      select: { id: true, codigo: true, nombre: true },
      orderBy: { codigo: "asc" },
    }),
  ])

  if (!zona) notFound()

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/zonas/${id}`}>
          <Button variant="ghost" size="icon" className="dark:hover:bg-slate-800">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Editar Zona</h1>
          <p className="text-muted-foreground font-mono text-sm mt-0.5">
            {zona.codigo} — {zona.nombre}
          </p>
        </div>
      </div>

      <Card className="dark:bg-slate-900/50">
        <CardHeader><CardTitle>Datos de la Zona</CardTitle></CardHeader>
        <CardContent>
          <ZonaForm cabeceras={cabeceras} initialData={zona} />
        </CardContent>
      </Card>
    </div>
  )
}
