export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import MaterialForm from "@/components/features/materiales/MaterialForm"

export default async function EditarMaterialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const material = await prisma.material.findUnique({ where: { id } })
  if (!material) notFound()

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/materiales/lista/${id}`}>
          <Button variant="ghost" size="icon" className="dark:hover:bg-slate-800">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Editar Material</h1>
          <p className="text-muted-foreground mt-1">{material.nombre}</p>
        </div>
      </div>
      <Card className="dark:bg-slate-900/50">
        <CardHeader><CardTitle>Datos del Material</CardTitle></CardHeader>
        <CardContent><MaterialForm initialData={material} /></CardContent>
      </Card>
    </div>
  )
}
