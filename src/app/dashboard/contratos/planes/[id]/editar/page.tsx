export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import TarifaPlanForm from "@/components/features/contratos/TarifaPlanForm"

export default async function EditarPlanPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const plan = await prisma.tarifaPlan.findUnique({ where: { id } })
  if (!plan) notFound()

  const initialData = {
    id:                plan.id,
    nombrePlan:        plan.nombrePlan,
    velocidadDescarga: plan.velocidadDescarga,
    velocidadSubida:   plan.velocidadSubida,
    tarifaMensual:     Number(plan.tarifaMensual),
    comisionVenta:     Number(plan.comisionVenta),
    incluyeTv:         plan.incluyeTv,
    nroTvsBase:        plan.nroTvsBase,
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/contratos/planes">
          <Button variant="ghost" size="icon" className="dark:hover:bg-slate-800">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Editar Plan</h1>
          <p className="text-muted-foreground mt-1">{plan.nombrePlan}</p>
        </div>
      </div>
      <Card className="dark:bg-slate-900/50">
        <CardHeader><CardTitle>Datos del Plan</CardTitle></CardHeader>
        <CardContent><TarifaPlanForm initialData={initialData} /></CardContent>
      </Card>
    </div>
  )
}
