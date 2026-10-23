import { notFound, redirect } from "next/navigation"

import { acreditarEnEvento } from "@/app/admin/acciones"
import { metricasEvento } from "@/lib/comunidad"
import { cargarComunidad, perfilActual } from "@/lib/mg/datos"
import { puede, tieneExtra } from "@/lib/mg/permisos"
import EscanerPuerta from "@/components/admin/escaner-puerta"

export const dynamic = "force-dynamic"

export const metadata = { title: "Puerta · MG" }

export default async function PuertaEventoPage({ params }: { params: Promise<{ evento: string }> }) {
  const { evento } = await params
  const [comunidad, perfil] = await Promise.all([cargarComunidad(), perfilActual()])
  if (!comunidad.eventos.some((e) => e.slug === evento)) notFound()

  // Ver la lista y acreditar son permisos distintos: quien solo mira no abre
  // la cámara.
  if (!(puede(perfil?.rol, "operar") || tieneExtra(perfil, "eventos:acreditar"))) {
    redirect(`/admin/eventos/${evento}`)
  }

  const m = metricasEvento(comunidad, evento)
  // Es la misma puerta que la de la Gala. La acción llega ligada a ESTA fiesta:
  // un pase de otra se reconoce y se dice, no se deja pasar.
  return (
    <EscanerPuerta
      entraron={m.entraron}
      confirmados={m.registrados}
      acreditar={acreditarEnEvento.bind(null, evento)}
      formato="evento"
      volver={`/admin/eventos/${evento}`}
    />
  )
}
