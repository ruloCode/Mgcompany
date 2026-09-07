import "server-only"

import { createClient } from "@/lib/supabase/server"
import { AJUSTES_DEFAULT, REGLAS_DEFAULT } from "./constantes"
import type { Aviso, Comentario, Perfil, ReporteSalud, Reunion, Snapshot } from "./tipos"
import type { Disponibilidad } from "@/lib/mg1-disponibilidad"

/** El perfil del usuario autenticado, o null si no hay sesion o esta inactivo. */
export async function perfilActual(): Promise<Perfil | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from("perfiles")
    .select("id, email, nombre, rol, activo, avatar_url, artista_id, capacidad_semanal, ultimo_acceso, created_at, secciones_extra, permisos_extra")
    .eq("id", user.id)
    .maybeSingle()

  if (!data || !data.activo) return null
  const perfil = data as Perfil

  // "Ver como": owner y admin pueden previsualizar el panel de otro rol para
  // saber qué ve cada equipo. Solo cambia el ROL que la interfaz usa para
  // decidir qué mostrar; la identidad, el id y la sesión siguen siendo los
  // reales, así que RLS sigue respondiendo al rol de verdad. Es una lente,
  // no una suplantación.
  //
  // El permiso se comprueba aquí, en el servidor, contra el rol REAL leído de
  // la base: una cookie manipulada por alguien sin permiso no hace nada.
  if (perfil.rol === "owner" || perfil.rol === "admin") {
    const cookies = await import("next/headers").then((m) => m.cookies())
    const visto = cookies.get("mg-ver-como")?.value
    if (visto && visto !== perfil.rol && ROLES_VALIDOS.has(visto)) {
      // Se previsualiza un ROL, así que las concesiones individuales de quien
      // mira se apagan: con ellas puestas, un owner vería un panel que ninguna
      // persona con ese rol tiene, que es justo lo contrario de lo que busca.
      return {
        ...perfil,
        rol: visto as Perfil["rol"],
        secciones_extra: [],
        permisos_extra: [],
        verComoReal: perfil.rol,
      }
    }
  }

  return perfil
}

const ROLES_VALIDOS = new Set([
  "owner", "admin", "manager", "contenido", "produccion", "audiovisual", "artista", "viewer",
])

/**
 * Carga todo lo que el motor de eventos necesita para derivar el calendario.
 * Una sola ida a la base por request: el volumen es de decenas de filas por
 * tabla, asi que paginar o cargar por seccion complicaria mas de lo que ahorra.
 */
export async function cargarSnapshot(): Promise<Snapshot> {
  const supabase = await createClient()

  const [artistas, proyectos, estados, extra, config, publicaciones, radar, textos, bitacora, equipo, comentarios] =
    await Promise.all([
      supabase.from("mg_artistas").select("*").order("orden"),
      supabase.from("mg_proyectos").select("*").order("release"),
      supabase.from("mg_eventos_estado").select("*"),
      supabase.from("mg_eventos_extra").select("*"),
      supabase.from("mg_config").select("*").eq("id", "global").maybeSingle(),
      supabase.from("mg_publicaciones").select("*").order("fecha"),
      supabase.from("mg_radar").select("*").order("nombre"),
      supabase.from("mg_textos").select("*").order("created_at", { ascending: false }),
      supabase.from("mg_bitacora").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("perfiles")
        .select("id, email, nombre, rol, activo, avatar_url, artista_id, capacidad_semanal, ultimo_acceso, created_at, secciones_extra, permisos_extra")
        .eq("activo", true).order("nombre"),
      supabase.from("mg_comentarios").select("*").order("created_at"),
    ])

  const eventosEstado: Snapshot["eventosEstado"] = {}
  for (const e of estados.data ?? []) {
    eventosEstado[e.evento_id] = {
      evento_id: e.evento_id,
      fecha_override: e.fecha_override,
      hecho: e.hecho,
      eliminado: e.eliminado,
      responsable_id: e.responsable_id,
      prioridad: e.prioridad,
      hecho_at: e.hecho_at,
    }
  }

  return {
    artistas: artistas.data ?? [],
    proyectos: proyectos.data ?? [],
    eventosEstado,
    eventosExtra: extra.data ?? [],
    config: {
      // Los defaults cubren las claves que una config guardada por una version
      // anterior todavia no tenga.
      reglas: { ...REGLAS_DEFAULT, ...(config.data?.reglas ?? {}) },
      ajustes: { ...AJUSTES_DEFAULT, ...(config.data?.ajustes ?? {}) },
      slots: config.data?.slots ?? null,
    },
    publicaciones: publicaciones.data ?? [],
    radar: radar.data ?? [],
    textos: textos.data ?? [],
    bitacora: bitacora.data ?? [],
    equipo: (equipo.data ?? []) as Perfil[],
    comentarios: (comentarios.data ?? []) as Comentario[],
  }
}

/** Bandeja de la persona en sesion. Solo devuelve lo suyo: lo garantiza RLS. */
export async function cargarAvisos(): Promise<Aviso[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("mg_avisos")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(80)
  return (data ?? []) as Aviso[]
}

export async function cargarReuniones(): Promise<Reunion[]> {
  const supabase = await createClient()
  const { data } = await supabase.from("mg_reuniones").select("*").order("fecha", { ascending: false })
  return (data ?? []) as Reunion[]
}

export async function cargarReunion(id: string): Promise<Reunion | null> {
  const supabase = await createClient()
  const { data } = await supabase.from("mg_reuniones").select("*").eq("id", id).maybeSingle()
  return (data as Reunion) ?? null
}

export async function cargarHistorialSalud(): Promise<ReporteSalud[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("mg_salud_historial")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(120)
  return (data ?? []) as ReporteSalud[]
}

export async function cargarEquipo(): Promise<Perfil[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("perfiles")
    .select("id, email, nombre, rol, activo, avatar_url, artista_id, capacidad_semanal, ultimo_acceso, created_at, secciones_extra, permisos_extra")
    .order("created_at")
  return (data ?? []) as Perfil[]
}

export interface InscripcionMG1 {
  id: string
  edicion: string
  nombre_artistico: string
  nombre_completo: string
  email: string
  celular: string
  ciudad: string
  link_musica: string
  por_que: string | null
  estado: string
  notas: string | null
  /** Fecha -> franjas confirmadas. Ver lib/mg1-disponibilidad.ts. */
  disponibilidad: Disponibilidad
  /** null = todavia no se le ha preguntado (distinto de "no puede ningun dia"). */
  disponibilidad_actualizada: string | null
  created_at: string
}

export async function cargarInscripcionesMG1(): Promise<InscripcionMG1[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("mg1_inscripciones")
    .select("*")
    .order("created_at", { ascending: false })
  return (data ?? []) as InscripcionMG1[]
}

export interface RegistroGala {
  id: string
  edicion: string
  nombre_completo: string
  email: string
  celular: string
  nombre_artistico: string | null
  tipo_asistente: string
  instagram: string | null
  tiktok: string | null
  rango_edad: string
  estado: string
  notas: string | null
  /** Solo existe cuando el estado es 'confirmed'. Lo emite la base. */
  codigo: string | null
  confirmado_at: string | null
  /** Marca de entrada la noche del evento. null = todavia no ha llegado. */
  ingreso_at: string | null
  created_at: string
}

export async function cargarRegistrosGala(): Promise<RegistroGala[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("gala_registros")
    .select("*")
    .order("created_at", { ascending: true })
  return (data ?? []) as RegistroGala[]
}
