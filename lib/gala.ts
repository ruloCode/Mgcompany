import { z } from "zod"

/* ============================================================
   Gala MG — primer encuentro presencial de la comunidad
   ============================================================
   Una sola fuente para las tres capas: la landing la muestra, el route
   handler la valida y el panel la cura. Si cambia una fecha o un cupo, se
   cambia aquí y en la migración 019 (el cupo vive también en Postgres, que
   es quien decide de verdad quién entra en la lista de espera).

   Por qué el cupo se decide en la base y no aquí: dos personas enviando el
   formulario en el mismo segundo verían el mismo conteo y las dos entrarían
   como cupo principal. El trigger `gala_asignar_cupo` serializa esa decisión.
*/

export const GALA_EDICION = "gala-2026-10-11"

/** ISO local. La etiqueta del día se deriva: escribirla a mano se desfasa. */
export const GALA_FECHA = "2026-10-11"
export const GALA_HORA_INICIO = "17:00"
export const GALA_HORA_FIN = "21:00"

/** Las de arriba son para calcular (la cuenta regresiva); estas para mostrar.
 *  Nadie en Bogotá dice "de 17:00 a 21:00". */
export const GALA_HORA_INICIO_TXT = "5:00 p.m."
export const GALA_HORA_FIN_TXT = "9:00 p.m."
export const GALA_HORARIO = "5:00 a 9:00 p.m."
export const GALA_CIUDAD = "Bogotá"

/** Aforo total del salón. Espejo de gala_cupo() en la migración 019. */
export const GALA_CUPO = 80

/** De dónde sale el aforo. Se muestra en la landing: el cupo es corto porque
 *  el evento es privado, no porque haya escasez inventada.
 *
 *  OJO A LA SUMA: 22 artistas + 2 invitados cada uno son 66 sillas, así que al
 *  gremio le quedan 14, no 20. Si el equipo quiere 20 para managers y
 *  productores, hay que bajar invitados o subir el aforo — no las dos cosas. */
export const GALA_REPARTO = [
  { valor: 22, label: "Artistas confirmados", sub: "El roster y la comunidad" },
  { valor: 44, label: "Invitados", sub: "Dos por artista" },
  { valor: 14, label: "Gremio", sub: "Managers y productores" },
] as const

/** Cronograma de las cuatro horas. PENDIENTE de confirmar con producción:
 *  estos bloques son la estructura acordada (llegada → bienvenida → showcase
 *  → networking → cierre), no los horarios definitivos. Editar aquí. */
export const GALA_CRONOGRAMA = [
  {
    hora: "5:00 p.m.",
    titulo: "Acreditación",
    desc: "Llegada, registro con tu QR y bienvenida en la puerta.",
  },
  {
    hora: "5:30 p.m.",
    titulo: "Apertura MG",
    desc: "El equipo abre la noche: qué es MG y hacia dónde va la comunidad.",
  },
  {
    hora: "6:00 p.m.",
    titulo: "Showcase de artistas",
    desc: "Presentaciones en vivo del roster y de los artistas de la comunidad.",
  },
  {
    hora: "7:30 p.m.",
    titulo: "Networking",
    desc: "Artistas, managers y productores en la misma sala. A eso venimos.",
  },
  {
    hora: "8:30 p.m.",
    titulo: "Cierre",
    desc: "Foto de familia, anuncios de lo que viene y despedida.",
  },
] as const

export const TIPOS_ASISTENTE = [
  { valor: "artista",    label: "Artista" },
  { valor: "productor",  label: "Productor" },
  { valor: "influencer", label: "Influencer" },
  { valor: "asistente",  label: "Asistente (público general)" },
] as const

export const RANGOS_EDAD = ["16-20", "21-25", "26-30", "31-35", "36+"] as const

/** pending: registrado, a la espera del visto bueno del equipo.
 *  confirmed: adentro — es el único estado que genera el QR.
 *  waitlist: llegó después del cupo 80. No es un rechazo.
 *  rejected: el equipo ejerció el derecho de admisión. */
export const ESTADOS_GALA = [
  { valor: "pending",   label: "Por revisar",     color: "var(--warning)" },
  { valor: "confirmed", label: "Confirmado",      color: "var(--good)" },
  { valor: "waitlist",  label: "Lista de espera", color: "var(--c-sesion)" },
  { valor: "rejected",  label: "No admitido",     color: "var(--muted)" },
] as const

export type EstadoGala = (typeof ESTADOS_GALA)[number]["valor"]
export type TipoAsistente = (typeof TIPOS_ASISTENTE)[number]["valor"]
export type RangoEdad = (typeof RANGOS_EDAD)[number]

const tipos = TIPOS_ASISTENTE.map((t) => t.valor) as [TipoAsistente, ...TipoAsistente[]]

/** Deja un @handle limpio: la gente pega la URL completa tanto como el arroba. */
const handle = (max = 40) =>
  z
    .string()
    .trim()
    .max(120, "Máximo 120 caracteres")
    .transform((v) =>
      v
        .replace(/^https?:\/\/(www\.)?(instagram|tiktok)\.com\//i, "")
        .replace(/^@/, "")
        .replace(/\/.*$/, "")
        .trim(),
    )
    .refine((v) => v === "" || /^[\w.]{1,40}$/.test(v), "Solo letras, números, punto y guion bajo")
    .refine((v) => v.length <= max, `Máximo ${max} caracteres`)
    .optional()
    .or(z.literal(""))

// Schema compartido cliente/servidor, como en MG1: el cliente valida antes de
// enviar y el route handler vuelve a validar porque nunca se confía en él.
export const registroGalaSchema = z.object({
  nombre_completo: z
    .string()
    .trim()
    .min(3, "Escribe tu nombre completo")
    .max(80, "Máximo 80 caracteres"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Ingresa un correo válido")
    .max(120, "Máximo 120 caracteres"),
  celular: z
    .string()
    .trim()
    .min(7, "Ingresa un número válido")
    .max(20, "Máximo 20 caracteres")
    .regex(/^[+()\d\s-]+$/, "Solo números, espacios, + y -"),
  nombre_artistico: z.string().trim().max(60, "Máximo 60 caracteres").optional().or(z.literal("")),
  tipo_asistente: z.enum(tipos, { errorMap: () => ({ message: "Elige cómo llegas a la Gala" }) }),
  instagram: handle(),
  tiktok: handle(),
  rango_edad: z.enum(RANGOS_EDAD, { errorMap: () => ({ message: "Elige tu rango de edad" }) }),
  acepta_terminos: z.literal(true, {
    errorMap: () => ({ message: "Necesitamos tu autorización para registrarte" }),
  }),
  // Honeypot: los bots llenan todo, las personas no ven este campo. El route
  // handler descarta en silencio lo que lo trae lleno.
  website: z.string().optional(),
})

export type RegistroGalaInput = z.infer<typeof registroGalaSchema>

/** Lo que devuelve el endpoint: la UI necesita distinguir cupo de lista de espera. */
export interface RespuestaRegistro {
  ok: true
  estado: Extract<EstadoGala, "pending" | "waitlist">
  restantes: number
}

export const etiquetaTipo = (t: string): string =>
  TIPOS_ASISTENTE.find((x) => x.valor === t)?.label ?? t

export const etiquetaEstado = (e: string): string =>
  ESTADOS_GALA.find((x) => x.valor === e)?.label ?? e

export const colorEstado = (e: string): string =>
  ESTADOS_GALA.find((x) => x.valor === e)?.color ?? "var(--muted)"

/** "Domingo 11 de octubre" sin escribir el día de la semana a mano. */
export function fechaLarga(iso: string = GALA_FECHA): string {
  const [a, m, d] = iso.split("-").map(Number)
  const fecha = new Date(a, m - 1, d, 12)
  const texto = new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(fecha)
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}
