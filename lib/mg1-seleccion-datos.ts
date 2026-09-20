import "server-only"

import { mkdir, readFile, writeFile } from "fs/promises"
import { join } from "path"

import { getSupabaseAdmin } from "./supabase-admin"
import {
  MG1_EDICION,
  type ComentarioJurado,
  type FichaJurado,
} from "./mg1-seleccion"

/* ============================================================
   De donde salen los datos
   ============================================================
   La mesa del jurado lee datos personales de 32 terceros, asi que exige la
   service_role EXPLICITAMENTE y no se conforma con "hay un cliente de
   Supabase". getSupabaseAdmin() cae a la publishable key cuando no hay
   service_role, y con esa key mg1_inscripciones no tiene policy de SELECT: la
   consulta no falla, devuelve CERO FILAS. Una mesa vacia que parece "todavia
   no hay preseleccionados" es peor que un error: manda al jurado a esperar
   algo que ya estaba ahi. Por eso se distingue antes de consultar. */
function hayServiceRole() {
  return !!process.env.SUPABASE_SERVICE_ROLE_KEY
}

/** En desarrollo, sin credenciales, la mesa corre contra un archivo local con
 *  fichas de mentira. Es el mismo trato que ya tiene el formulario de
 *  inscripcion (.data/mg1-inscripciones.jsonl): poder probar el flujo completo
 *  sin una copia de datos reales en la maquina de nadie. En produccion nunca
 *  se usa. */
const DEV_STORE = join(process.cwd(), ".data", "mg1-seleccion-dev.json")

export type Fuente = "supabase" | "dev"

export interface Mesa {
  fichas: FichaJurado[]
  /** Ids que ESTE jurado ya marco. */
  misVotos: string[]
  /** inscripcion_id -> lo que escribieron los jurados (todos, incluido el propio). */
  comentarios: Record<string, ComentarioJurado[]>
  fuente: Fuente
}

export class MesaNoDisponible extends Error {}

/* ---------- respaldo de desarrollo ---------- */

interface DevData {
  fichas: FichaJurado[]
  votos: { jurado: string; inscripcion_id: string }[]
  comentarios: { jurado: string; inscripcion_id: string; texto: string; updated_at: string }[]
}

const CIUDADES = ["Bogotá", "Soacha", "Medellín", "Cali", "Cartagena", "Barranquilla", "Ibagué", "Bucaramanga"]
const DEMO_LINKS = [
  "https://open.spotify.com/track/6USG3UdSLTO0Rwq4DiKBB6",
  "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "https://open.spotify.com/artist/7wXE9ROf93Y39SOKmTphYH",
  "https://youtu.be/aqz-KE-bpKQ",
  "https://soundcloud.com/demo/track",
  "https://www.instagram.com/reel/Cxyz123/",
]

/** 32 fichas de mentira, las mismas en cada arranque (sin azar: si cambian de
 *  nombre en cada recarga no se puede probar nada). */
function fichasDemo(): FichaJurado[] {
  return Array.from({ length: 32 }, (_, k) => ({
    id: `00000000-0000-4000-8000-${String(k + 1).padStart(12, "0")}`,
    nombre_artistico: `Demo ${String(k + 1).padStart(2, "0")}`,
    ciudad: CIUDADES[k % CIUDADES.length],
    link_musica: DEMO_LINKS[k % DEMO_LINKS.length],
    por_que:
      k % 4 === 0
        ? null
        : `Llevo ${3 + (k % 7)} años haciendo música sin que nadie me abra una puerta. MG1 es esa puerta.`,
  }))
}

async function leerDev(): Promise<DevData> {
  try {
    const crudo = await readFile(DEV_STORE, "utf8")
    const datos = JSON.parse(crudo) as Partial<DevData>
    return {
      // `?? ` y no `?.length ?`: un "fichas": [] escrito a mano significa
      // "quiero ver la mesa vacia", y reponerle las demo seria discutirle al
      // que esta probando justo el caso que quiere probar.
      fichas: datos.fichas ?? fichasDemo(),
      votos: datos.votos ?? [],
      comentarios: datos.comentarios ?? [],
    }
  } catch {
    return { fichas: fichasDemo(), votos: [], comentarios: [] }
  }
}

async function escribirDev(datos: DevData) {
  await mkdir(join(process.cwd(), ".data"), { recursive: true })
  await writeFile(DEV_STORE, JSON.stringify(datos, null, 2), "utf8")
}

function modoDev() {
  return !hayServiceRole() && process.env.NODE_ENV !== "production"
}

/* ---------- lectura ---------- */

export async function cargarMesa(juradoSlug: string): Promise<Mesa> {
  if (modoDev()) {
    const d = await leerDev()
    return {
      fichas: d.fichas,
      misVotos: d.votos.filter((v) => v.jurado === juradoSlug).map((v) => v.inscripcion_id),
      comentarios: agrupar(d.comentarios.map((c) => ({ ...c, actualizado: c.updated_at }))),
      fuente: "dev",
    }
  }

  const sb = getSupabaseAdmin()
  if (!sb || !hayServiceRole()) {
    throw new MesaNoDisponible(
      "Falta SUPABASE_SERVICE_ROLE_KEY: sin ella no se pueden leer las fichas de los preseleccionados.",
    )
  }

  const [fichas, votos, comentarios] = await Promise.all([
    sb
      .from("mg1_inscripciones")
      .select("id,nombre_artistico,ciudad,link_musica,por_que")
      .eq("edicion", MG1_EDICION)
      .eq("estado", "preseleccionado")
      // Orden alfabetico y no por fecha de inscripcion: quien se inscribio
      // primero no tiene por que aparecer primero ante el jurado.
      .order("nombre_artistico", { ascending: true }),
    sb
      .from("mg1_jurado_votos")
      .select("inscripcion_id")
      .eq("edicion", MG1_EDICION)
      .eq("jurado", juradoSlug),
    sb
      .from("mg1_jurado_comentarios")
      .select("jurado,inscripcion_id,texto,updated_at")
      .eq("edicion", MG1_EDICION),
  ])

  // Se registra el error COMPLETO y no solo .message: cuando PostgREST no
  // encuentra una tabla (PGRST205) el `hint` trae la lista de las que si ve, y
  // eso distingue en un vistazo una cache de esquema vieja de estar apuntando
  // a otro proyecto. Con solo el mensaje, las dos se leen igual.
  const fallo = (que: string, e: { message: string; code?: string; details?: string; hint?: string }) => {
    console.error(`[mg1/seleccion] ${que}:`, JSON.stringify(e))
    return new MesaNoDisponible(`${que}: ${e.message}`)
  }

  if (fichas.error) throw fallo("fichas", fichas.error)
  if (votos.error) throw fallo("votos", votos.error)
  if (comentarios.error) throw fallo("comentarios", comentarios.error)

  return {
    fichas: (fichas.data ?? []) as FichaJurado[],
    misVotos: (votos.data ?? []).map((v) => v.inscripcion_id as string),
    comentarios: agrupar(
      (comentarios.data ?? []).map((c) => ({
        jurado: c.jurado as string,
        inscripcion_id: c.inscripcion_id as string,
        texto: c.texto as string,
        actualizado: c.updated_at as string,
      })),
    ),
    fuente: "supabase",
  }
}

function agrupar(
  filas: { jurado: string; inscripcion_id: string; texto: string; actualizado: string }[],
): Record<string, ComentarioJurado[]> {
  const out: Record<string, ComentarioJurado[]> = {}
  for (const f of filas) {
    ;(out[f.inscripcion_id] ??= []).push({ jurado: f.jurado, texto: f.texto, actualizado: f.actualizado })
  }
  return out
}

/* ---------- escritura ---------- */

/** Codigos de Postgres que este flujo sabe traducir. */
const PG_UNIQUE = "23505"
const PG_CHECK = "23514"
const PG_RAISE_CHECK = "P0001"

export type ResultadoVoto =
  | { ok: true; marcado: boolean }
  | { ok: false; error: string; tope?: true }

export async function alternarVoto(
  jurado: string,
  inscripcionId: string,
  marcar: boolean,
): Promise<ResultadoVoto> {
  if (modoDev()) {
    const d = await leerDev()
    const yaEsta = d.votos.some((v) => v.jurado === jurado && v.inscripcion_id === inscripcionId)
    if (marcar && !yaEsta) {
      // El tope tambien aqui: si el respaldo de desarrollo dejara marcar 13,
      // probariamos en local un flujo que en produccion no existe.
      if (d.votos.filter((v) => v.jurado === jurado).length >= 12) {
        return { ok: false, error: "Ya tienes tus 12", tope: true }
      }
      d.votos.push({ jurado, inscripcion_id: inscripcionId })
    }
    if (!marcar) {
      d.votos = d.votos.filter((v) => !(v.jurado === jurado && v.inscripcion_id === inscripcionId))
    }
    await escribirDev(d)
    return { ok: true, marcado: marcar }
  }

  const sb = getSupabaseAdmin()
  if (!sb || !hayServiceRole()) return { ok: false, error: "La mesa no está disponible ahora mismo." }

  if (!marcar) {
    const { error } = await sb
      .from("mg1_jurado_votos")
      .delete()
      .eq("edicion", MG1_EDICION)
      .eq("jurado", jurado)
      .eq("inscripcion_id", inscripcionId)
    if (error) return { ok: false, error: "No se pudo quitar la ficha." }
    return { ok: true, marcado: false }
  }

  const { error } = await sb
    .from("mg1_jurado_votos")
    .insert({ edicion: MG1_EDICION, jurado, inscripcion_id: inscripcionId })

  if (error) {
    // Ya estaba marcada (doble clic, dos pestañas): el estado que queria el
    // jurado es justo el que hay. No es un error para el.
    if (error.code === PG_UNIQUE) return { ok: true, marcado: true }
    // El trigger mg1_tope_del_jurado. Es la unica razon por la que el
    // servidor rechaza un voto valido, y la interfaz sabe convertirlo en el
    // cuadro de "ya tienes tus 12".
    if (error.code === PG_CHECK || error.code === PG_RAISE_CHECK) {
      return { ok: false, error: "Ya tienes tus 12", tope: true }
    }
    console.error("[mg1/seleccion] voto:", error)
    return { ok: false, error: "No se pudo guardar la ficha." }
  }

  return { ok: true, marcado: true }
}

export async function guardarComentario(
  jurado: string,
  inscripcionId: string,
  texto: string,
): Promise<{ ok: boolean; error?: string }> {
  const limpio = texto.trim()

  if (modoDev()) {
    const d = await leerDev()
    d.comentarios = d.comentarios.filter(
      (c) => !(c.jurado === jurado && c.inscripcion_id === inscripcionId),
    )
    if (limpio) {
      d.comentarios.push({
        jurado,
        inscripcion_id: inscripcionId,
        texto: limpio,
        updated_at: new Date().toISOString(),
      })
    }
    await escribirDev(d)
    return { ok: true }
  }

  const sb = getSupabaseAdmin()
  if (!sb || !hayServiceRole()) return { ok: false, error: "La mesa no está disponible ahora mismo." }

  // Borrar el texto es borrar el comentario. Guardar una fila vacia dejaria a
  // los demas jurados viendo una firma sin opinion debajo.
  if (!limpio) {
    const { error } = await sb
      .from("mg1_jurado_comentarios")
      .delete()
      .eq("edicion", MG1_EDICION)
      .eq("jurado", jurado)
      .eq("inscripcion_id", inscripcionId)
    if (error) return { ok: false, error: "No se pudo borrar el comentario." }
    return { ok: true }
  }

  const { error } = await sb
    .from("mg1_jurado_comentarios")
    .upsert(
      { edicion: MG1_EDICION, jurado, inscripcion_id: inscripcionId, texto: limpio },
      { onConflict: "edicion,jurado,inscripcion_id" },
    )

  if (error) {
    console.error("[mg1/seleccion] comentario:", error)
    return { ok: false, error: "No se pudo guardar el comentario." }
  }
  return { ok: true }
}
