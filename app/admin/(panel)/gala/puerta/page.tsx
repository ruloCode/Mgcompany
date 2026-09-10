import { redirect } from "next/navigation"
import { cargarRegistrosGala, perfilActual } from "@/lib/mg/datos"
import { puede, tieneExtra } from "@/lib/mg/permisos"
import EscanerPuerta from "@/components/admin/escaner-puerta"

export const dynamic = "force-dynamic"

export const metadata = { title: "Puerta · Gala MG" }

export default async function PuertaPage() {
  const [registros, perfil] = await Promise.all([cargarRegistrosGala(), perfilActual()])

  // El layout del panel ya comprobó que esta persona ve la sección `gala`
  // (la guardia mira el primer segmento de la ruta). Aquí falta lo otro:
  // acreditar es un permiso propio, y quien solo mira la lista no lo tiene.
  const puedeAcreditar = puede(perfil?.rol, "operar") || tieneExtra(perfil, "gala:acreditar")
  if (!puedeAcreditar) redirect("/admin/gala")

  const confirmados = registros.filter((r) => r.estado === "confirmed").length
  const entraron = registros.filter((r) => r.ingreso_at).length

  return <EscanerPuerta entraron={entraron} confirmados={confirmados} />
}
