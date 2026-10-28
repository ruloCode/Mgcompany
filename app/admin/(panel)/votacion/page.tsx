import { redirect } from "next/navigation"

import { cargarVotacionPublico, perfilActual, type VotoPublico } from "@/lib/mg/datos"
import { puede, seccionInicial } from "@/lib/mg/permisos"
import VistaVotacion from "@/components/admin/vista-votacion"

export const dynamic = "force-dynamic"

export default async function VotacionPage() {
  const perfil = await perfilActual()

  // El layout ya bloquea la ruta para quien no tiene la sección; se repite
  // aquí porque esta pantalla es la única del panel que nadie fuera de
  // dirección debe ver, y no debe depender de una sola guardia.
  if (!puede(perfil?.rol, "escrutinio")) redirect(seccionInicial(perfil))

  let votos: VotoPublico[] = []
  let error: string | null = null
  try {
    votos = await cargarVotacionPublico()
  } catch (e) {
    error = (e as Error).message
  }

  return <VistaVotacion votos={votos} error={error} ahora={new Date().toISOString()} />
}
