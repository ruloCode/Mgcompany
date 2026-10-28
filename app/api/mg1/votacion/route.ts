import { NextResponse } from "next/server"

import { correoDeEnvio, normalizarEmail } from "@/lib/contacto"
import { correoConfigurado } from "@/lib/correo"
import { buscarFinalista, estadoVentana, votoPublicoSchema, type RespuestaVoto } from "@/lib/mg1-votacion"
import { enviarConfirmacionVoto } from "@/lib/mg1-votacion-correo"
import {
  RECHAZOS,
  VotacionNoDisponible,
  huellaIp,
  nuevoToken,
  solicitarVoto,
  urlConfirmacion,
} from "@/lib/mg1-votacion-datos"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/* Ninguna respuesta de este endpoint lleva un conteo, un porcentaje ni una
   pista de cómo va la votación. Es la promesa central de la pieza.

   Tampoco revela el voto de nadie: todo lo que sale bien responde LISTO,
   idéntico, sea voto nuevo, cambio, el voto que ya contaba o un correo que ya
   iba en camino. La diferencia la lee solo quien abre el buzón. */
const LISTO = { ok: true, estado: "revisa_correo" } as const satisfies RespuestaVoto

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }

  const parsed = votoPublicoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Revisa los datos del formulario", fields: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }
  const d = parsed.data

  // Honeypot lleno: es un bot. Se le responde como si todo hubiera ido bien
  // para no darle la señal de que lo detectamos.
  if (d.website) {
    return NextResponse.json(LISTO)
  }

  // Primer filtro, barato. El que vale es el de la base (migración 026).
  const ventana = estadoVentana(new Date().toISOString())
  if (ventana !== "abierta") {
    const r = RECHAZOS[ventana === "antes" ? "votacion_no_abierta" : "votacion_cerrada"]
    return NextResponse.json({ error: r.error }, { status: r.status })
  }

  // El schema ya validó el slug contra el catálogo.
  const finalista = buscarFinalista(d.finalista)!
  const { token, hash } = nuevoToken()

  try {
    const resultado = await solicitarVoto({
      email: correoDeEnvio(d.email),
      email_clave: normalizarEmail(d.email),
      nombre: d.nombre,
      ciudad: d.ciudad,
      es_artista: d.es_artista === "si",
      finalista: finalista.slug,
      token_hash: hash,
      ip_hash: huellaIp(request),
      user_agent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
      utm_source: d.utm_source || null,
      utm_medium: d.utm_medium || null,
      utm_campaign: d.utm_campaign || null,
    })

    // Ya salió un correo hace menos de un minuto: no se manda otro.
    if (resultado === "reciente") return NextResponse.json(LISTO)

    // "ya_cuenta" no lleva enlace: no hay nada que confirmar.
    const enlace = resultado === "ya_cuenta" ? null : urlConfirmacion(token)

    // En desarrollo sin Resend se devuelve el enlace para poder probar el
    // flujo completo. En producción, jamás: sería saltarse la verificación.
    if (!correoConfigurado() && process.env.NODE_ENV !== "production") {
      return NextResponse.json({ ...LISTO, ...(enlace ? { enlace_dev: enlace } : {}) } satisfies RespuestaVoto)
    }

    const envio = await enviarConfirmacionVoto({
      nombre: d.nombre,
      email: correoDeEnvio(d.email),
      finalista,
      ...(enlace ? { tipo: resultado === "cambio" ? "cambio" : "nuevo", enlace } : { tipo: "ya_cuenta" }),
    })
    if (!envio.ok) {
      console.error("[mg1/votacion] no salió el correo:", envio.error)
      return NextResponse.json(
        { error: "No pudimos mandarte el correo de confirmación. Intenta de nuevo en un minuto." },
        { status: 502 },
      )
    }

    return NextResponse.json(LISTO)
  } catch (e) {
    if (e instanceof VotacionNoDisponible) {
      console.error("[mg1/votacion] sin servicio:", e.message)
      return NextResponse.json({ error: "La votación no está disponible ahora. Intenta en un rato." }, { status: 503 })
    }
    const msg = (e as { message?: string }).message ?? ""
    const rechazo = Object.entries(RECHAZOS).find(([clave]) => msg.includes(clave))
    if (rechazo) {
      return NextResponse.json({ error: rechazo[1].error }, { status: rechazo[1].status })
    }
    console.error("[mg1/votacion] error:", e)
    return NextResponse.json({ error: "No pudimos registrar tu voto. Intenta de nuevo en un momento." }, { status: 500 })
  }
}
