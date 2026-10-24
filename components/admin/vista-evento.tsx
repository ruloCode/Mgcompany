"use client"

import Link from "next/link"
import { useMemo, useState, useTransition } from "react"

import { reenviarPaseEvento } from "@/app/admin/acciones"
import { conteoGeneros, metricasEvento, promotores } from "@/lib/comunidad"
import { etiquetaGenero, fechaEvento, horaEvento } from "@/lib/eventos"
import type { Comunidad } from "@/lib/mg/datos"
import { Kpi, Vacio } from "./ui"
import { Redes, SelectorTipo } from "./vista-eventos"

type Filtro = "todos" | "sin_abrir" | "entraron" | "no_entraron" | "referidos"

const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit", timeZone: "America/Bogota" })

export default function VistaEvento({
  comunidad, slug, puedeOperar, puedeAcreditar,
  base = `/admin/eventos/${slug}`,
  volver = { href: "/admin/eventos", label: "← Comunidad" },
}: {
  comunidad: Comunidad
  slug: string
  puedeOperar: boolean
  puedeAcreditar: boolean
  /** Ruta de esta pantalla en el panel; la puerta cuelga de ella. */
  base?: string
  /** null en "Fiesta Def" para quien no ve la comunidad completa. */
  volver?: { href: string; label: string } | null
}) {
  const evento = comunidad.eventos.find((e) => e.slug === slug)!
  const [busca, setBusca] = useState("")
  const [filtro, setFiltro] = useState<Filtro>("todos")
  const [aviso, setAviso] = useState<Record<string, string>>({})
  const [pendiente, arrancar] = useTransition()

  const porId = useMemo(() => new Map(comunidad.personas.map((p) => [p.id, p])), [comunidad])
  const m = metricasEvento(comunidad, slug)
  const ranking = useMemo(() => promotores(comunidad, slug).slice(0, 10), [comunidad, slug])

  const registros = useMemo(() => comunidad.registros.filter((r) => r.evento === slug), [comunidad, slug])
  const generos = useMemo(
    () => conteoGeneros(registros.map((r) => porId.get(r.persona_id)).filter((p) => p !== undefined)),
    [registros, porId],
  )

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return registros
      .filter((r) =>
        filtro === "todos" ? true
        : filtro === "sin_abrir" ? !r.pase_abierto_at && !r.ingreso_at
        : filtro === "entraron" ? Boolean(r.ingreso_at)
        : filtro === "no_entraron" ? !r.ingreso_at
        : Boolean(r.referido_por))
      .filter((r) => {
        if (!q) return true
        const p = porId.get(r.persona_id)
        return `${p?.nombre ?? ""} ${p?.email ?? ""} ${p?.instagram ?? ""} ${p?.tiktok ?? ""} ${r.codigo}`.toLowerCase().includes(q)
      })
  }, [registros, porId, busca, filtro])

  const reenviar = (id: string) =>
    arrancar(async () => {
      setAviso((a) => ({ ...a, [id]: "Enviando…" }))
      const r = await reenviarPaseEvento(id)
      setAviso((a) => ({ ...a, [id]: r.ok ? "✓ Reenviado" : r.error ?? "No salió" }))
    })

  return (
    <>
      <div className="topbar">
        <div>
          <h1>{evento.nombre}</h1>
          <div className="sub">
            {fechaEvento(evento.fecha)} · puertas {horaEvento(evento.hora_puertas)} · {evento.lugar}, {evento.ciudad}.
            Lista sin cupo: el QR sale al correo en cuanto alguien se registra.
          </div>
        </div>
        <div className="spacer" />
        {volver ? <Link className="btn" href={volver.href}>{volver.label}</Link> : null}
        {puedeAcreditar ? <Link className="btn primary" href={`${base}/puerta`}>Abrir puerta</Link> : null}
        <a className="btn" href={`/fiesta/${slug}`} target="_blank" rel="noopener noreferrer">Ver landing ↗</a>
      </div>

      <div className="kpis">
        <Kpi valor={m.registrados} label="Registrados" />
        <Kpi valor={m.conCorreo} label="QR enviado" ayuda="Les salió el correo" />
        <Kpi valor={m.verificados} label="Abrieron su pase" ayuda="El correo es suyo" />
        <Kpi valor={m.entraron} label="Entraron" ayuda="Leídos en la puerta" />
        <Kpi valor={m.asistencia === null ? "—" : `${m.asistencia}%`} label="Asistencia" ayuda="Entraron de los registrados" />
        <Kpi valor={m.porReferido} label="Llegaron por un link" ayuda="Se registraron con el link de alguien" />
      </div>

      <div className="card">
        <h2>Promotores de esta fiesta</h2>
        {ranking.length === 0 ? (
          <Vacio titulo="Todavía nadie ha traído gente con su link" />
        ) : (
          <div className="tabla-wrap">
            <table>
              <thead><tr><th>#</th><th>Promotor</th><th>Redes</th><th>Invitados</th><th>Llegaron</th></tr></thead>
              <tbody>
                {ranking.map((r, i) => (
                  <tr key={r.persona.id}>
                    <td className="mono small">{String(i + 1).padStart(2, "0")}</td>
                    <td><b>{r.persona.nombre}</b></td>
                    <td><Redes p={r.persona} /></td>
                    <td className="mono">{r.invitados}</td>
                    <td className="mono"><b>{r.llegaron}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h2>Lista</h2>
        <div className="frow" style={{ marginTop: 0 }}>
          <input placeholder="Buscar nombre, correo, usuario o código…" value={busca} onChange={(e) => setBusca(e.target.value)}
            style={{ flex: 1, minWidth: 180 }} aria-label="Buscar en la lista" />
          <select value={filtro} onChange={(e) => setFiltro(e.target.value as Filtro)} aria-label="Filtrar la lista">
            <option value="todos">Todos</option>
            <option value="sin_abrir">No han abierto su pase</option>
            <option value="entraron">Ya entraron</option>
            <option value="no_entraron">No han entrado</option>
            <option value="referidos">Llegaron por un link</option>
          </select>
          <span className="small muted">{lista.length} de {registros.length}</span>
        </div>

        {lista.length === 0 ? (
          <Vacio titulo={registros.length ? "Nadie coincide" : "Todavía no hay registros"}>
            {registros.length ? "Prueba con otro filtro." : `Comparte /fiesta/${slug} para empezar a llenar la lista.`}
          </Vacio>
        ) : (
          <div className="tabla-wrap">
            <table>
              <thead>
                <tr><th>Persona</th><th>Redes</th><th>Tipo</th><th>Invitado por</th><th>Pase</th><th>Música</th><th /></tr>
              </thead>
              <tbody>
                {lista.map((r) => {
                  const p = porId.get(r.persona_id)
                  if (!p) return null
                  const invito = r.referido_por ? porId.get(r.referido_por) : undefined
                  return (
                    <tr key={r.id}>
                      <td>
                        <b>{p.nombre}</b>
                        <div className="small muted">{p.email}</div>
                        {p.whatsapp_e164 ? (
                          <a className="small" href={`https://wa.me/${p.whatsapp_e164.replace("+", "")}`} target="_blank" rel="noopener noreferrer">
                            {p.whatsapp_e164} ↗
                          </a>
                        ) : null}
                      </td>
                      <td><Redes p={p} /></td>
                      <td><SelectorTipo persona={p} puede={puedeOperar} /></td>
                      <td className="small">{invito ? invito.nombre : <span className="muted">—</span>}</td>
                      <td className="small" style={{ whiteSpace: "nowrap" }}>
                        <div className="mono">{r.codigo}</div>
                        {r.ingreso_at ? <b>Entró {hora(r.ingreso_at)}</b>
                          : r.pase_abierto_at ? "Abrió su pase"
                          : r.correo_enviado_at ? <span className="muted">Correo enviado</span>
                          : <span style={{ color: "var(--critical)" }}>Sin correo</span>}
                      </td>
                      <td className="small">{p.generos.length ? p.generos.map(etiquetaGenero).join(", ") : <span className="muted">—</span>}</td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        {puedeOperar && !r.ingreso_at ? (
                          <button className="btn sm" disabled={pendiente} onClick={() => reenviar(r.id)}>
                            {aviso[r.id] ?? "Reenviar QR"}
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {generos.size ? (
        <div className="card">
          <h2>Qué música le gusta a esta lista</h2>
          <p className="small muted" style={{ marginTop: 0 }}>
            {[...generos.entries()].sort((a, b) => b[1] - a[1]).map(([g, n]) => `${etiquetaGenero(g)} (${n})`).join(" · ")}
          </p>
        </div>
      ) : null}
    </>
  )
}
