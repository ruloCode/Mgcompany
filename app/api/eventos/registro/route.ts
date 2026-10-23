import { NextResponse } from "next/server"

import { correoDeEnvio, edadEn, normalizarEmail, normalizarWhatsapp, usuarioDeRed } from "@/lib/contacto"
import { EDAD_MINIMA, registroEventoSchema, type RespuestaRegistroEvento } from "@/lib/eventos"
import { enviarPase } from "@/lib/eventos-correo"
import { EventosNoDisponible, cargarEvento, marcarCorreoEnviado, marcarTerminos, registrarEnEvento } from "@/lib/eventos-datos"
import { terminosDe } from "@/lib/eventos-terminos"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** Cuánto esperar antes de reenviar el pase a quien se vuelve a registrar.
 *  Sin esto, cualquiera podría llenarle la bandeja a otra persona escribiendo
 *  su correo en el formulario una y otra vez. */
const REENVIO_MINIMO_MS = 2 * 60 * 1000

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }

  const parsed = registroEventoSchema.safeParse(body)
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
    return NextResponse.json({ ok: true, ref: "", nuevo: true } satisfies RespuestaRegistroEvento)
  }

  try {
    const evento = await cargarEvento(d.evento)
    if (!evento) return NextResponse.json({ error: "Esa fiesta no existe" }, { status: 404 })
    if (Date.now() > new Date(evento.registro_cierra).getTime()) {
      return NextResponse.json({ error: "El registro para esta fiesta ya cerró" }, { status: 410 })
    }

    // La edad se mide el DÍA DE LA FIESTA, no hoy: quien cumple 18 la semana
    // del evento sí puede entrar.
    const edad = edadEn(d.fecha_nacimiento, evento.fecha)
    if (edad < EDAD_MINIMA) {
      return NextResponse.json(
        { error: "Es una fiesta para mayores de 18", fields: { fecha_nacimiento: [`Tienes que tener ${EDAD_MINIMA} años cumplidos el día de la fiesta`] } },
        { status: 400 },
      )
    }
    if (edad > 100) {
      return NextResponse.json(
        { error: "Revisa tu fecha de nacimiento", fields: { fecha_nacimiento: ["Revisa el año"] } },
        { status: 400 },
      )
    }

    const alta = await registrarEnEvento({
      evento: evento.slug,
      email: correoDeEnvio(d.email),
      email_clave: normalizarEmail(d.email),
      nombre: d.nombre,
      whatsapp: d.whatsapp,
      // El schema ya comprobó que se puede normalizar.
      whatsapp_e164: normalizarWhatsapp(d.whatsapp)!,
      instagram: d.instagram ? usuarioDeRed(d.instagram, "instagram") : null,
      tiktok: d.tiktok ? usuarioDeRed(d.tiktok, "tiktok") : null,
      fecha_nacimiento: d.fecha_nacimiento,
      generos: d.generos,
      acepta_invitaciones: d.acepta_invitaciones,
      ref: d.ref || null,
      origen: request.headers.get("referer"),
      utm_source: d.utm_source || null,
      utm_medium: d.utm_medium || null,
      utm_campaign: d.utm_campaign || null,
      user_agent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
    })

    // Constancia de los términos aceptados en ESTE envío. El formulario no
    // deja enviar sin la casilla, y el schema tampoco (acepta_datos: true).
    const terminos = terminosDe(evento.slug)
    if (terminos) await marcarTerminos(alta.registro_id, terminos.version)

    const reciente =
      alta.correo_enviado_at && Date.now() - new Date(alta.correo_enviado_at).getTime() < REENVIO_MINIMO_MS
    let correo = Boolean(reciente)

    if (!reciente) {
      const envio = await enviarPase({
        evento,
        nombre: alta.nombre,
        email: alta.email,
        codigo: alta.codigo,
        ref: alta.codigo_ref,
      })
      if (envio.ok) {
        // El sello va DESPUÉS del envío: marcarlo antes y fallar dejaría
        // registrado un correo que nunca salió.
        await marcarCorreoEnviado(alta.registro_id)
        correo = true
      } else {
        console.error("[eventos/registro] no salió el pase:", envio.error, { email: alta.email })
      }
    }

    // La persona quedó registrada aunque el correo falle. Se le dice para que
    // vuelva a intentar: reenviar es idempotente, no crea otro registro.
    if (!correo) {
      return NextResponse.json(
        { error: "Te registramos, pero no pudimos mandarte el correo. Intenta de nuevo en unos minutos." },
        { status: 502 },
      )
    }

    return NextResponse.json({ ok: true, ref: alta.codigo_ref, nuevo: alta.nuevo } satisfies RespuestaRegistroEvento)
  } catch (e) {
    if (e instanceof EventosNoDisponible) {
      console.error("[eventos/registro] sin servicio:", e.message)
      return NextResponse.json({ error: "El registro no está disponible ahora. Intenta en un rato." }, { status: 503 })
    }
    const err = e as { message?: string; code?: string }
    if (err.message?.includes("registro_cerrado")) {
      return NextResponse.json({ error: "El registro para esta fiesta ya cerró" }, { status: 410 })
    }
    console.error("[eventos/registro] error:", err)
    return NextResponse.json({ error: "No pudimos registrarte. Intenta de nuevo en un momento." }, { status: 500 })
  }
}
