"use client"

import Link from "next/link"
import { useMemo, useState, useTransition } from "react"

import { clasificarPersona } from "@/app/admin/acciones"
import { conteoGeneros, historialPorPersona, metricasEvento, promotores } from "@/lib/comunidad"
import { urlPerfil } from "@/lib/contacto"
import { GENEROS_EN_VIVO, TIPOS_PERSONA, etiquetaGenero, etiquetaTipoPersona, fechaEvento } from "@/lib/eventos"
import type { Comunidad, PersonaComunidad } from "@/lib/mg/datos"
import { Kpi, Tag, Vacio } from "./ui"

/* ---------- piezas que comparten la vista general y la de cada fiesta ---------- */

export function Redes({ p }: { p: Pick<PersonaComunidad, "instagram" | "tiktok"> }) {
  if (!p.instagram && !p.tiktok) return <span className="muted">—</span>
  return (
    <span style={{ display: "inline-flex", flexDirection: "column", gap: 2 }}>
      {p.instagram ? (
        <a href={urlPerfil("instagram", p.instagram)} target="_blank" rel="noopener noreferrer" className="small">IG @{p.instagram} ↗</a>
      ) : null}
      {p.tiktok ? (
        <a href={urlPerfil("tiktok", p.tiktok)} target="_blank" rel="noopener noreferrer" className="small">TT @{p.tiktok} ↗</a>
      ) : null}
    </span>
  )
}

/** El tipo lo pone el equipo mirando el perfil. Cambia al instante y se
 *  corrige si el servidor dice que no. */
export function SelectorTipo({ persona, puede }: { persona: PersonaComunidad; puede: boolean }) {
  const [tipo, setTipo] = useState(persona.tipo)
  const [pendiente, arrancar] = useTransition()
  if (!puede) return <Tag>{etiquetaTipoPersona(tipo)}</Tag>
  return (
    <select
      value={tipo}
      disabled={pendiente}
      aria-label={`Tipo de ${persona.nombre}`}
      onChange={(e) => {
        const nuevo = e.target.value
        const antes = tipo
        setTipo(nuevo)
        arrancar(async () => {
          const r = await clasificarPersona(persona.id, nuevo)
          if (!r.ok) setTipo(antes)
        })
      }}
    >
      {TIPOS_PERSONA.map((t) => <option key={t.valor} value={t.valor}>{t.label}</option>)}
    </select>
  )
}

/* ---------- la vista ---------- */

type Pestana = "comunidad" | "promotores" | "musica"

export default function VistaEventos({
  comunidad, puedeOperar, puedeAcreditar,
}: {
  comunidad: Comunidad
  puedeOperar: boolean
  puedeAcreditar: boolean
}) {
  const [pestana, setPestana] = useState<Pestana>("comunidad")
  const [busca, setBusca] = useState("")
  const [tipo, setTipo] = useState("todos")
  const [soloRepiten, setSoloRepiten] = useState(false)
  const [soloPauta, setSoloPauta] = useState(false)

  const historial = useMemo(() => historialPorPersona(comunidad), [comunidad])
  const ranking = useMemo(() => promotores(comunidad), [comunidad])
  const generos = useMemo(() => conteoGeneros(comunidad.personas), [comunidad])

  const repiten = comunidad.personas.filter((p) => (historial.get(p.id)?.asistidas ?? 0) >= 2).length
  const pauta = comunidad.personas.filter((p) => p.acepta_invitaciones).length
  const verificados = comunidad.personas.filter((p) => p.email_verificado_at).length
  const promotoresActivos = ranking.filter((r) => r.llegaron > 0).length

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return comunidad.personas
      .filter((p) => tipo === "todos" || p.tipo === tipo)
      .filter((p) => !soloRepiten || (historial.get(p.id)?.asistidas ?? 0) >= 2)
      .filter((p) => !soloPauta || p.acepta_invitaciones)
      .filter((p) => !q || `${p.nombre} ${p.email} ${p.instagram ?? ""} ${p.tiktok ?? ""}`.toLowerCase().includes(q))
      .sort((a, b) =>
        (historial.get(b.id)?.asistidas ?? 0) - (historial.get(a.id)?.asistidas ?? 0) ||
        a.nombre.localeCompare(b.nombre))
  }, [comunidad, historial, busca, tipo, soloRepiten, soloPauta])

  const nombreEvento = (slug: string) => comunidad.eventos.find((e) => e.slug === slug)?.nombre ?? slug

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Eventos y comunidad</h1>
          <div className="sub">
            Una persona por correo, con su historial de fiestas. Lo que cuenta es quién ENTRA con su QR, no quién se inscribe.
          </div>
        </div>
        <div className="spacer" />
        {puedeOperar ? (
          <a className="btn" href="/admin/eventos/exportar" download>Exportar audiencia ↓</a>
        ) : null}
      </div>

      <div className="kpis">
        <Kpi valor={comunidad.personas.length} label="Personas en la base" />
        <Kpi valor={verificados} label="Correo verificado" ayuda="Abrieron su pase o entraron con el QR" />
        <Kpi valor={repiten} label="Repiten" ayuda="Entraron a 2 fiestas o más" />
        <Kpi valor={promotoresActivos} label="Promotores activos" ayuda="Alguien llegó con su link" />
        <Kpi valor={pauta} label="Audiencia para pauta" ayuda="Aceptaron recibir invitaciones" />
      </div>

      <div className="card">
        <h2>Fiestas</h2>
        {comunidad.eventos.length === 0 ? (
          <Vacio titulo="Todavía no hay fiestas">Se crean con una fila en la tabla `eventos`.</Vacio>
        ) : (
          <div className="tabla-wrap">
            <table>
              <thead>
                <tr><th>Fiesta</th><th>Fecha</th><th>Registrados</th><th>Entraron</th><th>Asistencia</th><th>Por referido</th><th /></tr>
              </thead>
              <tbody>
                {comunidad.eventos.map((e) => {
                  const m = metricasEvento(comunidad, e.slug)
                  return (
                    <tr key={e.slug}>
                      <td><b>{e.nombre}</b><div className="small muted">{e.lugar} · {e.ciudad}</div></td>
                      <td className="small" style={{ whiteSpace: "nowrap" }}>{fechaEvento(e.fecha)}</td>
                      <td className="mono">{m.registrados}</td>
                      <td className="mono"><b>{m.entraron}</b></td>
                      <td className="mono">{m.asistencia === null ? "—" : `${m.asistencia}%`}</td>
                      <td className="mono">{m.porReferido}</td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        <Link className="btn sm" href={`/admin/eventos/${e.slug}`}>Ver lista</Link>{" "}
                        {puedeAcreditar ? <Link className="btn sm" href={`/admin/eventos/${e.slug}/puerta`}>Puerta</Link> : null}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div className="seg" style={{ marginBottom: 14 }}>
          <button type="button" className={pestana === "comunidad" ? "on" : ""} onClick={() => setPestana("comunidad")}>Comunidad</button>
          <button type="button" className={pestana === "promotores" ? "on" : ""} onClick={() => setPestana("promotores")}>Promotores</button>
          <button type="button" className={pestana === "musica" ? "on" : ""} onClick={() => setPestana("musica")}>Música</button>
        </div>

        {pestana === "comunidad" ? (
          <>
            <div className="frow" style={{ marginTop: 0 }}>
              <input placeholder="Buscar nombre, correo o usuario…" value={busca} onChange={(e) => setBusca(e.target.value)}
                style={{ flex: 1, minWidth: 180 }} aria-label="Buscar persona" />
              <select value={tipo} onChange={(e) => setTipo(e.target.value)} aria-label="Filtrar por tipo">
                <option value="todos">Todos los tipos</option>
                {TIPOS_PERSONA.map((t) => <option key={t.valor} value={t.valor}>{t.label}</option>)}
              </select>
              <label className="small"><input type="checkbox" checked={soloRepiten} onChange={(e) => setSoloRepiten(e.target.checked)} /> Solo quienes repiten</label>
              <label className="small"><input type="checkbox" checked={soloPauta} onChange={(e) => setSoloPauta(e.target.checked)} /> Solo audiencia de pauta</label>
              <span className="small muted">{lista.length} personas</span>
            </div>
            {lista.length === 0 ? (
              <Vacio titulo="Nadie coincide">Prueba con otro filtro.</Vacio>
            ) : (
              <div className="tabla-wrap">
                <table>
                  <thead>
                    <tr><th>Persona</th><th>Redes</th><th>Tipo</th><th>Fiestas</th><th>Música</th><th>Correo</th><th>Pauta</th></tr>
                  </thead>
                  <tbody>
                    {lista.map((p) => {
                      const h = historial.get(p.id)
                      return (
                        <tr key={p.id}>
                          <td><b>{p.nombre}</b><div className="small muted">{p.email}</div></td>
                          <td><Redes p={p} /></td>
                          <td><SelectorTipo persona={p} puede={puedeOperar} /></td>
                          <td className="small">
                            <b className="mono">{h?.asistidas ?? 0}</b> <span className="muted">de {h?.registradas ?? 0}</span>
                            {h && h.fiestas.length ? <div className="small muted">{h.fiestas.map(nombreEvento).join(" · ")}</div> : null}
                          </td>
                          <td className="small">{p.generos.length ? p.generos.map(etiquetaGenero).join(", ") : <span className="muted">—</span>}</td>
                          <td className="small">{p.email_verificado_at ? "✓ verificado" : <span className="muted">sin verificar</span>}</td>
                          <td className="small">{p.acepta_invitaciones ? "✓" : <span className="muted">no</span>}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : null}

        {pestana === "promotores" ? (
          ranking.length === 0 ? (
            <Vacio titulo="Todavía nadie ha traído gente">
              Cuando alguien se registre con el link de otra persona, aparece aquí. El orden lo da cuántos de sus invitados ENTRARON.
            </Vacio>
          ) : (
            <div className="tabla-wrap">
              <table>
                <thead>
                  <tr><th>#</th><th>Promotor</th><th>Redes</th><th>Invitados</th><th>Llegaron</th><th>Efectividad</th><th>Fiestas</th></tr>
                </thead>
                <tbody>
                  {ranking.map((r, i) => (
                    <tr key={r.persona.id}>
                      <td className="mono small">{String(i + 1).padStart(2, "0")}</td>
                      <td><b>{r.persona.nombre}</b><div className="small muted">{etiquetaTipoPersona(r.persona.tipo)}</div></td>
                      <td><Redes p={r.persona} /></td>
                      <td className="mono">{r.invitados}</td>
                      <td className="mono"><b>{r.llegaron}</b></td>
                      <td className="mono">{r.invitados ? `${Math.round((r.llegaron / r.invitados) * 100)}%` : "—"}</td>
                      <td className="mono">{r.fiestas}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : null}

        {pestana === "musica" ? (
          <>
            <p className="small muted" style={{ marginTop: 0 }}>
              Cuántas personas de la base marcaron cada género para música en vivo. Sirve para decidir qué fiesta armar y a quién invitarla.
            </p>
            <div style={{ display: "grid", gap: 8, maxWidth: 560 }}>
              {[...GENEROS_EN_VIVO]
                .map((g) => ({ ...g, n: generos.get(g.valor) ?? 0 }))
                .sort((a, b) => b.n - a.n)
                .map((g) => {
                  const max = Math.max(1, ...generos.values())
                  return (
                    <div key={g.valor} style={{ display: "grid", gridTemplateColumns: "190px 1fr 40px", gap: 10, alignItems: "center" }}>
                      <span className="small">{g.label}</span>
                      <span style={{ height: 10, background: "var(--grid)", borderRadius: 2, overflow: "hidden" }}>
                        <span style={{ display: "block", height: "100%", width: `${(g.n / max) * 100}%`, background: "var(--brand)" }} />
                      </span>
                      <span className="mono small" style={{ textAlign: "right" }}>{g.n}</span>
                    </div>
                  )
                })}
            </div>
          </>
        ) : null}
      </div>
    </>
  )
}
