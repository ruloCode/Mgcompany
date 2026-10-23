import { NextResponse } from "next/server"

import { csvAudiencia } from "@/lib/comunidad"
import { cargarComunidad, perfilActual } from "@/lib/mg/datos"
import { puede } from "@/lib/mg/permisos"

export const dynamic = "force-dynamic"

/* La audiencia para pauta, lista para subir a Meta o a TikTok.

   Un route handler no hereda la guardia del layout del panel: el middleware
   exige sesión, pero el permiso hay que comprobarlo aquí. Exportar la base es
   de quien opera, no de cualquiera que vea la lista. Y lo que se lee pasa por
   la sesión del usuario, así que RLS sigue mandando. */
export async function GET() {
  const perfil = await perfilActual()
  if (!perfil) return NextResponse.redirect(new URL("/admin/login", process.env.NEXT_PUBLIC_SITIO ?? "https://mgcompany.co"))
  if (!puede(perfil.rol, "operar")) return new NextResponse("Tu rol no puede exportar la base.", { status: 403 })

  const { personas } = await cargarComunidad()
  const hoy = new Date().toISOString().slice(0, 10)

  return new NextResponse(csvAudiencia(personas), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="audiencia-mg-${hoy}.csv"`,
      "Cache-Control": "no-store",
    },
  })
}
