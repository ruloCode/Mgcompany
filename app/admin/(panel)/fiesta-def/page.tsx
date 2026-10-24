import { notFound } from "next/navigation"

import { EVENTO_FIESTA_DEF } from "@/lib/eventos"
import { cargarComunidad, perfilActual } from "@/lib/mg/datos"
import { puede, puedeVerSeccion, tieneExtra } from "@/lib/mg/permisos"
import VistaEvento from "@/components/admin/vista-evento"

export const dynamic = "force-dynamic"

export const metadata = { title: "Fiesta Def · MG" }

/** La misma vista de /admin/eventos/coronacion-mg1, con su propia entrada en
 *  la navegación. Sirve para concederle a alguien SOLO esta fiesta: la 028
 *  le deja leer sus registros y nada más de la comunidad. */
export default async function FiestaDefPage() {
  const [comunidad, perfil] = await Promise.all([cargarComunidad(), perfilActual()])
  if (!comunidad.eventos.some((e) => e.slug === EVENTO_FIESTA_DEF)) notFound()

  const puedeOperar = puede(perfil?.rol, "operar")
  return (
    <VistaEvento
      comunidad={comunidad}
      slug={EVENTO_FIESTA_DEF}
      puedeOperar={puedeOperar}
      puedeAcreditar={puedeOperar || tieneExtra(perfil, "eventos:acreditar")}
      base="/admin/fiesta-def"
      volver={puedeVerSeccion(perfil, "eventos") ? { href: "/admin/eventos", label: "← Comunidad" } : null}
    />
  )
}
