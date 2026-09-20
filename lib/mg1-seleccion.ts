import { z } from "zod"

import { MG1_EDICION } from "./mg1-inscripcion"

export { MG1_EDICION }

/** Cuantas fichas puede marcar cada jurado.
 *  Espejo de mg1_tope_jurado() en la migracion 022 — cambiarlo aqui no cambia
 *  nada: el que manda es el trigger. Esto es para poder dibujar "7 / 12". */
export const MG1_TOPE_JURADO = 12

export interface Jurado {
  /** Slug del enlace privado: /mg1/seleccion/<slug>. ES la identidad. */
  slug: string
  nombre: string
  /** Como se firma en los comentarios que ven los demas. */
  corto: string
}

/** La mesa. Agregar un jurado es agregar una linea aqui y pasarle su enlace;
 *  no hay nada que crear en la base. */
export const JURADOS: Jurado[] = [
  { slug: "miguelacho-tf", nombre: "Miguelacho TF", corto: "Miguelacho" },
  { slug: "jony-roy", nombre: "Jony Roy", corto: "Jony Roy" },
  { slug: "queens-tafari", nombre: "Queens Tafari", corto: "Queens Tafari" },
]

export function buscarJurado(slug: string): Jurado | null {
  const key = slug.toLowerCase()
  return JURADOS.find((j) => j.slug === key) ?? null
}

/** Nombre para firmar un comentario de alguien que ya no esta en la lista
 *  (se le quito el enlace despues de haber escrito). No se pierde lo escrito. */
export function nombreDeJurado(slug: string): string {
  return buscarJurado(slug)?.corto ?? slug
}

/* ============================================================
   Lo que el jurado ve de cada persona
   ============================================================
   Deliberadamente NO viaja al navegador el nombre completo, el correo, el
   celular ni las notas internas de curaduria. El jurado escucha y opina: para
   eso le basta el nombre artistico, la ciudad, su musica y por que se inscribio.
   Es la misma regla de la migracion 018 llevada a una pagina sin login. */
export interface FichaJurado {
  id: string
  nombre_artistico: string
  ciudad: string
  link_musica: string
  por_que: string | null
}

export interface ComentarioJurado {
  jurado: string
  texto: string
  actualizado: string
}

/* ============================================================
   Validacion de lo que entra por la API
   ============================================================ */

export const votoSchema = z.object({
  jurado: z.string().trim().min(1).max(60),
  inscripcion_id: z.string().uuid("Ficha desconocida"),
  marcar: z.boolean(),
})

export const comentarioSchema = z.object({
  jurado: z.string().trim().min(1).max(60),
  inscripcion_id: z.string().uuid("Ficha desconocida"),
  texto: z.string().trim().max(1000, "Máximo 1000 caracteres"),
})

export type VotoInput = z.infer<typeof votoSchema>
export type ComentarioInput = z.infer<typeof comentarioSchema>

/* ============================================================
   Reproductor embebido
   ============================================================
   El jurado tiene que escuchar 32 links. Abrir 32 pestañas es el camino
   seguro a que escuche ocho y se canse, asi que YouTube y Spotify se
   reproducen dentro de la ficha. Lo que no reconocemos se abre aparte: es
   preferible un boton honesto a un iframe que no carga. */
export type Reproductor =
  | { tipo: "youtube" | "spotify"; src: string; alto: number }
  | { tipo: "enlace"; src: null; alto: 0 }

const SIN_REPRODUCTOR: Reproductor = { tipo: "enlace", src: null, alto: 0 }

export function reproductorDe(link: string): Reproductor {
  let url: URL
  try {
    url = new URL(link)
  } catch {
    return SIN_REPRODUCTOR
  }

  const host = url.hostname.replace(/^www\./, "").toLowerCase()

  // YouTube: youtu.be/<id>, /watch?v=<id>, /shorts/<id>, /embed/<id>
  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0]
    return id ? { tipo: "youtube", src: `https://www.youtube.com/embed/${id}`, alto: 200 } : SIN_REPRODUCTOR
  }
  if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
    const v = url.searchParams.get("v")
    if (v) return { tipo: "youtube", src: `https://www.youtube.com/embed/${v}`, alto: 200 }
    const m = url.pathname.match(/^\/(?:shorts|embed|live)\/([^/?]+)/)
    if (m) return { tipo: "youtube", src: `https://www.youtube.com/embed/${m[1]}`, alto: 200 }
    // Una playlist o un canal no tienen un video que sonar: mejor el enlace.
    return SIN_REPRODUCTOR
  }

  // Spotify: /track|album|artist|playlist|episode/<id>
  if (host === "open.spotify.com") {
    const m = url.pathname.match(/^\/(?:intl-[a-z]{2}\/)?(track|album|artist|playlist|episode)\/([^/?]+)/)
    if (m) {
      return {
        tipo: "spotify",
        src: `https://open.spotify.com/embed/${m[1]}/${m[2]}?utm_source=generator`,
        // Un track suena en la barra compacta; un artista o un album necesitan
        // la lista para que el jurado elija que oir.
        alto: m[1] === "track" || m[1] === "episode" ? 152 : 232,
      }
    }
  }

  return SIN_REPRODUCTOR
}

/** De donde sale la musica, para poder decirlo en el boton. */
export function plataformaDe(link: string): string {
  try {
    const host = new URL(link).hostname.replace(/^www\./, "").toLowerCase()
    if (host.includes("youtu")) return "YouTube"
    if (host.includes("spotify")) return "Spotify"
    if (host.includes("soundcloud")) return "SoundCloud"
    if (host.includes("instagram")) return "Instagram"
    if (host.includes("tiktok")) return "TikTok"
    if (host.includes("drive.google")) return "Drive"
    if (host.includes("audiomack")) return "Audiomack"
    if (host.includes("deezer")) return "Deezer"
    if (host.includes("apple")) return "Apple Music"
    return host
  } catch {
    return "el enlace"
  }
}
