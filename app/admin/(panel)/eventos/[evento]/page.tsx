import { notFound } from "next/navigation"

import { cargarComunidad, perfilActual } from "@/lib/mg/datos"
import { puede, tieneExtra } from "@/lib/mg/permisos"
import VistaEvento from "@/components/admin/vista-evento"

export const dynamic = "force-dynamic"

export default async function EventoPage({ params }: { params: Promise<{ evento: string }> }) {
  const { evento } = await params
  const [comunidad, perfil] = await Promise.all([cargarComunidad(), perfilActual()])
  if (!comunidad.eventos.some((e) => e.slug === evento)) notFound()

  const puedeOperar = puede(perfil?.rol, "operar")
  return (
    <VistaEvento
      comunidad={comunidad}
      slug={evento}
      puedeOperar={puedeOperar}
      puedeAcreditar={puedeOperar || tieneExtra(perfil, "eventos:acreditar")}
    />
  )
}
