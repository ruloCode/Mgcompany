import { z } from "zod"

import { MG1_EDICION } from "./mg1-inscripcion"

export { MG1_EDICION }

/* ============================================================
   MG1 — votación del público
   ============================================================
   La página donde el público corona al campeón entre los finalistas.
   Abre con el estreno del Cap 3 y cierra el viernes 30 a las 8:00 p.m., la
   misma noche de La Coronación.

   Una sola fuente para las tres capas, como en `lib/gala.ts`: la landing la
   muestra, el route handler la valida y el panel la cuenta.

   Los tres objetivos de la pieza, en este orden (no es decoración: cuando algo
   entra en conflicto, gana el de arriba):

   1. Que el resultado sea creíble y que NADIE fuera de dirección lo conozca
      antes de la coronación. Por eso un voto solo cuenta si se confirma desde
      el correo, y por eso ni la landing ni la API devuelven un conteo jamás:
      ni durante, ni después del cierre.
   2. Capturar correos verificables. La Base B es un activo del negocio tan
      importante como el resultado.
   3. Que votar tome menos de 30 segundos en un celular de gama baja con datos
      móviles. Por eso el audio no se descarga hasta que alguien le da play.
*/

/* ---------- la ventana ---------- */

/** Estreno del Cap 3 (viernes). Espejo de mg1_votacion_abre() en la migración
 *  026: la que manda es la base. Moverla es moverla en los dos sitios. */
export const MG1_VOTACION_ABRE = "2026-10-23T19:00:00-05:00"

/** Cierre duro: viernes 30 de octubre, 8:00 p.m. hora Colombia. Espejo de
 *  mg1_votacion_cierra(). La página puede quedarse abierta en el celular de
 *  alguien; la base no. */
export const MG1_VOTACION_CIERRA = "2026-10-30T20:00:00-05:00"

/** La fiesta donde se corona. Es el gancho del "gracias" y de la página cerrada. */
export const MG1_FIESTA = {
  url: "/fiesta/coronacion-mg1",
  nombre: "La Coronación",
  cuando: "Viernes 30 de octubre · desde las 6:00 p.m.",
  donde: "Def Jamaica Club · Soacha",
}

export type EstadoVentana = "antes" | "abierta" | "cerrada"

/** Qué momento es, según un reloj que se le pasa. Nunca lee `Date.now()` por su
 *  cuenta: el reloj que manda es el del servidor y viaja hasta aquí. */
export function estadoVentana(
  ahoraISO: string,
  abre = MG1_VOTACION_ABRE,
  cierra = MG1_VOTACION_CIERRA,
): EstadoVentana {
  const t = new Date(ahoraISO).getTime()
  if (t < new Date(abre).getTime()) return "antes"
  if (t >= new Date(cierra).getTime()) return "cerrada"
  return "abierta"
}

/* ---------- los finalistas ---------- */

export type RedFinalista = "instagram" | "tiktok" | "youtube" | "spotify"

export interface Finalista {
  /** Slug del voto. ES la identidad: viaja al backend y se guarda tal cual.
   *  Cambiarlo después de abrir la votación parte los votos en dos. */
  slug: string
  nombre: string
  /** Título de la canción final, la que suena en el disco. */
  cancion: string
  /** El master en MP3, servido desde `public/mg1/finalistas/`. Un archivo
   *  propio y no un embed: así hay UN solo reproductor en la página (nunca
   *  suenan dos), el disco gira exactamente cuando suena, y no se carga nada
   *  de terceros en un celular con datos. */
  audio: string
  ciudad?: string
  /** URLs completas. Las que falten simplemente no se pintan. */
  redes: Partial<Record<RedFinalista, string>>
}

/* Los cuatro finalistas del Cap 3. El orden es alfabético a propósito: es el
   orden en que se pintan, y cualquier otro se leería como un favorito.
   Los masters viven en public/mg1/finalistas/<slug>.mp3. Ciudad y redes se
   llenan cuando las confirmen; lo que falte simplemente no se pinta. */
export const FINALISTAS: Finalista[] = [
  {
    slug: "isbella",
    nombre: "Isbella",
    cancion: "DVD",
    audio: "/mg1/finalistas/isbella.mp3",
    redes: {},
  },
  {
    slug: "marlon-castillo",
    nombre: "Marlon Castillo",
    cancion: "Vacío",
    audio: "/mg1/finalistas/marlon-castillo.mp3",
    redes: {},
  },
  {
    slug: "nasha",
    nombre: "Nasha",
    cancion: "DMP",
    audio: "/mg1/finalistas/nasha.mp3",
    redes: {},
  },
  {
    slug: "sunny",
    nombre: "Sunny",
    cancion: "Tekeria",
    audio: "/mg1/finalistas/sunny.mp3",
    redes: {},
  },
]

export const buscarFinalista = (slug: string): Finalista | null =>
  FINALISTAS.find((f) => f.slug === slug) ?? null

export const nombreFinalista = (slug: string): string => buscarFinalista(slug)?.nombre ?? slug

/* ---------- lo que entra por la API ---------- */

const slugs = FINALISTAS.map((f) => f.slug) as [string, ...string[]]

/** UTM: obligatorio en todo link de campaña, opcional en el schema. Quien
 *  llega escribiendo la URL a mano no trae ninguno y su voto vale igual; lo
 *  que se pierde es saber de qué red vino, no el voto. */
const utm = z.string().trim().max(60).optional().or(z.literal(""))

export const votoPublicoSchema = z.object({
  finalista: z.enum(slugs, { errorMap: () => ({ message: "Elige a tu finalista" }) }),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Ingresa un correo válido")
    .max(120, "Máximo 120 caracteres"),
  nombre: z
    .string()
    .trim()
    .min(2, "Escribe tu nombre")
    .max(80, "Máximo 80 caracteres"),
  /* Radio sí/no y no un checkbox: un checkbox sin marcar es ambiguo (¿no es
     artista, o no lo leyó?) y esta respuesta es la que segmenta la Base B para
     la oferta de producción. */
  es_artista: z.enum(["si", "no"], {
    errorMap: () => ({ message: "Cuéntanos si eres artista" }),
  }),
  ciudad: z
    .string()
    .trim()
    .min(2, "Escribe tu ciudad")
    .max(60, "Máximo 60 caracteres"),
  acepta_datos: z.literal(true, {
    errorMap: () => ({ message: "Necesitamos tu autorización para registrar el voto" }),
  }),
  utm_source: utm,
  utm_medium: utm,
  utm_campaign: utm,
  // Honeypot: los bots llenan todo, las personas no ven este campo. El route
  // handler descarta en silencio lo que lo trae lleno, sin decirle que lo pilló.
  website: z.string().optional(),
})

export type VotoPublicoInput = z.infer<typeof votoPublicoSchema>

/** Lo que devuelve el endpoint. NUNCA lleva un conteo, y tampoco dice nada
 *  del voto de esa persona: un solo estado para el voto nuevo, el cambio, el
 *  que ya contaba y el correo que ya iba en camino. Si respondiera distinto,
 *  bastaría escribir el correo de otro y probar finalista por finalista para
 *  saber por quién votó. Lo que distingue un caso de otro va en el correo. */
export interface RespuestaVoto {
  ok: true
  estado: "revisa_correo"
  /** SOLO en desarrollo sin Resend configurado: el enlace que habría ido por
   *  correo, para poder probar el flujo sin buzón. El servidor nunca lo
   *  incluye en producción. */
  enlace_dev?: string
}

export const confirmarVotoSchema = z.object({
  t: z.string().regex(/^[A-Za-z0-9_-]{20,80}$/, "Enlace inválido"),
})

export type ResultadoConfirmacion = "confirmado" | "ya_confirmado" | "vencido" | "cerrada" | "invalido"

/* ---------- fechas para mostrar ---------- */

/** "Viernes, 30 de octubre" sin escribir el día de la semana a mano:
 *  escribirlo se desfasa en cuanto alguien mueve la fecha. */
export function fechaLargaVotacion(iso: string): string {
  const texto = new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Bogota",
  }).format(new Date(iso))
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export function horaVotacion(iso: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Bogota",
  }).format(new Date(iso))
}
