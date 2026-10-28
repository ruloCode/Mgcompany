import "server-only"

import { createHash, randomBytes } from "crypto"

import { getSupabaseAdmin } from "./supabase-admin"
import type { ResultadoConfirmacion } from "./mg1-votacion"

/* ============================================================
   La votación contra la base
   ============================================================
   Todo pasa por dos funciones de la migración 026 que solo la service_role
   puede llamar. Se exige la service_role EXPLÍCITAMENTE, por la misma razón
   que en la mesa del jurado (lib/mg1-seleccion-datos.ts): getSupabaseAdmin()
   cae a la publishable key cuando falta, y con esa key las funciones no se
   pueden ejecutar. Mejor saberlo antes de llamar que adivinarlo después. */

export class VotacionNoDisponible extends Error {}

const SITIO = process.env.NEXT_PUBLIC_SITIO ?? "https://mgcompany.co"

function admin() {
  const sb = getSupabaseAdmin()
  if (!sb || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new VotacionNoDisponible("Falta SUPABASE_SERVICE_ROLE_KEY")
  }
  return sb
}

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex")

/** El token que viaja en el correo. 24 bytes al azar: adivinarlo no es una
 *  opción. En la base solo queda su huella. */
export function nuevoToken(): { token: string; hash: string } {
  const token = randomBytes(24).toString("base64url")
  return { token, hash: sha256(token) }
}

export const huellaToken = sha256

export const urlConfirmacion = (token: string) => `${SITIO}/mg1/votacion/confirmar?t=${token}`

/** La IP no se guarda: se guarda su huella con sal, que alcanza para contar
 *  cuántas solicitudes llegan de un mismo sitio y no sirve para nada más. */
export function huellaIp(request: Request): string | null {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim()
  if (!ip) return null
  const sal = process.env.MG1_VOTO_SAL ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
  return sha256(`${sal}:${ip}`)
}

/* ---------- votar ---------- */

export type ResultadoSolicitud = "nuevo" | "cambio" | "reciente" | "ya_cuenta"

/** Los rechazos que lanza la base, con lo que se le dice a la persona. */
export const RECHAZOS: Record<string, { status: number; error: string }> = {
  votacion_no_abierta: { status: 425, error: "La votación todavía no abre." },
  votacion_cerrada: { status: 410, error: "La votación ya cerró." },
  demasiados_intentos: {
    status: 429,
    error: "Llegaron demasiados votos desde tu conexión en muy poco tiempo. Intenta en unos minutos.",
  },
  tope_de_correos: {
    status: 429,
    error: "Ya te mandamos varios correos a esa dirección. Busca el último en tu bandeja (y en Spam).",
  },
}

export interface Solicitud {
  email: string
  email_clave: string
  nombre: string
  ciudad: string
  es_artista: boolean
  finalista: string
  token_hash: string
  ip_hash: string | null
  user_agent: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
}

export async function solicitarVoto(s: Solicitud): Promise<ResultadoSolicitud> {
  const { data, error } = await admin().rpc("mg1_solicitar_voto", {
    p_email: s.email,
    p_email_clave: s.email_clave,
    p_nombre: s.nombre,
    p_ciudad: s.ciudad,
    p_es_artista: s.es_artista,
    p_finalista: s.finalista,
    p_token_hash: s.token_hash,
    p_ip_hash: s.ip_hash,
    p_user_agent: s.user_agent,
    p_utm_source: s.utm_source,
    p_utm_medium: s.utm_medium,
    p_utm_campaign: s.utm_campaign,
  })
  if (error) throw error
  return data as ResultadoSolicitud
}

/* ---------- confirmar ---------- */

export async function confirmarVoto(
  token: string,
): Promise<{ resultado: ResultadoConfirmacion; finalista: string | null }> {
  const { data, error } = await admin().rpc("mg1_confirmar_voto", { p_token_hash: huellaToken(token) })
  if (error) throw error
  const fila = (Array.isArray(data) ? data[0] : data) as
    | { resultado: ResultadoConfirmacion; finalista: string | null }
    | undefined
  return fila ?? { resultado: "invalido", finalista: null }
}

/** Lo que la página de confirmación necesita saber ANTES del clic: a quién se
 *  va a confirmar y si el enlace todavía sirve. Solo lectura. */
export type VistaEnlace =
  | { estado: "pendiente"; finalista: string }
  | { estado: "ya_confirmado"; finalista: string }
  | { estado: "vencido" | "invalido" }

export async function verEnlace(token: string): Promise<VistaEnlace> {
  const hash = huellaToken(token)
  const sb = admin()

  const { data: pendiente, error } = await sb
    .from("mg1_votos_publico")
    .select("finalista_pendiente, token_expira")
    .eq("token_hash", hash)
    .maybeSingle()
  if (error) throw error
  if (pendiente) {
    return new Date(pendiente.token_expira).getTime() < Date.now()
      ? { estado: "vencido" }
      : { estado: "pendiente", finalista: pendiente.finalista_pendiente }
  }

  const { data: usado } = await sb
    .from("mg1_votos_publico")
    .select("finalista")
    .eq("token_usado_hash", hash)
    .maybeSingle()
  if (usado?.finalista) return { estado: "ya_confirmado", finalista: usado.finalista }

  return { estado: "invalido" }
}
