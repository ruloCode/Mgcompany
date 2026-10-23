import { cargarComunidad, perfilActual } from "@/lib/mg/datos"
import { puede, tieneExtra } from "@/lib/mg/permisos"
import VistaEventos from "@/components/admin/vista-eventos"

export const dynamic = "force-dynamic"

export const metadata = { title: "Eventos y comunidad · MG" }

export default async function EventosPage() {
  const [comunidad, perfil] = await Promise.all([cargarComunidad(), perfilActual()])
  const puedeOperar = puede(perfil?.rol, "operar")

  return (
    <VistaEventos
      comunidad={comunidad}
      puedeOperar={puedeOperar}
      puedeAcreditar={puedeOperar || tieneExtra(perfil, "eventos:acreditar")}
    />
  )
}
