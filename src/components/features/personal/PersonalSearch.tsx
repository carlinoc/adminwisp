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

export default function PersonalSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [rol,    setRol]    = useState(searchParams.get("rol")    || "")
  const [estado, setEstado] = useState(searchParams.get("estado") || "")

  const apply = (s: string, r: string, e: string) => {
    const params = new URLSearchParams()
    if (s) params.set("search", s)
    if (r) params.set("rol",    r)
    if (e) params.set("estado", e)
    startTransition(() => router.push(`/dashboard/personal?${params.toString()}`))
  }

  const handleClear = () => {
    setSearch(""); setRol(""); setEstado("")
    startTransition(() => router.push("/dashboard/personal"))
  }

  return (
    <div className="flex flex-col md:flex-row gap-3">
      <div className="flex-1">
        <Input
          placeholder="Buscar por nombre, DNI o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply(search, rol, estado)}
        />
      </div>

      <Select
        value={rol || "all"}
        onValueChange={(v) => { const val = v === "all" ? "" : v; setRol(val); apply(search, val, estado) }}
      >
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Todos los roles" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los roles</SelectItem>
          <SelectItem value="ADMIN">Administrador</SelectItem>
          <SelectItem value="VENDEDOR">Vendedor</SelectItem>
          <SelectItem value="TECNICO">Técnico</SelectItem>
          <SelectItem value="SOPORTE">Soporte</SelectItem>
          <SelectItem value="CONTADOR">Contador</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={estado || "all"}
        onValueChange={(v) => { const val = v === "all" ? "" : v; setEstado(val); apply(search, rol, val) }}
      >
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Estado de acceso" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los estados</SelectItem>
          <SelectItem value="ACTIVO">Activo</SelectItem>
          <SelectItem value="PENDIENTE">Pendiente</SelectItem>
          <SelectItem value="BLOQUEADO">Bloqueado</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex gap-2">
        <Button onClick={() => apply(search, rol, estado)} disabled={isPending}>
          <Search className="h-4 w-4 mr-2" />Buscar
        </Button>
        <Button variant="outline" onClick={handleClear} disabled={isPending}>
          <X className="h-4 w-4 mr-2" />Limpiar
        </Button>
      </div>
    </div>
  )
}
