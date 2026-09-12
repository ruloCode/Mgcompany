"use client"

import { usePathname } from "next/navigation"
import SiteHeader from "./site-header"
import SiteFooter from "./site-footer"

// Rutas standalone: sin header/footer del sitio
// (invitaciones, propuestas privadas, landings de conversión con su propio footer
// y el panel administrativo, que trae su propio chrome)
const STANDALONE_PREFIXES = [
  "/mg1/jurado",
  "/mg1/convocatoria",
  // Propuestas de alianza: cada una es una pieza cerrada con su propio cierre
  "/mg1/coronacion",
  "/mg1/estudio",
  "/mg1/def",
  "/admin",
  // Vistas imprimibles: son laminas de tamano fijo, el header y el footer del
  // sitio no pintan nada dentro de un PDF.
  "/artistas/karen-dayanna/press-kit",
  // El pase de la Gala se abre en la puerta, a pulso y con prisa: lo unico que
  // tiene que caber en pantalla es el QR. El menu del sitio ahi solo estorba.
  "/gala/pase",
]

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const standalone = STANDALONE_PREFIXES.some((prefix) => pathname.startsWith(prefix))

  if (standalone) {
    return <main className="min-h-screen">{children}</main>
  }

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen pt-16 md:pt-24 lg:pt-28">{children}</main>
      <SiteFooter />
    </>
  )
}
