import { cargarRegistrosGala, perfilActual } from "@/lib/mg/datos"
import { puede, tieneExtra } from "@/lib/mg/permisos"
import VistaGala from "@/components/admin/vista-gala"

export const dynamic = "force-dynamic"

export default async function GalaPage() {
  const [registros, perfil] = await Promise.all([cargarRegistrosGala(), perfilActual()])

  // Dos permisos distintos sobre la misma pantalla: admitir (quién entra) y
  // acreditar (quién ya llegó). El segundo se puede conceder a título personal
  // para la noche del evento sin dar voto sobre lo primero.
  const puedeAdmitir = puede(perfil?.rol, "operar")

  return (
    <VistaGala
      registros={registros}
      puedeAdmitir={puedeAdmitir}
      puedeAcreditar={puedeAdmitir || tieneExtra(perfil, "gala:acreditar")}
    />
  )
}
