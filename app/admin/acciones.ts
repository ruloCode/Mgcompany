"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { perfilActual } from "@/lib/mg/datos"
import { PERMISOS_EXTRA, SECCIONES, puede, tieneExtra, type Permiso } from "@/lib/mg/permisos"
import { D, evitarFestivos, fmt, hoy, masDias } from "@/lib/mg/fechas"
import type { EstadoProyecto, FichaRadar, Perfil, Publicacion, TipoEvento } from "@/lib/mg/tipos"
import { sanearDisponibilidad, type Disponibilidad } from "@/lib/mg1-disponibilidad"
import { CORREO_DE, CORREO_RESPONDER_A, getResend } from "@/lib/correo"
import { asuntoPase, htmlPase, textoPase } from "@/lib/gala-correo"

export interface Resultado {
  ok: boolean
  error?: string
  /** Id de lo recién creado, cuando la interfaz necesita abrirlo enseguida. */
  id?: string
}

const OK: Resultado = { ok: true }
const refrescar = () => revalidatePath("/admin", "layout")

/**
 * Puerta unica de todas las mutaciones. RLS ya bloquea lo que no corresponde,
 * pero comprobarlo aqui devuelve un mensaje util en vez de un error de Postgres.
 */
/**
 * Un permiso de la matriz, o una comprobación a medida cuando el acceso no
 * depende solo del rol (una concesión individual de la 017, por ejemplo).
 */
type Guardia = Permiso | ((perfil: Perfil) => boolean)

async function exigir(guardia: Guardia) {
  const perfil = await perfilActual()
  if (!perfil) redirect("/admin/login")
  const permitido = typeof guardia === "function" ? guardia(perfil) : puede(perfil.rol, guardia)
  if (!permitido) {
    throw new Error("Tu rol no tiene permiso para esta acción.")
  }
  return perfil
}

async function bitacora(mensaje: string) {
  const perfil = await perfilActual()
  const supabase = await createClient()
  await supabase.from("mg_bitacora").insert({
    mensaje,
    actor: perfil?.id ?? null,
    actor_nombre: perfil?.nombre ?? "",
  })
}

/** Envuelve una mutacion: valida permiso, corre, registra y revalida. */
async function mutar(guardia: Guardia, fn: (perfil: Perfil) => Promise<string | null>): Promise<Resultado> {
  try {
    const perfil = await exigir(guardia)
    const msg = await fn(perfil)
    if (msg) await bitacora(msg)
    refrescar()
    return OK
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado" }
  }
}

/* ============================================================
   Sesión
   ============================================================ */

export async function iniciarSesion(_prev: Resultado | null, formData: FormData): Promise<Resultado> {
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "")
  if (!email || !password) return { ok: false, error: "Escribe tu correo y tu contraseña." }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    return {
      ok: false,
      error: error.message === "Invalid login credentials"
        ? "Correo o contraseña incorrectos."
        : error.message,
    }
  }

  // Marca de último acceso: sirve en /admin/equipo para ver quién sigue activo.
  const { data: { user } } = await supabase.auth.getUser()
  if (user) await supabase.from("perfiles").update({ ultimo_acceso: new Date().toISOString() }).eq("id", user.id)

  const volver = String(formData.get("volver") ?? "/admin")
  redirect(volver.startsWith("/admin") ? volver : "/admin")
}

export async function registrarse(_prev: Resultado | null, formData: FormData): Promise<Resultado> {
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "")
  const nombre = String(formData.get("nombre") ?? "").trim()
  if (password.length < 8) return { ok: false, error: "La contraseña necesita al menos 8 caracteres." }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nombre } },
  })
  if (error) return { ok: false, error: error.message }

  // El trigger handle_new_user deja al primer usuario como owner activo y a
  // todos los demas como viewer inactivo, a la espera de que un admin apruebe.
  return { ok: true, error: "Cuenta creada. Si no eres la primera persona del equipo, un admin debe activarte antes de que puedas entrar." }
}

export async function cerrarSesion() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/admin/login")
}

/* ============================================================
   Artistas
   ============================================================ */

export async function guardarArtista(id: string, campos: { nombre?: string; tier?: string; confirmado?: boolean }) {
  return mutar("operar", async () => {
    const supabase = await createClient()
    const { data: antes } = await supabase.from("mg_artistas").select("nombre").eq("id", id).single()
    const { error } = await supabase.from("mg_artistas").update(campos).eq("id", id)
    if (error) throw new Error(error.message)

    if (campos.nombre && antes && campos.nombre !== antes.nombre) {
      return `Nombre actualizado: “${antes.nombre}” → “${campos.nombre}”.`
    }
    if (campos.confirmado) return `Nombre confirmado: ${antes?.nombre ?? id}.`
    return null
  })
}

export async function crearArtista(nombre: string, tier: "marca" | "compilado") {
  return mutar("operar", async () => {
    const supabase = await createClient()
    const { data: ultimo } = await supabase
      .from("mg_artistas").select("id, orden").order("orden", { ascending: false }).limit(1).maybeSingle()
    const n = (ultimo?.orden ?? 0) + 1
    const { error } = await supabase.from("mg_artistas").insert({
      id: `a${Date.now().toString(36)}`, nombre, tier, orden: n,
    })
    if (error) throw new Error(error.message)
    return `➕ Artista agregado al roster: ${nombre} (${tier}).`
  })
}

export async function eliminarArtista(id: string) {
  return mutar("operar", async () => {
    const supabase = await createClient()
    const { data: a } = await supabase.from("mg_artistas").select("nombre").eq("id", id).single()

    // mg_publicaciones.cuenta es texto libre (acepta 'mg'), asi que no hay FK
    // que las arrastre: hay que borrarlas a mano o quedan apuntando a nadie.
    const { data: proyectos } = await supabase.from("mg_proyectos").select("id").eq("artista_id", id)
    await supabase.from("mg_publicaciones").delete().eq("cuenta", id)
    for (const p of proyectos ?? []) {
      await supabase.from("mg_eventos_estado").delete().like("evento_id", `${p.id}:%`)
    }

    const { error } = await supabase.from("mg_artistas").delete().eq("id", id)
    if (error) throw new Error(error.message)
    return `🗑 Artista eliminado del roster: ${a?.nombre ?? id}. Con él se fueron ${proyectos?.length ?? 0} proyectos y sus publicaciones.`
  })
}

/* ============================================================
   Proyectos
   ============================================================ */

export async function guardarProyecto(
  id: string,
  campos: Partial<{ titulo: string; tipo: string; tracks: number; grabados: number; release: string; pre_start: string; post_meses: number; estado: EstadoProyecto; notas: string }>,
) {
  return mutar("operar", async () => {
    const supabase = await createClient()
    const { data: p } = await supabase
      .from("mg_proyectos")
      .select("*, mg_artistas(nombre)")
      .eq("id", id)
      .single()
    if (!p) throw new Error("Proyecto no encontrado")

    const patch = { ...campos }

    // Al completar la grabación de un proyecto que no había arrancado,
    // el estado se mueve solo a mezcla (misma regla que en el prototipo).
    if (patch.grabados !== undefined && patch.grabados >= (patch.tracks ?? p.tracks) && p.estado === "sin_producir") {
      patch.estado = "mezcla"
    }

    const { error } = await supabase.from("mg_proyectos").update(patch).eq("id", id)
    if (error) throw new Error(error.message)

    const nombre = (p.mg_artistas as { nombre: string } | null)?.nombre ?? "?"
    const campo = Object.keys(campos)[0]
    return `${nombre} · ${p.titulo}: ${campo} → ${Object.values(campos)[0]}.`
  })
}

/** Mover el release arrastra el inicio de pre y limpia las fechas movidas a
 *  mano del proyecto: si no, quedarían huérfanas contra el nuevo calendario. */
export async function moverRelease(id: string, nuevaFecha: string) {
  return mutar("operar", async () => {
    const supabase = await createClient()
    const { data: p } = await supabase
      .from("mg_proyectos").select("*, mg_artistas(nombre)").eq("id", id).single()
    if (!p) throw new Error("Proyecto no encontrado")

    const dif = Math.round((D(nuevaFecha).getTime() - D(p.release).getTime()) / 86400000)
    const { error } = await supabase
      .from("mg_proyectos")
      .update({ release: nuevaFecha, pre_start: masDias(p.pre_start, dif) })
      .eq("id", id)
    if (error) throw new Error(error.message)

    await supabase.from("mg_eventos_estado").delete().like("evento_id", `${id}:%`)

    const nombre = (p.mg_artistas as { nombre: string } | null)?.nombre ?? "?"
    return `📅 ${nombre} · ${p.titulo}: release ${fmt(p.release)} → ${fmt(nuevaFecha)}. Calendario del proyecto recalculado.`
  })
}

export async function crearProyecto(datos: {
  artista_id: string; titulo: string; tipo: string; tracks: number; release: string
}) {
  return mutar("operar", async () => {
    const supabase = await createClient()
    const { data: a } = await supabase.from("mg_artistas").select("*").eq("id", datos.artista_id).single()
    if (!a) throw new Error("Artista no encontrado")

    // El pre arranca 3 meses antes para artistas de marca y 2 para compilado.
    const mesesPre = a.tier === "marca" ? 3 : 2
    const d = D(datos.release)
    d.setMonth(d.getMonth() - mesesPre)
    const preStart = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

    const { error } = await supabase.from("mg_proyectos").insert({
      id: `p${Date.now().toString(36)}`,
      artista_id: datos.artista_id,
      titulo: datos.titulo,
      tipo: datos.tipo,
      tracks: datos.tracks,
      grabados: 0,
      release: datos.release,
      pre_start: preStart,
      post_meses: a.tier === "marca" ? 3 : 1,
      estado: "planeacion",
      notas: "",
    })
    if (error) throw new Error(error.message)
    return `➕ Nuevo proyecto: ${a.nombre} — ${datos.titulo} (${datos.tipo}, ${datos.tracks} temas) para ${fmt(datos.release)}.`
  })
}

export async function eliminarProyecto(id: string) {
  return mutar("operar", async () => {
    const supabase = await createClient()
    const { data: p } = await supabase
      .from("mg_proyectos").select("titulo, mg_artistas(nombre)").eq("id", id).single()
    const { error } = await supabase.from("mg_proyectos").delete().eq("id", id)
    if (error) throw new Error(error.message)
    await supabase.from("mg_eventos_estado").delete().like("evento_id", `${id}:%`)
    const nombre = (p?.mg_artistas as unknown as { nombre: string } | null)?.nombre ?? "?"
    return `🗑 Proyecto eliminado: ${nombre} — ${p?.titulo ?? id}.`
  })
}

/* ============================================================
   ¿Qué pasó? — el atajo para recalcular sin editar campo por campo
   ============================================================ */

export type QuePaso = "delay" | "song" | "allrec" | "ready" | "launched" | "pause" | "resume"

export async function aplicarQuePaso(proyectoId: string, que: QuePaso, dias = 14) {
  return mutar("operar", async () => {
    const supabase = await createClient()
    const { data: p } = await supabase
      .from("mg_proyectos").select("*, mg_artistas(nombre, tier)").eq("id", proyectoId).single()
    if (!p) throw new Error("Proyecto no encontrado")
    const artista = p.mg_artistas as unknown as { nombre: string; tier: string } | null
    const nombre = artista?.nombre ?? "?"

    if (que === "delay") {
      const releaseAnterior = p.release
      // El release conserva su DÍA DE LA SEMANA en vez de forzarse a viernes.
      // El viernes sigue siendo el día por defecto (los DSP refrescan sus
      // listas ese día), pero ya no es el único: con 30 lanzamientos en siete
      // meses no caben todos en los viernes disponibles, y un jueves sirve
      // mejor para lo que se apoya en un estreno de YouTube.
      const diaOriginal = D(p.release).getDay()
      let nr = evitarFestivos(masDias(p.release, dias))
      let guard = 0
      while (D(nr).getDay() !== diaOriginal && guard < 7) { nr = masDias(nr, 1); guard++ }
      nr = evitarFestivos(nr)

      await supabase.from("mg_proyectos")
        .update({ release: nr, pre_start: masDias(p.pre_start, dias) })
        .eq("id", proyectoId)
      await supabase.from("mg_eventos_estado").delete().like("evento_id", `${proyectoId}:%`)

      // Cascada: en artistas de marca, correr el primer lanzamiento empuja el
      // siguiente, porque no se solapan dos campañas del mismo artista.
      let corrido = false
      if (artista?.tier === "marca") {
        const { data: siguiente } = await supabase
          .from("mg_proyectos")
          .select("*")
          .eq("artista_id", p.artista_id)
          .neq("id", proyectoId)
          .gt("release", nr)
          .order("release")
          .limit(1)
          .maybeSingle()
        if (siguiente) {
          let r2 = masDias(siguiente.release, dias)
          while (D(r2).getDay() !== 5) r2 = masDias(r2, 1)
          await supabase.from("mg_proyectos")
            .update({ release: r2, pre_start: masDias(siguiente.pre_start, dias) })
            .eq("id", siguiente.id)
          await supabase.from("mg_eventos_estado").delete().like("evento_id", `${siguiente.id}:%`)
          corrido = true
        }
      }
      return `⏳ ${nombre} · ${p.titulo}: atraso de ${dias} días. Release ${fmt(releaseAnterior)} → ${fmt(nr)}${corrido ? "; su siguiente lanzamiento también se corrió" : ""}. Todo el proyecto recalculado.`
    }

    if (que === "song") {
      // Ya estaba completo: no hay nada que sumar y la bitácora no debe
      // registrar un avance que no ocurrió.
      if (p.grabados >= p.tracks) {
        throw new Error(`${nombre} · ${p.titulo} ya tiene sus ${p.tracks} canciones grabadas.`)
      }
      const grabados = p.grabados + 1
      const estado = grabados >= p.tracks && p.estado === "sin_producir" ? "mezcla" : p.estado
      await supabase.from("mg_proyectos").update({ grabados, estado }).eq("id", proyectoId)
      return `✅ ${nombre}: canción grabada (${grabados}/${p.tracks}). Sesiones recalculadas.`
    }
    if (que === "allrec") {
      await supabase.from("mg_proyectos").update({ grabados: p.tracks, estado: "mezcla" }).eq("id", proyectoId)
      return `🎙 ${nombre} · ${p.titulo}: grabación completa. A mezcla.`
    }
    if (que === "ready") {
      await supabase.from("mg_proyectos").update({ estado: "listo" }).eq("id", proyectoId)
      return `🚀 ${nombre} · ${p.titulo}: listo para lanzar.`
    }
    if (que === "launched") {
      await supabase.from("mg_proyectos").update({ estado: "lanzado" }).eq("id", proyectoId)
      return `🎉 ${nombre} · ${p.titulo}: ¡LANZADO!`
    }
    if (que === "pause") {
      await supabase.from("mg_proyectos").update({ estado: "pausado" }).eq("id", proyectoId)
      return `⏸ ${nombre} · ${p.titulo}: pausado. Sus sesiones se liberaron para otros proyectos.`
    }
    await supabase.from("mg_proyectos").update({ estado: "planeacion" }).eq("id", proyectoId)
    return `▶️ ${nombre} · ${p.titulo}: reactivado.`
  })
}

/* ============================================================
   Eventos del calendario (excepciones sobre lo derivado)
   ============================================================ */

async function upsertEstado(evento_id: string, campos: Record<string, unknown>) {
  const supabase = await createClient()
  const perfil = await perfilActual()
  const { error } = await supabase
    .from("mg_eventos_estado")
    .upsert({ evento_id, ...campos, actualizado_por: perfil?.id ?? null }, { onConflict: "evento_id" })
  if (error) throw new Error(error.message)
}

export async function moverEvento(eventoId: string, fecha: string, etiqueta: string) {
  return mutar("operar", async () => {
    // Si es un evento manual se mueve la fila real; si es derivado, la excepción.
    const supabase = await createClient()
    const { data: extra } = await supabase.from("mg_eventos_extra").select("id").eq("id", eventoId).maybeSingle()
    if (extra) {
      await supabase.from("mg_eventos_extra").update({ fecha }).eq("id", eventoId)
    } else if (eventoId.startsWith("post:")) {
      await supabase.from("mg_publicaciones").update({ fecha }).eq("id", eventoId.slice(5))
    } else {
      await upsertEstado(eventoId, { fecha_override: fecha })
    }
    return `📌 “${etiqueta}” movido a ${fmt(fecha)}.`
  })
}

export async function marcarEvento(eventoId: string, hecho: boolean, etiqueta: string) {
  return mutar("operar", async () => {
    await upsertEstado(eventoId, { hecho })
    return hecho ? `✔ Hecho: ${etiqueta}.` : `↺ Reabierto: ${etiqueta}.`
  })
}

export async function eliminarEvento(eventoId: string, etiqueta: string) {
  return mutar("operar", async () => {
    const supabase = await createClient()
    const { data: extra } = await supabase.from("mg_eventos_extra").select("id").eq("id", eventoId).maybeSingle()
    if (extra) await supabase.from("mg_eventos_extra").delete().eq("id", eventoId)
    else await upsertEstado(eventoId, { eliminado: true })
    return `✕ Cancelado: ${etiqueta}.`
  })
}

export async function restaurarEvento(eventoId: string) {
  return mutar("operar", async () => {
    await upsertEstado(eventoId, { eliminado: false, fecha_override: null, hecho: false })
    return `↺ Evento restaurado a su fecha derivada.`
  })
}

export async function crearEventoManual(datos: { tipo: TipoEvento; fecha: string; etiqueta: string; proyecto_id?: string | null }) {
  return mutar("operar", async () => {
    const supabase = await createClient()
    const perfil = await perfilActual()
    const { error } = await supabase.from("mg_eventos_extra").insert({
      id: `ex${Date.now().toString(36)}`,
      tipo: datos.tipo,
      fecha: datos.fecha,
      etiqueta: datos.etiqueta,
      proyecto_id: datos.proyecto_id ?? null,
      creado_por: perfil?.id ?? null,
    })
    if (error) throw new Error(error.message)
    return `➕ Evento manual: “${datos.etiqueta}” el ${fmt(datos.fecha)}.`
  })
}

/* ============================================================
   Reglas y ajustes
   ============================================================ */

export async function guardarReglas(reglas: Record<string, number>) {
  return mutar("reglas", async () => {
    const supabase = await createClient()
    const { error } = await supabase.from("mg_config").update({ reglas }).eq("id", "global")
    if (error) throw new Error(error.message)
    return `⚙ Reglas del sistema actualizadas. Todo el calendario se recalculó.`
  })
}

export async function guardarAjustes(ajustes: Record<string, unknown>) {
  return mutar("reglas", async () => {
    const supabase = await createClient()
    const { error } = await supabase.from("mg_config").update({ ajustes }).eq("id", "global")
    if (error) throw new Error(error.message)
    return `⚙ Capacidad de estudio y horizonte actualizados.`
  })
}

export async function guardarSlots(slots: Record<string, { dow: number; hora: string }[]>) {
  return mutar("publicar", async () => {
    const supabase = await createClient()
    const { error } = await supabase.from("mg_config").update({ slots }).eq("id", "global")
    if (error) throw new Error(error.message)
    return `📅 Huecos recurrentes de publicación actualizados.`
  })
}

/* ============================================================
   Redes
   ============================================================ */

export async function guardarPublicacion(pub: Partial<Publicacion> & { id: string }) {
  return mutar("publicar", async () => {
    const supabase = await createClient()
    const perfil = await perfilActual()
    const { id, ...campos } = pub
    const { data: existente } = await supabase.from("mg_publicaciones").select("id").eq("id", id).maybeSingle()

    if (existente) {
      const { error } = await supabase.from("mg_publicaciones").update(campos).eq("id", id)
      if (error) throw new Error(error.message)
      return null // editar una pieza no merece una línea de bitácora por tecla
    }
    const { error } = await supabase
      .from("mg_publicaciones")
      .insert({ id, ...campos, creado_por: perfil?.id ?? null })
    if (error) throw new Error(error.message)
    return `📱 Nueva publicación: ${campos.titulo || campos.formato} para ${campos.fecha}.`
  })
}

export async function eliminarPublicacion(id: string, titulo: string) {
  return mutar("publicar", async () => {
    const supabase = await createClient()
    const { error } = await supabase.from("mg_publicaciones").delete().eq("id", id)
    if (error) throw new Error(error.message)
    return `🗑 Publicación eliminada: ${titulo || id}.`
  })
}

export async function crearPublicaciones(pubs: Publicacion[]) {
  return mutar("publicar", async () => {
    if (!pubs.length) return "El plan ya estaba generado: no había piezas nuevas que agregar."
    const supabase = await createClient()
    const perfil = await perfilActual()
    const { error } = await supabase
      .from("mg_publicaciones")
      .insert(pubs.map((p) => ({ ...p, creado_por: perfil?.id ?? null })))
    if (error) throw new Error(error.message)
    return `⚡ Plan de contenido generado: ${pubs.length} publicaciones nuevas.`
  })
}

/** Aprobar o pedir cambios. Es la única acción que el rol 'artista' puede
 *  ejecutar, y solo sobre las piezas de su propia cuenta (lo fuerza RLS). */
export async function revisarPublicacion(id: string, accion: "aprobado" | "cambios", nota = "") {
  const perfil = await perfilActual()
  if (!perfil) redirect("/admin/login")

  const permitido = puede(perfil.rol, "publicar") || puede(perfil.rol, "aprobarPropio")
  if (!permitido) return { ok: false, error: "Tu rol no puede revisar publicaciones." }

  try {
    const supabase = await createClient()
    const { data: p } = await supabase.from("mg_publicaciones").select("*").eq("id", id).single()
    if (!p) throw new Error("Publicación no encontrada")

    if (perfil.rol === "artista" && p.cuenta !== perfil.artista_id) {
      return { ok: false, error: "Solo puedes revisar las piezas de tu propia cuenta." }
    }

    const aprobaciones = [
      ...(p.aprobaciones ?? []),
      { d: hoy(), quien: perfil.nombre, accion, ...(nota ? { nota } : {}) },
    ]
    const { error } = await supabase
      .from("mg_publicaciones")
      .update({ estado: accion === "aprobado" ? "aprobado" : "ajustes", aprobaciones })
      .eq("id", id)
    if (error) throw new Error(error.message)

    await bitacora(
      accion === "aprobado"
        ? `👍 ${perfil.nombre} aprobó “${p.titulo || p.formato}”.`
        : `↩️ ${perfil.nombre} pidió cambios en “${p.titulo || p.formato}”${nota ? `: ${nota}` : ""}.`,
    )
    refrescar()
    return OK
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado" }
  }
}

export async function guardarTexto(tipo: "texto" | "tags", etiqueta: string, contenido: string) {
  return mutar("publicar", async () => {
    const supabase = await createClient()
    const { error } = await supabase.from("mg_textos").insert({ tipo, etiqueta, contenido })
    if (error) throw new Error(error.message)
    return null
  })
}

export async function eliminarTexto(id: string) {
  return mutar("publicar", async () => {
    const supabase = await createClient()
    const { error } = await supabase.from("mg_textos").delete().eq("id", id)
    if (error) throw new Error(error.message)
    return null
  })
}

/* ============================================================
   Radar
   ============================================================ */

export async function guardarFicha(id: string, campos: Partial<FichaRadar>) {
  return mutar("operar", async () => {
    const supabase = await createClient()
    const { error } = await supabase.from("mg_radar").update(campos).eq("id", id)
    if (error) throw new Error(error.message)
    return campos.rel ? `Radar · ${id}: relación → ${campos.rel}.` : null
  })
}

/**
 * Devuelve el id de la ficha creada, y por eso no usa `mutar`: la interfaz lo
 * necesita para abrir la ficha nueva en el acto. Crear una ficha y tener que
 * ir a buscarla en la lista para llenarla era el paso de más que sobraba.
 */
export async function crearFicha(datos: { nombre: string; cat: string; rel: string }): Promise<Resultado> {
  try {
    await exigir("operar")
    const supabase = await createClient()
    const id = `rp${Date.now().toString(36)}`

    const { error } = await supabase.from("mg_radar").insert({
      id,
      origen: "externo",
      nombre: datos.nombre,
      cat: datos.cat,
      rel: datos.rel,
    })
    if (error) throw new Error(error.message)

    await bitacora(`🔭 Nueva ficha en el radar: ${datos.nombre}.`)
    refrescar()
    return { ok: true, id }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "No se pudo crear la ficha" }
  }
}

export async function eliminarFicha(id: string, nombre: string) {
  return mutar("operar", async () => {
    const supabase = await createClient()
    const { error } = await supabase.from("mg_radar").delete().eq("id", id)
    if (error) throw new Error(error.message)
    await supabase.from("mg_eventos_estado").delete().eq("evento_id", `radar:${id}`)
    return `🗑 Ficha eliminada del radar: ${nombre}.`
  })
}

/** Guarda una medición nueva y agenda la siguiente. Sin esta serie no hay
 *  crecimiento que calcular: el puntaje del radar depende de ella. */
export async function registrarMedicion(id: string, metricas: Record<string, number>, proxima: string | null) {
  return mutar("operar", async () => {
    const supabase = await createClient()
    const { data: ficha } = await supabase.from("mg_radar").select("*").eq("id", id).single()
    if (!ficha) throw new Error("Ficha no encontrada")

    const mediciones = [...(ficha.mediciones ?? []), { d: hoy(), m: metricas }]
    const { error } = await supabase.from("mg_radar").update({ mediciones, proxima }).eq("id", id)
    if (error) throw new Error(error.message)
    return `📊 Medición registrada · ${ficha.nombre}${proxima ? `. Próxima: ${fmt(proxima)}` : ""}.`
  })
}

/* ============================================================
   Equipo y accesos
   ============================================================ */

export async function cambiarRol(perfilId: string, rol: string) {
  return mutar("equipo", async () => {
    const supabase = await createClient()
    const { data: p } = await supabase.from("perfiles").select("nombre, email").eq("id", perfilId).single()
    // Los triggers proteger_perfil / exigir_un_owner bloquean la escalada de
    // privilegios; aquí solo se traduce el error a algo legible.
    const { error } = await supabase.from("perfiles").update({ rol }).eq("id", perfilId)
    if (error) throw new Error(error.message)
    return `🔐 Rol de ${p?.nombre || p?.email || perfilId} → ${rol}.`
  })
}

export async function cambiarEstadoCuenta(perfilId: string, activo: boolean) {
  return mutar("equipo", async () => {
    const supabase = await createClient()
    const { data: p } = await supabase.from("perfiles").select("nombre, email").eq("id", perfilId).single()
    const { error } = await supabase.from("perfiles").update({ activo }).eq("id", perfilId)
    if (error) throw new Error(error.message)
    return `${activo ? "✅ Cuenta activada" : "🚫 Cuenta desactivada"}: ${p?.nombre || p?.email || perfilId}.`
  })
}

export async function vincularArtista(perfilId: string, artistaId: string | null) {
  return mutar("equipo", async () => {
    const supabase = await createClient()
    const { error } = await supabase.from("perfiles").update({ artista_id: artistaId }).eq("id", perfilId)
    if (error) throw new Error(error.message)
    return `🔗 Cuenta vinculada al artista ${artistaId ?? "— (sin vincular)"}.`
  })
}

/**
 * Concede o retira las excepciones personales de una cuenta. Sustituye ambas
 * listas enteras: el editor manda el estado completo, no un diff, porque así
 * dos admins que guarden a la vez no se dejan mutuamente medio ajuste.
 *
 * Se sanean contra los catálogos de permisos.ts: un slug o una clave que no
 * existan no llegan a la base. No es paranoia sobre el formulario, es que un
 * permiso mal escrito quedaría guardado para siempre sin conceder nada y sin
 * que nadie entienda por qué.
 */
export async function guardarAccesoIndividual(
  perfilId: string,
  secciones: string[],
  permisos: string[],
) {
  return mutar("equipo", async () => {
    const secc = [...new Set(secciones)].filter((x) => SECCIONES.some((s) => s.slug === x && s.slug !== ""))
    const perm = [...new Set(permisos)].filter((x) => PERMISOS_EXTRA.some((p) => p.clave === x))

    const supabase = await createClient()
    const { data: p } = await supabase.from("perfiles").select("nombre, email").eq("id", perfilId).single()

    // proteger_perfil (017) bloquea que alguien se conceda esto a sí mismo;
    // aquí solo se traduce el error a algo legible.
    const { error } = await supabase
      .from("perfiles")
      .update({ secciones_extra: secc, permisos_extra: perm })
      .eq("id", perfilId)
    if (error) throw new Error(error.message)

    const quien = p?.nombre || p?.email || perfilId
    const etiquetas = (xs: string[]) => (xs.length ? xs.join(", ") : "nada")
    return `🎛 Accesos individuales de ${quien} → secciones: ${etiquetas(secc)}; permisos: ${etiquetas(perm)}.`
  })
}

export async function actualizarMiPerfil(nombre: string) {
  const perfil = await perfilActual()
  if (!perfil) redirect("/admin/login")
  const supabase = await createClient()
  const { error } = await supabase.from("perfiles").update({ nombre }).eq("id", perfil.id)
  if (error) return { ok: false, error: error.message }
  refrescar()
  return OK
}

/* ============================================================
   MG1
   ============================================================ */

/** Quien opera, y además quien lleva la conversación con los inscritos por
 *  concesión individual. Espejo de puede_contactar_mg1() en la 017. */
const contactaMg1 = (p: Perfil) => puede(p.rol, "operar") || tieneExtra(p, "mg1:contactar")

export async function actualizarInscripcion(
  id: string,
  campos: { estado?: string; notas?: string; disponibilidad?: Disponibilidad },
) {
  return mutar(contactaMg1, async (perfil) => {
    // El estado es el veredicto de la curaduría; anotar lo que dijo el
    // concursante, no. Quien solo tiene 'mg1:contactar' escribe lo segundo.
    // El trigger proteger_curaduria_mg1 lo repite en la base: esto es para
    // que el mensaje sea legible, no para que sea seguro.
    if (campos.estado !== undefined && !puede(perfil.rol, "operar")) {
      throw new Error("Cambiar el estado es cosa de la curaduría. Tú puedes anotar disponibilidad y notas.")
    }

    const supabase = await createClient()

    const { disponibilidad, ...resto } = campos
    const parche: Record<string, unknown> = { ...resto }

    // La disponibilidad se sanea aqui, no en el cliente: solo entran fechas y
    // franjas del catalogo. La marca de tiempo la pone el servidor y es lo que
    // distingue "no puede ningun dia" de "no le hemos preguntado".
    if (disponibilidad !== undefined) {
      parche.disponibilidad = sanearDisponibilidad(disponibilidad)
      parche.disponibilidad_actualizada = new Date().toISOString()
    }

    if (Object.keys(parche).length === 0) return null

    const { error } = await supabase.from("mg1_inscripciones").update(parche).eq("id", id)
    if (error) throw new Error(error.message)

    if (campos.estado) return `🎫 MG1: inscripción marcada como ${campos.estado}.`
    // Marcar franjas dispara un guardado por cada tanda de clics: una sola
    // linea por inscripcion basta para la trazabilidad, sin inundar la bitacora.
    if (disponibilidad !== undefined) return "🗓 MG1: se anotó la disponibilidad de una inscripción."
    return null
  })
}

/** Marcar una sesión como grabada: suma una canción al proyecto y cierra el
 *  evento. Es lo que hace que el agendador vuelva a repartir lo que falta.
 *
 *  Cuando cae la última, la grabación queda cerrada y el trabajo pasa a la
 *  mesa de mezcla. Ese salto se avisa aquí, en el momento real en que ocurre:
 *  esperar a la fecha planeada del hito deja a quien mezcla sin saber que ya
 *  puede empezar, que era justo el hueco por el que se perdían días. */
export async function marcarSesionGrabada(eventoId: string, proyectoId: string) {
  return mutar("operar", async () => {
    const supabase = await createClient()
    const { data: p } = await supabase
      .from("mg_proyectos").select("*, mg_artistas(nombre)").eq("id", proyectoId).single()
    if (!p) throw new Error("Proyecto no encontrado")

    const yaEstaba = p.tracks > 0 && p.grabados >= p.tracks
    const grabados = Math.min(p.grabados + 1, p.tracks)
    const cierra = !yaEstaba && p.tracks > 0 && grabados >= p.tracks

    // Antes solo saltaba desde 'sin_producir', asi que un proyecto que ya
    // estaba en 'grabacion' terminaba de grabar y se quedaba en 'grabacion'
    // para siempre, sin aparecer nunca en la cola de mezcla.
    const estado = cierra && (p.estado === "sin_producir" || p.estado === "grabacion")
      ? "mezcla" : p.estado

    await supabase.from("mg_proyectos").update({ grabados, estado }).eq("id", proyectoId)
    await upsertEstado(eventoId, { hecho: true })

    const nombre = (p.mg_artistas as unknown as { nombre: string } | null)?.nombre ?? "?"
    if (!cierra) {
      return `🎙 Sesión completada: ${nombre} (${grabados}/${p.tracks} grabadas). Agenda recalculada.`
    }

    await avisarHandoffMezcla(proyectoId, p, nombre)
    return `🎚 Grabación cerrada: ${nombre} — ${p.titulo} (${p.tracks}/${p.tracks}). Pasa a mezcla.`
  })
}

/** Deshacer una sesión marcada por error. Sin esto, un clic de más deja
 *  `grabados` inflado y el agendador programa una sesión menos, sin vuelta
 *  atrás desde la interfaz. */
export async function revertirSesionGrabada(eventoId: string, proyectoId: string) {
  return mutar("operar", async () => {
    const supabase = await createClient()
    const { data: p } = await supabase
      .from("mg_proyectos").select("*, mg_artistas(nombre)").eq("id", proyectoId).single()
    if (!p) throw new Error("Proyecto no encontrado")

    const grabados = Math.max(0, p.grabados - 1)
    // Si deja de estar completa, el proyecto vuelve a estar grabando.
    const estado = p.estado === "mezcla" && grabados < p.tracks ? "grabacion" : p.estado
    await supabase.from("mg_proyectos").update({ grabados, estado }).eq("id", proyectoId)
    await upsertEstado(eventoId, { hecho: false })

    const nombre = (p.mg_artistas as unknown as { nombre: string } | null)?.nombre ?? "?"
    return `↺ Sesión reabierta: ${nombre} (${grabados}/${p.tracks} grabadas).`
  })
}

/**
 * Avisa a quien mezcla que la grabación quedó cerrada, con la fecha de entrega.
 *
 * Cascada de destinatarios: el responsable del hito `master` manda porque es
 * la decisión más específica; si nadie lo tomó, el líder del proyecto; y si
 * tampoco, el área de producción entera. Avisar a un área es peor que avisar
 * a una persona, pero infinitamente mejor que no avisar a nadie.
 */
async function avisarHandoffMezcla(
  proyectoId: string,
  p: { titulo: string; release: string; tracks: number; lider_id: string | null },
  nombreArtista: string,
) {
  const supabase = await createClient()

  const { data: st } = await supabase
    .from("mg_eventos_estado").select("responsable_id, fecha_override")
    .eq("evento_id", `${proyectoId}:master`).maybeSingle()

  let destinatarios: string[] = []
  if (st?.responsable_id) destinatarios = [st.responsable_id]
  else if (p.lider_id) destinatarios = [p.lider_id]
  else {
    const { data: area } = await supabase
      .from("perfiles").select("id").eq("rol", "produccion").eq("activo", true)
    destinatarios = (area ?? []).map((x) => x.id as string)
  }
  if (!destinatarios.length) return

  const { data: cfg } = await supabase.from("mg_config").select("reglas").maybeSingle()
  const masterFinal = Number((cfg?.reglas as Record<string, number> | null)?.masterFinal ?? 35)
  const entrega = st?.fecha_override ?? masDias(p.release, -masterFinal)
  const dias = Math.round((D(entrega).getTime() - D(hoy()).getTime()) / 86400000)

  await avisar(destinatarios, {
    tipo: "asignacion",
    titulo: `🎚 Arranca la mezcla · ${nombreArtista} — ${p.titulo}`,
    cuerpo:
      `Las ${p.tracks} canciones ya están grabadas, así que la mezcla puede empezar. ` +
      `Entrega del máster: ${fmt(entrega)}` +
      (dias >= 0 ? ` — quedan ${dias} días.` : ` — la fecha ya pasó hace ${-dias} días.`),
    enlace: "/admin/estudio",
  })
}

/* ============================================================
   Respaldo
   ============================================================ */

/**
 * Restaura un respaldo JSON. Hace upsert, nunca DELETE: un respaldo viejo no
 * puede borrar trabajo que ya no aparece en él. Reservado a owner/admin.
 */
export async function restaurarRespaldo(json: string) {
  return mutar("equipo", async () => {
    let datos: Record<string, unknown>
    try {
      datos = JSON.parse(json)
    } catch {
      throw new Error("El archivo no es un JSON válido.")
    }
    if (!Array.isArray(datos.artistas) || !Array.isArray(datos.proyectos)) {
      throw new Error("El archivo no tiene la forma de un respaldo del panel (faltan artistas o proyectos).")
    }

    const supabase = await createClient()
    const paso = async (tabla: string, filas: unknown[], conflicto: string) => {
      if (!Array.isArray(filas) || !filas.length) return
      const { error } = await supabase.from(tabla).upsert(filas, { onConflict: conflicto })
      if (error) throw new Error(`${tabla}: ${error.message}`)
    }

    await paso("mg_artistas", datos.artistas as unknown[], "id")
    await paso("mg_proyectos", datos.proyectos as unknown[], "id")
    await paso("mg_publicaciones", (datos.publicaciones ?? []) as unknown[], "id")
    await paso("mg_radar", (datos.radar ?? []) as unknown[], "id")
    await paso("mg_eventos_extra", (datos.eventosExtra ?? []) as unknown[], "id")

    if (datos.config && typeof datos.config === "object") {
      const c = datos.config as Record<string, unknown>
      await supabase.from("mg_config")
        .update({ reglas: c.reglas, ajustes: c.ajustes, slots: c.slots })
        .eq("id", "global")
    }

    const a = (datos.artistas as unknown[]).length
    const p = (datos.proyectos as unknown[]).length
    return `♻️ Respaldo restaurado: ${a} artistas y ${p} proyectos actualizados (no se borró nada existente).`
  })
}

/* ============================================================
   Mi cuenta
   ============================================================ */

/**
 * Cambia la contrasena del usuario en sesion. Reautentica primero con la
 * actual: sin eso, una sesion abierta en un equipo ajeno podria cambiarla sin
 * conocerla y dejar al dueno fuera de su propia cuenta.
 */
export async function cambiarPassword(actual: string, nueva: string): Promise<Resultado> {
  const perfil = await perfilActual()
  if (!perfil) redirect("/admin/login")

  if (nueva.length < 8) return { ok: false, error: "La contraseña nueva necesita al menos 8 caracteres." }
  if (nueva === actual) return { ok: false, error: "La contraseña nueva tiene que ser distinta de la actual." }

  const supabase = await createClient()
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: perfil.email,
    password: actual,
  })
  if (authError) return { ok: false, error: "La contraseña actual no es correcta." }

  const { error } = await supabase.auth.updateUser({ password: nueva })
  if (error) return { ok: false, error: error.message }

  await bitacora(`🔑 ${perfil.nombre || perfil.email} cambió su contraseña.`)
  refrescar()
  return OK
}

/* ============================================================
   Personas dentro del trabajo
   ============================================================ */

/** Crea avisos en la bandeja de otras personas. Nunca para uno mismo: nadie
 *  necesita que le notifiquen lo que acaba de hacer. */
async function avisar(
  destinatarios: string[],
  aviso: { tipo: string; titulo: string; cuerpo?: string; enlace?: string },
) {
  const perfil = await perfilActual()
  const gente = [...new Set(destinatarios)].filter((id) => id && id !== perfil?.id)
  if (!gente.length) return

  const supabase = await createClient()
  await supabase.from("mg_avisos").insert(
    gente.map((perfil_id) => ({
      perfil_id,
      tipo: aviso.tipo,
      titulo: aviso.titulo,
      cuerpo: aviso.cuerpo ?? "",
      enlace: aviso.enlace ?? "/admin/mi-trabajo",
      de: perfil?.id ?? null,
      de_nombre: perfil?.nombre ?? "",
    })),
  )
}

/** Asignar un evento derivado. La asignación es una anotación más sobre el
 *  evento, así que vive en mg_eventos_estado junto a la fecha movida. */
export async function asignarEvento(eventoId: string, responsableId: string | null, etiqueta: string) {
  return mutar("operar", async () => {
    // Las publicaciones llevan su responsable en su propia fila.
    if (eventoId.startsWith("post:")) {
      const supabase = await createClient()
      const { error } = await supabase
        .from("mg_publicaciones")
        .update({ responsable_id: responsableId })
        .eq("id", eventoId.slice(5))
      if (error) throw new Error(error.message)
    } else {
      await upsertEstado(eventoId, { responsable_id: responsableId })
    }

    if (responsableId) {
      await avisar([responsableId], {
        tipo: "asignacion",
        titulo: `Te asignaron: ${etiqueta}`,
        cuerpo: "Aparece en Mi trabajo.",
      })
    }

    const supabase = await createClient()
    const { data } = await supabase.from("perfiles").select("nombre").eq("id", responsableId ?? "").maybeSingle()
    return responsableId
      ? `👤 “${etiqueta}” asignado a ${data?.nombre ?? "alguien"}.`
      : `👤 “${etiqueta}” quedó sin responsable.`
  })
}

export async function cambiarPrioridad(eventoId: string, prioridad: string) {
  return mutar("operar", async () => {
    await upsertEstado(eventoId, { prioridad })
    return null // cambiar prioridad no merece una línea de bitácora
  })
}

/**
 * Cerrar un evento. A diferencia de marcarEvento(), esta la puede usar
 * cualquiera sobre lo que es SUYO: es lo que hace que "Mi trabajo" sirva a un
 * editor de contenido y no solo a un manager. RLS impone el límite real.
 */
export async function cerrarMiPendiente(eventoId: string, hecho: boolean): Promise<Resultado> {
  const perfil = await perfilActual()
  if (!perfil) redirect("/admin/login")

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("mg_eventos_estado")
      .update({ hecho })
      .eq("evento_id", eventoId)
      .select("evento_id")

    if (error) throw new Error(error.message)
    if (!data?.length) {
      return { ok: false, error: "Solo puedes cerrar lo que está asignado a ti." }
    }
    refrescar()
    return OK
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado" }
  }
}

/* ============================================================
   Salud del proyecto
   ============================================================ */

export async function reportarSalud(proyectoId: string, salud: string, nota: string) {
  return mutar("operar", async () => {
    const perfil = await perfilActual()
    const supabase = await createClient()

    const { data: p } = await supabase
      .from("mg_proyectos").select("titulo, lider_id, mg_artistas(nombre)").eq("id", proyectoId).single()
    if (!p) throw new Error("Proyecto no encontrado")

    const { error } = await supabase
      .from("mg_proyectos")
      .update({ salud, salud_nota: nota, salud_at: new Date().toISOString(), salud_por: perfil?.id ?? null })
      .eq("id", proyectoId)
    if (error) throw new Error(error.message)

    // El historial es lo que permite decir "iba en curso hace tres semanas".
    await supabase.from("mg_salud_historial").insert({
      proyecto_id: proyectoId, salud, nota,
      autor: perfil?.id ?? null, autor_nombre: perfil?.nombre ?? "",
    })

    const nombre = (p.mg_artistas as unknown as { nombre: string } | null)?.nombre ?? "?"

    // Un proyecto que se sale de cauce le importa a owners y admins, y sobre
    // todo a quien lo lidera: puede no ser ninguno de los dos.
    if (salud === "desviado" || salud === "en_riesgo") {
      const { data: jefes } = await supabase
        .from("perfiles").select("id").in("rol", ["owner", "admin"]).eq("activo", true)
      const destinatarios = [...(jefes ?? []).map((j) => j.id), ...(p.lider_id ? [p.lider_id] : [])]
      await avisar(destinatarios, {
        tipo: "salud",
        titulo: `${nombre} · ${p.titulo}: ${salud === "desviado" ? "desviado" : "en riesgo"}`,
        cuerpo: nota,
        enlace: "/admin/cartera",
      })
    }

    const etiqueta = { en_curso: "en curso", en_riesgo: "en riesgo", desviado: "desviado" }[salud] ?? salud
    return `🚦 ${nombre} · ${p.titulo}: ${etiqueta}${nota ? ` — ${nota}` : ""}.`
  })
}

export async function asignarLider(proyectoId: string, liderId: string | null) {
  return mutar("operar", async () => {
    const supabase = await createClient()
    const { data: p } = await supabase
      .from("mg_proyectos").select("titulo, mg_artistas(nombre)").eq("id", proyectoId).single()
    const { error } = await supabase.from("mg_proyectos").update({ lider_id: liderId }).eq("id", proyectoId)
    if (error) throw new Error(error.message)

    const nombre = (p?.mg_artistas as unknown as { nombre: string } | null)?.nombre ?? "?"
    if (liderId) {
      await avisar([liderId], {
        tipo: "asignacion",
        titulo: `Eres responsable de ${nombre} · ${p?.titulo}`,
        cuerpo: "Te toca reportar su salud cada semana.",
        enlace: "/admin/cartera",
      })
    }
    return `🎯 Responsable de ${nombre} · ${p?.titulo} actualizado.`
  })
}

export async function guardarCapacidad(perfilId: string, capacidad: number) {
  return mutar("equipo", async () => {
    const supabase = await createClient()
    const { error } = await supabase
      .from("perfiles").update({ capacidad_semanal: capacidad }).eq("id", perfilId)
    if (error) throw new Error(error.message)
    return null
  })
}

/* ============================================================
   Comentarios
   ============================================================ */

export async function comentar(
  entidadTipo: string,
  entidadId: string,
  cuerpo: string,
  contexto: { titulo: string; enlace: string },
): Promise<Resultado> {
  const perfil = await perfilActual()
  if (!perfil) redirect("/admin/login")
  if (perfil.rol === "viewer") return { ok: false, error: "Tu rol es de solo lectura." }
  if (!cuerpo.trim()) return { ok: false, error: "Escribe algo antes de enviar." }

  try {
    const supabase = await createClient()

    // Menciones por @nombre. Se resuelven contra el equipo activo para no
    // guardar ids inventados desde el cliente.
    const { data: equipo } = await supabase
      .from("perfiles").select("id, nombre").eq("activo", true)
    const menciones = (equipo ?? [])
      .filter((m) => m.nombre && cuerpo.toLowerCase().includes(`@${m.nombre.toLowerCase()}`))
      .map((m) => m.id)

    const { error } = await supabase.from("mg_comentarios").insert({
      entidad_tipo: entidadTipo,
      entidad_id: entidadId,
      cuerpo: cuerpo.trim(),
      menciones,
      autor: perfil.id,
      autor_nombre: perfil.nombre,
    })
    if (error) throw new Error(error.message)

    if (menciones.length) {
      await avisar(menciones, {
        tipo: "mencion",
        titulo: `${perfil.nombre} te mencionó en ${contexto.titulo}`,
        cuerpo: cuerpo.trim().slice(0, 140),
        enlace: contexto.enlace,
      })
    }

    refrescar()
    return OK
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado" }
  }
}

export async function borrarComentario(id: string): Promise<Resultado> {
  const perfil = await perfilActual()
  if (!perfil) redirect("/admin/login")
  const supabase = await createClient()
  const { error } = await supabase.from("mg_comentarios").delete().eq("id", id)
  if (error) return { ok: false, error: error.message }
  refrescar()
  return OK
}

/* ============================================================
   Bandeja
   ============================================================ */

export async function marcarAvisoLeido(id: string): Promise<Resultado> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("mg_avisos").update({ leido_at: new Date().toISOString() }).eq("id", id)
  if (error) return { ok: false, error: error.message }
  refrescar()
  return OK
}

export async function marcarTodoLeido(): Promise<Resultado> {
  const perfil = await perfilActual()
  if (!perfil) redirect("/admin/login")
  const supabase = await createClient()
  const { error } = await supabase
    .from("mg_avisos").update({ leido_at: new Date().toISOString() }).is("leido_at", null)
  if (error) return { ok: false, error: error.message }
  refrescar()
  return OK
}

/* ============================================================
   Reuniones
   ============================================================ */

/** Un acuerdo de junta es un evento como cualquier otro: así cae solo en Mi
 *  trabajo, el Calendario y la Carga sin código de sincronización. */
export async function crearAcuerdo(datos: {
  reunionId: string
  etiqueta: string
  fecha: string
  tipo?: string
  responsableId?: string | null
}) {
  return mutar("operar", async () => {
    const supabase = await createClient()
    const perfil = await perfilActual()
    const id = `ac${Date.now().toString(36)}`

    const { error } = await supabase.from("mg_eventos_extra").insert({
      id,
      tipo: datos.tipo ?? "hito",
      fecha: datos.fecha,
      etiqueta: datos.etiqueta,
      reunion_id: datos.reunionId,
      creado_por: perfil?.id ?? null,
    })
    if (error) throw new Error(error.message)

    if (datos.responsableId) {
      await upsertEstado(id, { responsable_id: datos.responsableId })
      await avisar([datos.responsableId], {
        tipo: "asignacion",
        titulo: `Te asignaron: ${datos.etiqueta}`,
        cuerpo: "Salió de una reunión.",
      })
    }
    return `📋 Acuerdo nuevo: “${datos.etiqueta}” para ${fmt(datos.fecha)}.`
  })
}

export async function guardarReunion(id: string, campos: Record<string, unknown>) {
  return mutar("operar", async () => {
    const supabase = await createClient()
    const { error } = await supabase.from("mg_reuniones").update(campos).eq("id", id)
    if (error) throw new Error(error.message)
    return null
  })
}

export async function crearReunion(datos: { titulo: string; fecha: string; duracion_min: number | null }) {
  return mutar("operar", async () => {
    const supabase = await createClient()
    const perfil = await perfilActual()
    const id = `r-${datos.fecha}-${Date.now().toString(36).slice(-4)}`
    const { error } = await supabase.from("mg_reuniones").insert({
      id, titulo: datos.titulo, fecha: datos.fecha,
      duracion_min: datos.duracion_min, creado_por: perfil?.id ?? null,
    })
    if (error) throw new Error(error.message)
    return `📋 Nueva reunión registrada: ${datos.titulo}.`
  })
}

/* ============================================================
   Zeri · solicitudes de cambio
   ============================================================ */

/**
 * Quien no puede operar no aplica un cambio de calendario: lo PIDE, y le llega
 * a quien sí decide. Es la jerarquía que el equipo ya tiene en la vida real —
 * un arreglista sabe que se atrasó, pero mover un release afecta a marketing,
 * al estudio y al distribuidor.
 *
 * Se apoya en mg_avisos (tipo 'aprobacion') en vez de estrenar una tabla: una
 * solicitud ES un aviso dirigido, y la bandeja ya resuelve leído/no leído,
 * privacidad por persona y enlace de vuelta.
 */
export async function solicitarCambio(
  proyectoId: string,
  resumen: string,
  nota: string,
): Promise<Resultado> {
  const perfil = await perfilActual()
  if (!perfil) redirect("/admin/login")

  try {
    const supabase = await createClient()

    // Quien decide: los roles con permiso para operar el calendario.
    const { data: aprobadores } = await supabase
      .from("perfiles").select("id").eq("activo", true).in("rol", ["owner", "admin", "manager"])

    const ids = (aprobadores ?? []).map((a) => a.id)
    if (!ids.length) {
      return { ok: false, error: "No hay nadie con permiso para aprobar cambios de calendario." }
    }

    await avisar(ids, {
      tipo: "aprobacion",
      titulo: `${perfil.nombre} pide ${resumen}`,
      cuerpo: nota ? `${nota}\n\nSolicitado desde Zeri.` : "Solicitado desde Zeri.",
      enlace: `/admin/artistas`,
    })

    await bitacora(`${perfil.nombre} pidió ${resumen} (proyecto ${proyectoId})`)
    refrescar()
    return OK
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "No se pudo enviar la solicitud" }
  }
}

/**
 * "Ver como": deja a un owner o admin previsualizar el panel de otro rol.
 * Guarda solo una cookie; quien decide si vale es perfilActual, comprobando el
 * rol REAL contra la base. Así una cookie puesta a mano no concede nada.
 */
export async function verComo(rol: string): Promise<Resultado> {
  const perfil = await perfilActual()
  if (!perfil) redirect("/admin/login")
  if (!puede(perfil.verComoReal ?? perfil.rol, "verComo")) {
    return { ok: false, error: "Solo un owner o un admin puede previsualizar otros roles." }
  }

  const galletas = await cookies()
  if (!rol || rol === (perfil.verComoReal ?? perfil.rol)) galletas.delete("mg-ver-como")
  else galletas.set("mg-ver-como", rol, { httpOnly: true, sameSite: "lax", path: "/admin" })

  refrescar()
  return OK
}

/* ============================================================
   Gala MG
   ============================================================ */

/** Quien opera decide admisiones; quien está en la puerta solo acredita.
 *  Espejo de proteger_admision_gala() en la migración 019. */
const acreditaGala = (p: Perfil) =>
  puede(p.rol, "operar") || tieneExtra(p, "gala:acreditar")

/**
 * Curar un registro de la Gala.
 *
 * Confirmar es lo único que emite el pase: el código QR lo genera el trigger
 * `gala_emitir_pase` al pasar a 'confirmed', no esta función. Aquí no se
 * escribe `codigo` nunca — si algún día hiciera falta reemitirlo, es una
 * decisión de la base, no de la interfaz.
 *
 * El aforo tampoco se comprueba aquí a propósito: subir a alguien de la lista
 * de espera por encima de 80 es una decisión del equipo (alguien avisó que no
 * viene), y la interfaz muestra el conteo para que sea consciente.
 */
export async function actualizarRegistroGala(
  id: string,
  campos: { estado?: string; notas?: string; ingreso?: boolean },
) {
  return mutar(acreditaGala, async (perfil) => {
    if (campos.estado !== undefined && !puede(perfil.rol, "operar")) {
      throw new Error("Admitir o rechazar es de la coordinación. Tú puedes marcar ingresos y anotar.")
    }

    const supabase = await createClient()

    const { ingreso, ...resto } = campos
    const parche: Record<string, unknown> = { ...resto }
    if (ingreso !== undefined) parche.ingreso_at = ingreso ? new Date().toISOString() : null

    if (Object.keys(parche).length === 0) return null

    const { data, error } = await supabase
      .from("gala_registros")
      .update(parche)
      .eq("id", id)
      .select("nombre_completo, estado, codigo")
      .single()
    if (error) throw new Error(error.message)

    const quien = data?.nombre_completo ?? "un registro"

    if (campos.estado === "confirmed") return `🎟 Gala: ${quien} confirmado — pase ${data?.codigo ?? "emitido"}.`
    if (campos.estado) return `🎟 Gala: ${quien} pasó a ${campos.estado}.`
    if (ingreso !== undefined) return `🚪 Gala: ${quien} ${ingreso ? "entró" : "salió de la lista de ingresos"}.`
    return null
  })
}


/* ------------------------------------------------------------
   El correo con el pase
   ------------------------------------------------------------
   Emitir el pase y entregarlo son cosas distintas: el trigger emite al
   confirmar, esto entrega. Se separa a propósito — reenviar el correo a
   alguien que perdió el suyo no debe tocar su estado.

   Enviar es de la coordinación (`operar`), no de quien acredita en la puerta:
   quien recibe el correo entra, así que mandarlo es admitir de hecho. */

const SITIO = process.env.NEXT_PUBLIC_SITIO ?? "https://mgcompany.co"

/** Manda un pase y deja el rastro. Devuelve el error legible o null. */
async function mandarPase(
  supabase: Awaited<ReturnType<typeof createClient>>,
  r: { id: string; nombre_completo: string; nombre_artistico: string | null; email: string; estado: string; codigo: string | null },
): Promise<string | null> {
  if (r.estado !== "confirmed" || !r.codigo) {
    return `${r.nombre_completo} no está confirmado todavía: sin confirmar no hay pase que enviar.`
  }

  const resend = getResend()
  if (!resend) return "Falta RESEND_API_KEY: el envío de correo no está configurado."

  const urlPase = `${SITIO}/gala/pase/${r.codigo}`
  const datos = { nombre_completo: r.nombre_completo, nombre_artistico: r.nombre_artistico, codigo: r.codigo }

  const { error } = await resend.emails.send({
    from: CORREO_DE,
    to: r.email,
    replyTo: CORREO_RESPONDER_A,
    subject: asuntoPase(),
    html: htmlPase(datos, urlPase),
    text: textoPase(datos, urlPase),
  })
  if (error) return `${r.email}: ${error.message}`

  // El sello se intenta después del envío, nunca antes: si la columna todavía
  // no existe o la escritura falla, el correo ya salió y decir lo contrario
  // sería peor que no saber cuándo se mandó.
  await supabase
    .from("gala_registros")
    .update({ correo_enviado_at: new Date().toISOString() })
    .eq("id", r.id)

  return null
}

const CAMPOS_PASE = "id, nombre_completo, nombre_artistico, email, estado, codigo"

/** Enviar (o reenviar) el pase de una persona. */
export async function enviarPaseGala(id: string): Promise<Resultado> {
  return mutar("operar", async () => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("gala_registros").select(CAMPOS_PASE).eq("id", id).single()
    if (error) throw new Error(error.message)

    const fallo = await mandarPase(supabase, data)
    if (fallo) throw new Error(fallo)

    return `📧 Gala: pase enviado a ${data.nombre_completo} (${data.email}).`
  })
}

/**
 * Enviar el pase a todos los confirmados que aún no lo han recibido.
 *
 * En serie y con una pausa: el plan gratuito de Resend admite 2 envíos por
 * segundo, y una ráfaga de 80 en paralelo se corta a la mitad. Con 80 personas
 * son unos 40 segundos — cabe de sobra en una Server Action.
 */
export async function enviarPasesGalaPendientes(): Promise<Resultado> {
  return mutar("operar", async () => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("gala_registros")
      .select(CAMPOS_PASE)
      .eq("estado", "confirmed")
      .is("correo_enviado_at", null)
      .order("created_at")
    if (error) throw new Error(error.message)

    const pendientes = data ?? []
    if (pendientes.length === 0) {
      throw new Error("No hay confirmados sin correo: todos los pases ya salieron.")
    }

    const fallos: string[] = []
    for (const r of pendientes) {
      const fallo = await mandarPase(supabase, r)
      if (fallo) fallos.push(fallo)
      await new Promise((listo) => setTimeout(listo, 600))
    }

    const enviados = pendientes.length - fallos.length
    if (fallos.length) {
      throw new Error(
        `Salieron ${enviados} de ${pendientes.length}. Falló: ${fallos.slice(0, 3).join(" · ")}` +
          (fallos.length > 3 ? ` y ${fallos.length - 3} más.` : ""),
      )
    }

    return `📧 Gala: ${enviados} ${enviados === 1 ? "pase enviado" : "pases enviados"} por correo.`
  })
}
