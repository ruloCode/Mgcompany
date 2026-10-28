import { NextResponse } from "next/server"

import { confirmarVotoSchema } from "@/lib/mg1-votacion"
import { VotacionNoDisponible, confirmarVoto } from "@/lib/mg1-votacion-datos"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/* POST y no GET a propósito: los filtros de correo (Outlook, los antivirus
   corporativos) abren cada enlace que llega para revisarlo. Si abrir el
   enlace confirmara el voto, lo confirmaría un robot. La página del enlace
   muestra a quién se va a confirmar y el botón hace este POST. */

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }

  const parsed = confirmarVotoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, resultado: "invalido" }, { status: 400 })
  }

  try {
    const { resultado, finalista } = await confirmarVoto(parsed.data.t)
    const ok = resultado === "confirmado" || resultado === "ya_confirmado"
    return NextResponse.json({ ok, resultado, finalista }, { status: ok ? 200 : 409 })
  } catch (e) {
    if (e instanceof VotacionNoDisponible) {
      console.error("[mg1/votacion/confirmar] sin servicio:", e.message)
      return NextResponse.json({ error: "La votación no está disponible ahora. Intenta en un rato." }, { status: 503 })
    }
    console.error("[mg1/votacion/confirmar] error:", e)
    return NextResponse.json({ error: "No pudimos confirmar tu voto. Intenta de nuevo en un momento." }, { status: 500 })
  }
}
