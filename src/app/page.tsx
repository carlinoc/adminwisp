import { redirect } from "next/navigation"

export default function HomePage() {
  // Redirigir directamente al dashboard
  // El middleware se encargará de verificar la autenticación
  redirect("/dashboard")
}