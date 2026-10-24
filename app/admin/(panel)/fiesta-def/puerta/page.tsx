import { notFound, redirect } from "next/navigation"

import { acreditarEnEvento } from "@/app/admin/acciones"
import { metricasEvento } from "@/lib/comunidad"
import { EVENTO_FIESTA_DEF } from "@/lib/eventos"
import { cargarComunidad, perfilActual } from "@/lib/mg/datos"
import { puede, tieneExtra } from "@/lib/mg/permisos"
import EscanerPuerta from "@/components/admin/escaner-puerta"

export const dynamic = "force-dynamic"

export const metadata = { title: "Puerta · Fiesta Def · MG" }

export default async function PuertaFiestaDefPage() {
  const [comunidad, perfil] = await Promise.all([cargarComunidad(), perfilActual()])
  if (!comunidad.eventos.some((e) => e.slug === EVENTO_FIESTA_DEF)) notFound()

  if (!(puede(perfil?.rol, "operar") || tieneExtra(perfil, "eventos:acreditar"))) {
    redirect("/admin/fiesta-def")
  }

  const m = metricasEvento(comunidad, EVENTO_FIESTA_DEF)
  return (
    <EscanerPuerta
      entraron={m.entraron}
      confirmados={m.registrados}
      acreditar={acreditarEnEvento.bind(null, EVENTO_FIESTA_DEF)}
      formato="evento"
      volver="/admin/fiesta-def"
    />
  )
}
