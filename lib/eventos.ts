import { z } from "zod"

import { normalizarWhatsapp, usuarioDeRed } from "./contacto"

/* ============================================================
   Eventos y comunidad: lo que comparten la landing, la API y el panel
   ============================================================
   Lo que el servidor necesita para DECIDIR (fecha, cierre del registro, cupo)
   vive en la tabla `eventos` (migración 024). Aquí vive lo que se MUESTRA y
   los catálogos cerrados que valida el servidor. Una fiesta nueva es una fila
   en esa tabla más una entrada en CONTENIDO_EVENTOS. */

export const MG_INSTAGRAM = "mgcompanygroup"

/** El buzón que aparece en los términos para reclamos, retiro de imagen y
 *  derechos sobre los datos. Tiene que ser un buzón que alguien LEA: es el
 *  mismo al que llegan las respuestas a los correos de pases (CORREO_RESPONDER_A
 *  en lib/correo.ts). Fijo y no por variable de entorno: un texto legal no
 *  puede cambiar según el servidor que lo pinte. */
export const CORREO_CONTACTO = "gala@mgcompany.co"

/* ---------- qué música le gusta escuchar en vivo ---------- */

/* Diez opciones, elegidas con datos medidos en Bogotá entre 2025 y 2026, no
   con listas de "lo que está de moda":

   - Festivales al Parque 2025 (Idartes / Alcaldía, asistencia contada):
     Rock 253.000 · Salsa 88.000 · Hip Hop 75.000 · Popular 72.947.
   - Movistar Arena 2025, 168 eventos y 900.000 asistentes, programación por
     género: urbano 24 % · pop 13 % · rock 8,1 % · electrónica 5,7 % ·
     música popular 4,9 %. El artista que más vendió fue Beéle (83.406
     entradas en 8 fechas), por eso existe la opción afro/dancehall.
   - TaquillaLive 2025: los formatos de un día que más vendieron fueron
     electrónica y reggaetón.
   - Spotify Wrapped 2025 Colombia: el urbano domina lo que se ESCUCHA, pero
     lo que se ve en vivo está mucho más repartido (el rock al aire libre
     llena más que cualquier otro género). Por eso la pregunta es "en vivo" y
     no "qué escuchas".

   "Acústico y cantautor" es un formato más que un género. No sale de esos
   datos: lo pidió el equipo, y se queda porque MG produce ese formato.

   Diez y no más: la investigación de Pew Research (2019) sobre preguntas de
   "marca todas las que apliquen" muestra que la gente tiende a quedarse con
   las primeras opciones aceptables. Por eso además el formulario BARAJA el
   orden para cada persona: así ningún género gana solo por estar arriba. */
export const GENEROS_EN_VIVO = [
  { valor: "urbano", label: "Reggaetón y urbano" },
  { valor: "rap", label: "Rap y hip hop" },
  { valor: "afro", label: "Afro, dancehall y reggae" },
  { valor: "electronica", label: "Electrónica: techno, house" },
  { valor: "rock", label: "Rock" },
  { valor: "salsa", label: "Salsa" },
  { valor: "pop", label: "Pop" },
  { valor: "popular", label: "Popular y despecho" },
  { valor: "vallenato", label: "Vallenato" },
  { valor: "acustico", label: "Acústico y cantautor" },
] as const

export type Genero = (typeof GENEROS_EN_VIVO)[number]["valor"]

export const etiquetaGenero = (g: string) => GENEROS_EN_VIVO.find((x) => x.valor === g)?.label ?? g

/** Fisher-Yates. Se baraja en el SERVIDOR y el orden viaja al formulario como
 *  prop: si se barajara en el navegador, el HTML del servidor y el del cliente
 *  no coincidirían y React rompería la hidratación. */
export function barajar<T>(lista: readonly T[]): T[] {
  const copia = [...lista]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}

/* ---------- qué tipo de persona es (lo marca el EQUIPO) ---------- */

export const TIPOS_PERSONA = [
  { valor: "publico", label: "Público general" },
  { valor: "influencer", label: "Influencer" },
  { valor: "creador", label: "Creador de contenido" },
  { valor: "artista", label: "Artista" },
  { valor: "marca", label: "Marca" },
  { valor: "medio", label: "Medio o prensa" },
  { valor: "produccion", label: "Equipo de producción" },
] as const

export type TipoPersona = (typeof TIPOS_PERSONA)[number]["valor"]

export const etiquetaTipoPersona = (t: string) => TIPOS_PERSONA.find((x) => x.valor === t)?.label ?? t

/* ---------- lo que se muestra de cada fiesta ---------- */

export interface Dinamica {
  /** Un emoji. Va en la etiqueta del bloque, en la web y en el correo. */
  icono: string
  titulo: string
  reglas: string[]
}

export interface ContenidoEvento {
  etiqueta: string
  titular: string
  bajada: string
  /** Lo que acompaña al link de invitación cuando se comparte por WhatsApp. */
  compartir: string
  /** Cómo se entra, para la cabecera. NUNCA "gratis": a quien se le regala la
   *  entrada a cambio de compartir, "gratis" le dice que no vale nada. Lo que
   *  se nombra es el acceso restringido, que es lo que la hace valiosa. */
  acceso: string
  /** La cifra grande de la cabecera: lo primero que se lee de la fiesta. */
  /** `nota` va debajo, pequeña pero visible. Para un premio tiene que decir
   *  QUIÉN lo da: quien publica una promoción queda obligado por ella (Ley
   *  1480, art. 33), así que si no se dice, el obligado es quien publica. */
  destacado?: { valor: string; texto: string; nota?: string }
  /** Las dinámicas de la noche, en el orden en que se muestran. */
  dinamicas?: Dinamica[]
}

export const CONTENIDO_EVENTOS: Record<string, ContenidoEvento> = {
  "coronacion-mg1": {
    etiqueta: "MG1 / La noche final",
    titular: "La Coronación",
    bajada:
      "Esta noche se corona al primer campeón de MG1, en vivo y con la gente que lo vio nacer. " +
      "Es víspera de Halloween: ven disfrazado. " +
      "Se entra por invitación: tu pase es personal, llega a tu correo y es la única forma de entrar.",
    // Quien comparte INVITA, no reenvía un link: el que lo recibe entra por
    // alguien, y eso es lo que hace que la lista se sienta privada.
    compartir:
      "Te incluyo en la lista de La Coronación de MG1, el viernes 30 en DEF (Soacha). " +
      "Es víspera de Halloween y DEF da $3.000.000 al mejor disfraz. Confirma tu lugar y te llega el pase al correo:",
    acceso: "Solo por invitación",
    destacado: {
      valor: "$3.000.000",
      texto: "al mejor disfraz de la noche",
      nota: "Premio ofrecido y pagado por Def Jamaica Club · aplican términos",
    },
    dinamicas: [
      {
        icono: "🎭",
        titulo: "Ven disfrazado",
        reglas: [
          "El 30 es víspera de Halloween: ven disfrazado, solo o con tu parche.",
          "Def Jamaica Club entrega $3.000.000 al mejor disfraz de la noche: un solo ganador, elegido por el jurado de DEF.",
          "MG tiene sorpresas para algunos de los parches que lleguen disfrazados.",
          "El ganador se anuncia esa misma noche. Aplican términos y condiciones.",
        ],
      },
      {
        icono: "🍾",
        titulo: "Una botella para tu parche",
        reglas: [
          `Comenta y comparte los capítulos de MG1 y los posts de la fiesta, etiquetando a @${MG_INSTAGRAM}.`,
          "Invita con tu link personal: la gente que llegue a la fiesta con él también te suma.",
          "MG le entrega una botella al perfil más activo, esa misma noche, para su parche.",
          "Cerramos a las 8:00 p.m. del viernes 30 y anunciamos al ganador en la fiesta.",
        ],
      },
    ],
  },
}

/** Lo que exige la ley junto a cualquier promoción con alcohol en Colombia. */
export const LEYENDA_ALCOHOL =
  "Solo mayores de 18. El exceso de alcohol es perjudicial para la salud. " +
  "Prohíbase el expendio de bebidas embriagantes a menores de edad."

export const EDAD_MINIMA = 18

/* ---------- el pase ---------- */

/** El código del correo de PRUEBA (enviarPase con `prueba: true`). No existe
 *  en la base: el pase lo pinta como demostración y la puerta lo rechaza
 *  diciendo que es de prueba. Así el equipo puede recorrer correo → pase →
 *  puerta sin inscribir a nadie. */
export const CODIGO_PRUEBA = "MGE-PRUEBA22"

/** La fiesta de la sección "Fiesta Def" del panel. Si DEF repite con otra
 *  fecha, se cambia aquí y en puede_ver_fiesta_def() (migración 028). */
export const EVENTO_FIESTA_DEF = "coronacion-mg1"

/** Lo que entrega el lector de la puerta, venga como venga: el texto del QR
 *  (la URL del pase), el código tecleado a mano, en minúsculas o con espacios.
 *  Prefijo MGE- para no confundirse nunca con un pase de la Gala (MG-). */
export function codigoDeEvento(bruto: string): string | null {
  const limpio = bruto.trim()
  if (!limpio) return null
  const desdeUrl = limpio.match(/\/pase\/(MGE-[A-Za-z0-9]+)/i)
  const candidato = (desdeUrl ? desdeUrl[1] : limpio).toUpperCase().replace(/\s+/g, "")
  return /^MGE-[A-Z0-9]{8}$/.test(candidato) ? candidato : null
}

/* ---------- el formulario ---------- */

const utm = z.string().trim().max(60).optional().or(z.literal(""))

export const registroEventoSchema = z
  .object({
    evento: z.string().trim().min(1).max(60),
    // En la Gala varias personas escribieron su cédula en este campo, y una
    // lista de puerta con "1019128264" no le sirve a nadie para saludar.
    nombre: z
      .string()
      .trim()
      .min(3, "Escribe tu nombre y apellido")
      .max(80, "Máximo 80 caracteres")
      .refine((v) => /\p{L}/u.test(v) && !/\d{5,}/.test(v), "Escribe tu nombre, no tu número de documento"),
    email: z.string().trim().toLowerCase().email("Ingresa un correo válido").max(120, "Máximo 120 caracteres"),
    whatsapp: z
      .string()
      .trim()
      .min(1, "Escribe tu WhatsApp")
      .refine((v) => normalizarWhatsapp(v) !== null, "Revisa el número: 10 dígitos, como 300 123 4567"),
    instagram: z.string().trim().max(120).optional().or(z.literal("")),
    tiktok: z.string().trim().max(120).optional().or(z.literal("")),
    fecha_nacimiento: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Escribe tu fecha de nacimiento"),
    generos: z.array(z.enum(GENEROS_EN_VIVO.map((g) => g.valor) as [Genero, ...Genero[]])).max(GENEROS_EN_VIVO.length).default([]),
    acepta_invitaciones: z.boolean().default(false),
    acepta_datos: z.literal(true, {
      errorMap: () => ({ message: "Necesitamos tu autorización para registrarte" }),
    }),
    ref: z.string().trim().max(12).optional().or(z.literal("")),
    utm_source: utm,
    utm_medium: utm,
    utm_campaign: utm,
    // Honeypot: los bots llenan todo. El servidor descarta en silencio lo que
    // lo trae lleno, para no decirle al bot que lo pilló.
    website: z.string().optional(),
  })
  .superRefine((d, ctx) => {
    const ig = d.instagram ? usuarioDeRed(d.instagram, "instagram") : null
    const tt = d.tiktok ? usuarioDeRed(d.tiktok, "tiktok") : null
    if (d.instagram && !ig) {
      ctx.addIssue({ code: "custom", path: ["instagram"], message: "Escribe tu usuario (@tucuenta) o el link de tu perfil, no el de un post" })
    }
    if (d.tiktok && !tt) {
      ctx.addIssue({ code: "custom", path: ["tiktok"], message: "Escribe tu usuario (@tucuenta) o el link de tu perfil" })
    }
    if (!d.instagram && !d.tiktok) {
      ctx.addIssue({ code: "custom", path: ["instagram"], message: "Déjanos al menos tu Instagram o tu TikTok" })
    }
  })

export type RegistroEventoInput = z.infer<typeof registroEventoSchema>

export interface RespuestaRegistroEvento {
  ok: true
  /** El link de promotor de esta persona, para compartir de una. */
  ref: string
  /** false = ya estaba registrada; se le reenvió el pase. */
  nuevo: boolean
}

/** "Def Jamaica Club · Cra. 7, zona rosa de Soacha", sin repetir la ciudad.
 *  La dirección suele traerla ya, y ponerla otra vez al final ("… de Soacha ·
 *  Soacha") se lee como un error en el pase y en el correo. */
export function lugarCompleto(e: { lugar: string; direccion: string | null; ciudad: string }): string {
  const ciudad = e.ciudad.toLowerCase()
  const yaLaDice = [e.lugar, e.direccion].some((x) => x?.toLowerCase().includes(ciudad))
  return [e.lugar, e.direccion, yaLaDice ? null : e.ciudad].filter(Boolean).join(" · ")
}

/* ---------- fechas para mostrar ---------- */

export function fechaEvento(iso: string): string {
  const texto = new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Bogota",
  }).format(new Date(`${iso}T12:00:00-05:00`))
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

/** "18:00:00" → "6:00 p.m." Nadie en Bogotá dice "a las 18". */
export function horaEvento(hora: string): string {
  const [h, m] = hora.split(":").map(Number)
  const sufijo = h >= 12 ? "p.m." : "a.m."
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, "0")} ${sufijo}`
}
