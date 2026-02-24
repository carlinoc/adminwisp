"use client"

import { useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Search, X } from "lucide-react"

type Cabecera = { id: string; codigo: string; nombre: string }

export default function ZonasSearch({ cabeceras }: { cabeceras: Cabecera[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [search,     setSearch]     = useState(searchParams.get("search") || "")
  const [cabeceraId, setCabeceraId] = useState(searchParams.get("cabeceraId") || "")
  const [estado,     setEstado]     = useState(searchParams.get("estado") || "")

  const apply = (s: string, c: string, e: string) => {
    const params = new URLSearchParams()
    if (s) params.set("search",     s)
    if (c) params.set("cabeceraId", c)
    if (e) params.set("estado",     e)
    startTransition(() => router.push(`/dashboard/zonas?${params.toString()}`))
  }

  const handleClear = () => {
    setSearch(""); setCabeceraId(""); setEstado("")
    startTransition(() => router.push("/dashboard/zonas"))
  }

  return (
    <div className="flex flex-col md:flex-row gap-3">
      <div className="flex-1">
        <Input
          placeholder="Buscar por código o nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply(search, cabeceraId, estado)}
        />
      </div>

      <Select
        value={cabeceraId || "all"}
        onValueChange={(v) => { const val = v === "all" ? "" : v; setCabeceraId(val); apply(search, val, estado) }}
      >
        <SelectTrigger className="w-full md:w-[220px]">
          <SelectValue placeholder="Todas las cabeceras" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las cabeceras</SelectItem>
          {cabeceras.map((c) => (
            <SelectItem key={c.id} value={c.id}>[{c.codigo}] {c.nombre}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={estado || "all"}
        onValueChange={(v) => { const val = v === "all" ? "" : v; setEstado(val); apply(search, cabeceraId, val) }}
      >
        <SelectTrigger className="w-full md:w-[160px]">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="activa">Activas</SelectItem>
          <SelectItem value="inactiva">Inactivas</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex gap-2">
        <Button onClick={() => apply(search, cabeceraId, estado)} disabled={isPending}>
          <Search className="h-4 w-4 mr-2" />Buscar
        </Button>
        <Button variant="outline" onClick={handleClear} disabled={isPending}>
          <X className="h-4 w-4 mr-2" />Limpiar
        </Button>
      </div>
    </div>
  )
}
