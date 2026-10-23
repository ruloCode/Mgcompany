import "server-only"

import { getSupabaseAdmin } from "./supabase-admin"

/* ============================================================
   Eventos: lecturas y escrituras del lado PÚBLICO
   ============================================================
   La landing, el formulario y el pase no tienen sesión: leen y escriben con
   la service_role, como la Gala y la mesa del jurado. Lo del panel va por
   lib/mg/datos.ts con la sesión del usuario, para que lo filtre RLS.

   Se exige la service_role EXPLÍCITAMENTE, por la lección de la mesa del
   jurado: getSupabaseAdmin() cae a la publishable key cuando no la hay, y con
   esa key estas tablas no tienen policy de nada — la consulta no falla,
   devuelve vacío, y un evento "que no existe" es peor que un error. */

const SITIO = process.env.NEXT_PUBLIC_SITIO ?? "https://mgcompany.co"

export class EventosNoDisponible extends Error {}

function admin() {
  const sb = getSupabaseAdmin()
  if (!sb || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new EventosNoDisponible("Falta SUPABASE_SERVICE_ROLE_KEY")
  }
  return sb
}

export interface Evento {
  slug: string
  nombre: string
  fecha: string
  hora_puertas: string
  lugar: string
  ciudad: string
  direccion: string | null
  mapa_url: string | null
  cupo: number | null
  registro_cierra: string
  concurso_cierra: string | null
}

export async function cargarEvento(slug: string): Promise<Evento | null> {
  const { data, error } = await admin().from("eventos").select("*").eq("slug", slug).maybeSingle()
  if (error) throw new EventosNoDisponible(error.message)
  return (data as Evento) ?? null
}

export const urlPase = (codigo: string) => `${SITIO}/fiesta/pase/${codigo}`
export const urlInvitacion = (evento: string, ref: string) => `${SITIO}/fiesta/${evento}?ref=${ref}`
export const urlImagenQr = (codigo: string) => `${SITIO}/api/eventos/qr/${codigo}`

/* ---------- el alta ---------- */

export interface AltaNormalizada {
  evento: string
  email: string
  email_clave: string
  nombre: string
  whatsapp: string
  whatsapp_e164: string
  instagram: string | null
  tiktok: string | null
  fecha_nacimiento: string
  generos: string[]
  acepta_invitaciones: boolean
  ref: string | null
  origen: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  user_agent: string | null
}

export interface ResultadoAlta {
  registro_id: string
  codigo: string
  codigo_ref: string
  nuevo: boolean
  correo_enviado_at: string | null
  nombre: string
  email: string
}

/** Todo el alta en UNA llamada: la función registrar_en_evento (migración
 *  024) toma un lock por correo y hace persona + registro en la misma
 *  transacción. Hacerlo en dos llamadas desde aquí reabriría la carrera que
 *  el lock cierra. */
export async function registrarEnEvento(a: AltaNormalizada): Promise<ResultadoAlta> {
  const { data, error } = await admin().rpc("registrar_en_evento", {
    p_evento: a.evento,
    p_email: a.email,
    p_email_clave: a.email_clave,
    p_nombre: a.nombre,
    p_whatsapp: a.whatsapp,
    p_whatsapp_e164: a.whatsapp_e164,
    p_instagram: a.instagram,
    p_tiktok: a.tiktok,
    p_fecha_nacimiento: a.fecha_nacimiento,
    p_generos: a.generos,
    p_acepta_invitaciones: a.acepta_invitaciones,
    p_ref: a.ref,
    p_origen: a.origen,
    p_utm_source: a.utm_source,
    p_utm_medium: a.utm_medium,
    p_utm_campaign: a.utm_campaign,
    p_user_agent: a.user_agent,
  })
  if (error) throw error
  const fila = Array.isArray(data) ? data[0] : data
  return fila as ResultadoAlta
}

export async function marcarCorreoEnviado(registroId: string) {
  await admin()
    .from("evento_registros")
    .update({ correo_enviado_at: new Date().toISOString() })
    .eq("id", registroId)
}

/* ---------- el pase ---------- */

export interface DatosPaseEvento {
  codigo: string
  nombre: string
  ingreso_at: string | null
  evento: Evento
}

/** El pase de un código, y la constancia de que se abrió.
 *
 *  Abrirlo prueba que el correo es de quien lo escribió: el enlace solo llegó
 *  a ese buzón. Por eso la primera apertura marca `pase_abierto_at` en el
 *  registro y `email_verificado_at` en la persona (si no lo estaba). Las dos
 *  marcas se ponen UNA vez: volver a abrir el pase no mueve las fechas. */
export async function abrirPase(codigo: string): Promise<DatosPaseEvento | null> {
  const sb = admin()
  const { data, error } = await sb
    .from("evento_registros")
    .select("id, codigo, ingreso_at, pase_abierto_at, persona_id, persona:personas!evento_registros_persona_id_fkey(nombre, email_verificado_at), eventos(*)")
    .eq("codigo", codigo)
    .maybeSingle()
  if (error) throw new EventosNoDisponible(error.message)
  if (!data) return null

  // `persona:` + el nombre de la clave, no `personas(...)` a secas:
  // evento_registros tiene DOS claves hacia personas (persona_id y
  // referido_por) y sin decir cuál, Supabase no sabe por cuál ir y falla.
  const persona = data.persona as unknown as { nombre: string; email_verificado_at: string | null }
  const evento = data.eventos as unknown as Evento

  const ahora = new Date().toISOString()
  if (!data.pase_abierto_at) {
    await sb.from("evento_registros").update({ pase_abierto_at: ahora }).eq("id", data.id)
  }
  if (!persona.email_verificado_at) {
    await sb.from("personas").update({ email_verificado_at: ahora }).eq("id", data.persona_id)
  }

  return { codigo: data.codigo, nombre: persona.nombre, ingreso_at: data.ingreso_at, evento }
}
