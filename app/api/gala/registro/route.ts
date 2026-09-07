import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"
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
    .select("estado")
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

  const { count } = await supabase
    .from("gala_registros")
    .select("id", { count: "exact", head: true })
    .eq("edicion", GALA_EDICION)
    .in("estado", ["pending", "confirmed"])

  return NextResponse.json({
    ok: true,
    estado: creado?.estado === "waitlist" ? "waitlist" : "pending",
    restantes: Math.max(0, GALA_CUPO - (count ?? 0)),
  })
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
