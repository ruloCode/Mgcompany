import type { Comunidad, PersonaComunidad } from "@/lib/mg/datos"

/* ============================================================
   Las cuentas de la comunidad
   ============================================================
   Funciones puras sobre lo que carga cargarComunidad(): sin red, sin estado,
   para que las mismas cifras salgan igual en la lista, en la ficha de una
   fiesta y en la exportación.

   Una regla atraviesa todo el archivo: lo que VALE es entrar, no inscribirse.
   Inscribirse es gratis y no prueba nada; entrar exige un QR que solo llegó a
   un correo real. Por eso un promotor se ordena por cuántos de sus invitados
   ENTRARON, y la inscripción queda como dato secundario. */

export interface MetricasEvento {
  registrados: number
  /** Les salió el correo con el QR. */
  conCorreo: number
  /** Abrieron el pase: el correo es suyo. */
  verificados: number
  entraron: number
  /** entraron / registrados, en %. null si no hay registrados. */
  asistencia: number | null
  /** Registrados que llegaron por el link de alguien. */
  porReferido: number
}

export function metricasEvento(c: Comunidad, evento: string): MetricasEvento {
  const regs = c.registros.filter((r) => r.evento === evento)
  const entraron = regs.filter((r) => r.ingreso_at).length
  return {
    registrados: regs.length,
    conCorreo: regs.filter((r) => r.correo_enviado_at).length,
    verificados: regs.filter((r) => r.pase_abierto_at || r.ingreso_at).length,
    entraron,
    asistencia: regs.length ? Math.round((entraron / regs.length) * 100) : null,
    porReferido: regs.filter((r) => r.referido_por).length,
  }
}

export interface Promotor {
  persona: PersonaComunidad
  /** Se registraron con su link. */
  invitados: number
  /** De esos, cuántos entraron con su QR. Es la cifra que ordena. */
  llegaron: number
  /** En cuántas fiestas distintas ha traído gente. */
  fiestas: number
}

/** El ranking de promotores. Sin `evento`, de toda la historia. */
export function promotores(c: Comunidad, evento?: string): Promotor[] {
  const porId = new Map(c.personas.map((p) => [p.id, p]))
  const acum = new Map<string, { invitados: number; llegaron: number; fiestas: Set<string> }>()

  for (const r of c.registros) {
    if (!r.referido_por || (evento && r.evento !== evento)) continue
    const a = acum.get(r.referido_por) ?? { invitados: 0, llegaron: 0, fiestas: new Set<string>() }
    a.invitados++
    if (r.ingreso_at) {
      a.llegaron++
      a.fiestas.add(r.evento)
    }
    acum.set(r.referido_por, a)
  }

  return [...acum.entries()]
    .filter(([id]) => porId.has(id))
    .map(([id, a]) => ({ persona: porId.get(id)!, invitados: a.invitados, llegaron: a.llegaron, fiestas: a.fiestas.size }))
    .sort((x, y) => y.llegaron - x.llegaron || y.invitados - x.invitados || x.persona.nombre.localeCompare(y.persona.nombre))
}

export interface Historial {
  /** Fiestas a las que se registró. */
  registradas: number
  /** Fiestas a las que ENTRÓ. "Repite" es asistidas >= 2. */
  asistidas: number
  ultimaAsistencia: string | null
  /** Slugs de las fiestas a las que entró, de la más reciente a la más vieja. */
  fiestas: string[]
}

export function historialPorPersona(c: Comunidad): Map<string, Historial> {
  const fechaDe = new Map(c.eventos.map((e) => [e.slug, e.fecha]))
  const h = new Map<string, Historial>()
  for (const r of c.registros) {
    const x = h.get(r.persona_id) ?? { registradas: 0, asistidas: 0, ultimaAsistencia: null, fiestas: [] }
    x.registradas++
    if (r.ingreso_at) {
      x.asistidas++
      x.fiestas.push(r.evento)
      const f = fechaDe.get(r.evento) ?? r.ingreso_at.slice(0, 10)
      if (!x.ultimaAsistencia || f > x.ultimaAsistencia) x.ultimaAsistencia = f
    }
    h.set(r.persona_id, x)
  }
  for (const x of h.values()) x.fiestas.sort((a, b) => (fechaDe.get(b) ?? "").localeCompare(fechaDe.get(a) ?? ""))
  return h
}

/** Cuántas personas marcaron cada género, para saber qué fiesta armar después. */
export function conteoGeneros(personas: PersonaComunidad[]): Map<string, number> {
  const m = new Map<string, number>()
  for (const p of personas) for (const g of p.generos) m.set(g, (m.get(g) ?? 0) + 1)
  return m
}

/* ---------- exportar para pauta ---------- */

/** CSV con las columnas que Meta reconoce al crear una audiencia
 *  personalizada (email, phone, fn, ln, dob, ct, country). TikTok acepta el
 *  mismo archivo usando email y phone.
 *
 *  SOLO entran quienes marcaron "quiero que me inviten": esa casilla es el
 *  consentimiento para pauta. Sin ella, subir su correo a Meta sería usar sus
 *  datos para algo que no autorizó (Ley 1581). */
export function csvAudiencia(personas: PersonaComunidad[]): string {
  const filas = personas.filter((p) => p.acepta_invitaciones)
  const celda = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
  const lineas = ["email,phone,fn,ln,dob,ct,country"]
  for (const p of filas) {
    const [fn, ...resto] = p.nombre.trim().split(/\s+/)
    const dob = p.fecha_nacimiento ? p.fecha_nacimiento.replaceAll("-", "") : ""
    lineas.push([p.email, p.whatsapp_e164 ?? "", fn ?? "", resto.join(" "), dob, "", "co"].map(celda).join(","))
  }
  return lineas.join("\n")
}
