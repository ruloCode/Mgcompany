import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"
import { CORREO_DE, CORREO_RESPONDER_A, getResend } from "@/lib/correo"
import { asuntoPase, htmlPase, textoPase } from "@/lib/gala-correo"
import { GALA_CUPO, GALA_EDICION, registroGalaSchema } from "@/lib/gala"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const PG_UNIQUE_VIOLATION = "23505"

/**
 * Registro publico a la Gala MG.
 *
 * El endpoint NO decide el cupo: inserta y lee lo que Postgres decidio. Ese
 * reparto vive en el trigger `gala_asignar_cupo` (migracion 019) porque dos
 * envios simultaneos leerian aqui el mismo conteo y los dos entrarian como
 * cupo principal. Aqui solo se traduce el veredicto a un mensaje.
 *
 * CAMBIO DE POLITICA (11 sep): quien alcanza cupo queda confirmado al
 * instante y recibe su pase por correo sin que nadie lo revise. Antes todos
 * entraban `pending` y el equipo admitia a mano, para cuidar el derecho de
 * admision; ese filtro se levanto.
 *
 * La invariante de la base NO cambio, y eso importa: `gala_asignar_cupo`
 * sigue pisando el estado en el INSERT, asi que el formulario publico no
 * puede confirmarse a si mismo aunque mande `estado: confirmed`. Quien
 * promueve es este endpoint, con la service_role, despues de que Postgres
 * decidio que habia silla. La regla de seguridad sigue en pie —solo el
 * servidor confirma—; lo que cambio es que el servidor ya no espera a nadie.
 *
 * Quien cae en lista de espera NO se promueve ni recibe pase: no hay silla
 * que darle.
 */
export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }

  const parsed = registroGalaSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Revisa los datos del formulario",
        fields: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    )
  }

  const { website, ...data } = parsed.data

  // Honeypot lleno -> bot. Se responde 200 para no darle señal de que lo fue.
  if (website) {
    return NextResponse.json({ ok: true, estado: "pending", restantes: 0 })
  }

  const row = {
    ...data,
    nombre_artistico: data.nombre_artistico || null,
    instagram: data.instagram || null,
    tiktok: data.tiktok || null,
    edicion: GALA_EDICION,
    origen: request.headers.get("referer"),
    user_agent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
  }

  const supabase = getSupabaseAdmin()

  // Sin credenciales no hay registro. A diferencia de MG1 no hay respaldo en
  // disco: la lista de espera depende de un conteo global, y un archivo local
  // en un servidor efimero daria un cupo distinto por instancia.
  if (!supabase) {
    console.error(
      "[gala/registro] Faltan credenciales de Supabase: registro NO guardado",
      { email: row.email },
    )
    return NextResponse.json(
      { error: "El registro no está disponible en este momento. Escríbenos por WhatsApp." },
      { status: 503 },
    )
  }

  const { data: creado, error } = await supabase
    .from("gala_registros")
    .insert(row)
    .select("id, estado")
    .single()

  if (error) {
    if (error.code === PG_UNIQUE_VIOLATION) {
      return NextResponse.json(
        { error: "Ese correo ya está registrado en la Gala. Estate pendiente de tu WhatsApp." },
        { status: 409 },
      )
    }
    console.error("[gala/registro] Error de Supabase:", error)
    return NextResponse.json(
      { error: "No pudimos guardar tu registro. Intenta de nuevo en un momento." },
      { status: 500 },
    )
  }

  // Con silla: confirmar y mandar el pase. El correo nunca hace fallar el
  // registro — la persona ya esta dentro y decirle lo contrario porque Resend
  // tuvo un mal minuto seria mentirle. Si falla, queda en el log y el panel
  // permite reenviar.
  const entro = creado?.estado !== "waitlist"
  if (entro && creado?.id) {
    try {
      await confirmarYAvisar(supabase, creado.id)
    } catch (e) {
      console.error("[gala/registro] No se pudo enviar el pase:", { email: row.email, e })
    }
  }

  const { count } = await supabase
    .from("gala_registros")
    .select("id", { count: "exact", head: true })
    .eq("edicion", GALA_EDICION)
    .in("estado", ["pending", "confirmed"])

  return NextResponse.json({
    ok: true,
    estado: entro ? "confirmed" : "waitlist",
    restantes: Math.max(0, GALA_CUPO - (count ?? 0)),
  })
}

/**
 * Confirma el registro y le manda su pase.
 *
 * El UPDATE es lo que emite el codigo: lo hace el trigger `gala_emitir_pase`,
 * no esta funcion. Por eso se confirma primero y se lee el codigo de vuelta,
 * en vez de inventarlo aqui.
 */
async function confirmarYAvisar(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  id: string,
) {
  const { data, error } = await supabase
    .from("gala_registros")
    .update({ estado: "confirmed" })
    .eq("id", id)
    .select("nombre_completo, nombre_artistico, email, codigo")
    .single()
  if (error) throw new Error(error.message)
  if (!data?.codigo) throw new Error("La base no emitio codigo al confirmar")

  const resend = getResend()
  if (!resend) throw new Error("Falta RESEND_API_KEY")

  const urlPase = `https://mgcompany.co/gala/pase/${data.codigo}`
  const datos = {
    nombre_completo: data.nombre_completo,
    nombre_artistico: data.nombre_artistico,
    codigo: data.codigo,
  }

  const { error: fallo } = await resend.emails.send({
    from: CORREO_DE,
    to: data.email,
    replyTo: CORREO_RESPONDER_A,
    subject: asuntoPase(),
    html: htmlPase(datos, urlPase),
    text: textoPase(datos, urlPase),
  })
  if (fallo) throw new Error(`${fallo.name}: ${fallo.message}`)
}

/** Cuantas sillas quedan. La landing lo pinta sin exponer un solo dato personal. */
export async function GET() {
  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ cupo: GALA_CUPO, ocupados: 0, restantes: GALA_CUPO })

  const { count } = await supabase
    .from("gala_registros")
    .select("id", { count: "exact", head: true })
    .eq("edicion", GALA_EDICION)
    .in("estado", ["pending", "confirmed"])

  const ocupados = count ?? 0
  return NextResponse.json({
    cupo: GALA_CUPO,
    ocupados,
    restantes: Math.max(0, GALA_CUPO - ocupados),
  })
}
