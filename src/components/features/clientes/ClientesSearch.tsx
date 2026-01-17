"use client"

import { useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, X } from "lucide-react"

export default function ClientesSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [estado, setEstado] = useState(searchParams.get("estado") || "")

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (estado) params.set("estado", estado)

    startTransition(() => {
      router.push(`/dashboard/clientes?${params.toString()}`)
    })
  }

  const handleClear = () => {
    setSearch("")
    setEstado("")
    startTransition(() => {
      router.push("/dashboard/clientes")
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="flex-1">
        <Input
          placeholder="Buscar por código, nombre, DNI o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyPress={handleKeyPress}
          className="w-full"
        />
      </div>
      <Select value={estado} onValueChange={setEstado}>
        <SelectTrigger className="w-full md:w-[200px]">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value=" ">Todos los estados</SelectItem>
          <SelectItem value="ACTIVO">Activo</SelectItem>
          <SelectItem value="SUSPENDIDO">Suspendido</SelectItem>
          <SelectItem value="CORTADO">Cortado</SelectItem>
          <SelectItem value="BAJA">Baja</SelectItem>
        </SelectContent>
      </Select>
      <div className="flex gap-2">
        <Button onClick={handleSearch} disabled={isPending}>
          <Search className="h-4 w-4 mr-2" />
          Buscar
        </Button>
        <Button variant="outline" onClick={handleClear} disabled={isPending}>
          <X className="h-4 w-4 mr-2" />
          Limpiar
        </Button>
      </div>
    </div>
  )
}