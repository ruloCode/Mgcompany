"use client"

import { useMemo, useState } from "react"

import type { VotoPublico } from "@/lib/mg/datos"
import { hoy } from "@/lib/mg/fechas"
import {
  FINALISTAS,
  MG1_VOTACION_ABRE,
  MG1_VOTACION_CIERRA,
  estadoVentana,
  fechaLargaVotacion,
  horaVotacion,
  nombreFinalista,
} from "@/lib/mg1-votacion"
import { Kpi, Tag, Vacio } from "./ui"

/* El escrutinio de la votación del público.

   Es la única pantalla donde existe el resultado. La ven owner y admin (el
   permiso "escrutinio" y, debajo, la policy de la migración 026), y aun así
   el ranking arranca tapado: esta pantalla se abre en reuniones, en un
   portátil sobre una mesa o compartiendo pantalla, y el resultado no debería
   filtrarse por encima del hombro de nadie. Destaparlo es un clic consciente.

   Solo cuentan los votos CONFIRMADOS por correo. Los pendientes se muestran
   como total, nunca repartidos por finalista: sumarlos sería contar votos que
   todavía no han demostrado ser de una persona. */

function descargar(nombre: string, contenido: string) {
  const blob = new Blob(["﻿" + contenido], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = nombre
  a.click()
  URL.revokeObjectURL(url)
}

function aCsv(filas: Record<string, unknown>[]): string {
  if (!filas.length) return ""
  const cols = Object.keys(filas[0])
  const celda = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [cols.join(","), ...filas.map((f) => cols.map((c) => celda(f[c])).join(","))].join("\n")
}

const fechaHora = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat("es-CO", {
        day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "America/Bogota",
      }).format(new Date(iso))
    : "—"

const pct = (n: number, total: number) => (total ? Math.round((n / total) * 1000) / 10 : 0)

/** Los N valores más frecuentes de una columna, con su conteo. */
function top(lista: string[], n: number) {
  const m = new Map<string, number>()
  for (const v of lista) m.set(v, (m.get(v) ?? 0) + 1)
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n)
}

const ETIQUETA_VENTANA = {
  antes: { label: "Todavía no abre", color: "var(--muted)" },
  abierta: { label: "Abierta", color: "var(--good)" },
  cerrada: { label: "Cerrada", color: "var(--critical)" },
} as const

export default function VistaVotacion({
  votos, error, ahora,
}: {
  votos: VotoPublico[]
  error: string | null
  ahora: string
}) {
  const [revelado, setRevelado] = useState(false)
  const [busca, setBusca] = useState("")
  const [soloPendientes, setSoloPendientes] = useState(false)

  const ventana = estadoVentana(ahora)
  const confirmados = votos.filter((v) => v.finalista)
  const pendientes = votos.filter((v) => !v.finalista)
  const total = confirmados.length

  const ranking = useMemo(() => {
    const conteo = new Map(FINALISTAS.map((f) => [f.slug, 0]))
    for (const v of confirmados) conteo.set(v.finalista!, (conteo.get(v.finalista!) ?? 0) + 1)
    return [...conteo.entries()]
      .map(([slug, n]) => ({ slug, n, f: FINALISTAS.find((x) => x.slug === slug) }))
      .sort((a, b) => b.n - a.n)
  }, [confirmados])

  const empate = ranking.length > 1 && ranking[0].n === ranking[1].n && ranking[0].n > 0
  const maximo = ranking[0]?.n ?? 0

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return votos.filter((v) => {
      if (soloPendientes && v.finalista) return false
      if (!q) return true
      return [v.nombre, v.email, v.ciudad, v.utm_source ?? ""].join(" ").toLowerCase().includes(q)
    })
  }, [votos, busca, soloPendientes])

  const exportar = () =>
    descargar(
      `mg1-votacion-${hoy()}.csv`,
      aCsv(
        votos.map((v) => ({
          nombre: v.nombre,
          email: v.email,
          ciudad: v.ciudad,
          es_artista: v.es_artista ? "si" : "no",
          estado: v.finalista ? "confirmado" : "pendiente",
          voto: v.finalista ? nombreFinalista(v.finalista) : "",
          confirmado: v.confirmado_at ?? "",
          cambios: v.cambios,
          fuente: v.utm_source ?? "",
          primer_voto: v.created_at,
        })),
      ),
    )

  const v = ETIQUETA_VENTANA[ventana]

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Votación MG1</h1>
          <div className="sub">
            Abre {fechaLargaVotacion(MG1_VOTACION_ABRE).toLowerCase()}, {horaVotacion(MG1_VOTACION_ABRE)} · cierra{" "}
            {fechaLargaVotacion(MG1_VOTACION_CIERRA).toLowerCase()}, {horaVotacion(MG1_VOTACION_CIERRA)}. Solo
            cuentan los votos confirmados por correo. Esta pantalla solo la ven owner y admin.
          </div>
        </div>
        <div className="spacer" />
        <Tag suave color={v.color}>{v.label}</Tag>
        <a className="btn" href="/mg1/votacion" target="_blank" rel="noopener noreferrer">Ver landing ↗</a>
      </div>

      {error ? (
        <div className="card">
          <h2>No se pudo leer la votación</h2>
          <p className="small muted">
            {error}. Si la tabla no existe, falta aplicar la migración{" "}
            <span className="mono">026_mg1_votacion_publico.sql</span>.
          </p>
        </div>
      ) : null}

      <div className="kpis">
        <Kpi valor={total} label="Votos que cuentan" ayuda="Confirmados desde el correo" />
        <Kpi valor={pendientes.length} label="Sin confirmar" ayuda="No cuentan hasta abrir el enlace" />
        <Kpi
          valor={votos.length ? `${Math.round((total / votos.length) * 100)}%` : "—"}
          label="Confirman"
          ayuda="De quienes votaron, cuántos abrieron el correo"
        />
        <Kpi
          valor={total ? `${Math.round((confirmados.filter((x) => x.es_artista).length / total) * 100)}%` : "—"}
          label="Son artistas"
          ayuda="Base B: a quién ofrecer producción"
        />
        <Kpi valor={confirmados.reduce((s, x) => s + x.cambios, 0)} label="Cambios de voto" />
      </div>

      <div className="card">
        <h2>
          Resultado
          <span className="spacer" />
          {revelado ? (
            <button className="btn sm" onClick={() => setRevelado(false)}>Tapar</button>
          ) : null}
        </h2>

        {!revelado ? (
          <div className="votacion-telon">
            <p className="small muted" style={{ margin: 0 }}>
              El resultado está tapado para que no se lea por encima del hombro. Destápalo solo con quien deba verlo.
            </p>
            <button className="btn brand" onClick={() => setRevelado(true)}>Destapar resultado</button>
          </div>
        ) : total === 0 ? (
          <Vacio titulo="Todavía no hay votos confirmados">
            Aparecen aquí en cuanto alguien abre el enlace de su correo y confirma.
          </Vacio>
        ) : (
          <>
            <ol className="votacion-ranking">
              {ranking.map((r, i) => (
                <li key={r.slug} className={i === 0 && !empate ? "lider" : undefined}>
                  <span className="pos mono">{i + 1}</span>
                  <div className="quien">
                    <b>{r.f?.nombre ?? r.slug}</b>
                    <span className="small muted">{r.f ? `«${r.f.cancion}»` : "Ya no está en el catálogo"}</span>
                  </div>
                  <div className="barra" aria-hidden>
                    <i style={{ width: `${maximo ? (r.n / maximo) * 100 : 0}%` }} />
                  </div>
                  <span className="n mono">{r.n}</span>
                  <span className="p mono">{pct(r.n, total)}%</span>
                  {i === 0 && !empate && ventana === "cerrada" ? <Tag color="var(--brand)">Campeón</Tag> : null}
                </li>
              ))}
            </ol>
            {empate ? (
              <p className="small" style={{ color: "var(--critical)", marginTop: 10, marginBottom: 0 }}>
                Empate en el primer puesto. Decidan el desempate antes de la coronación.
              </p>
            ) : null}
          </>
        )}
      </div>

      <div className="votacion-grid">
        <div className="card">
          <h2>De dónde llegan</h2>
          {total === 0 ? (
            <p className="small muted">Sin votos confirmados todavía.</p>
          ) : (
            <table>
              <thead><tr><th>Fuente (utm_source)</th><th style={{ textAlign: "right" }}>Votos</th></tr></thead>
              <tbody>
                {top(confirmados.map((x) => x.utm_source || "directo"), 8).map(([k, n]) => (
                  <tr key={k}><td>{k}</td><td className="mono" style={{ textAlign: "right" }}>{n}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="card">
          <h2>Ciudades</h2>
          {total === 0 ? (
            <p className="small muted">Sin votos confirmados todavía.</p>
          ) : (
            <table>
              <thead><tr><th>Ciudad</th><th style={{ textAlign: "right" }}>Votos</th></tr></thead>
              <tbody>
                {top(confirmados.map((x) => x.ciudad.trim().toLowerCase()), 8).map(([k, n]) => (
                  <tr key={k}><td style={{ textTransform: "capitalize" }}>{k}</td><td className="mono" style={{ textAlign: "right" }}>{n}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="card">
        <h2>
          Votantes
          <span className="spacer" />
          <button className="btn sm" onClick={exportar} disabled={!votos.length}>Exportar CSV</button>
        </h2>
        <div className="frow">
          <input placeholder="Buscar nombre, correo, ciudad o fuente…" value={busca}
            onChange={(e) => setBusca(e.target.value)} style={{ flex: 1, minWidth: 180 }}
            aria-label="Buscar votante" />
          <label className="small" style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
            <input type="checkbox" checked={soloPendientes} onChange={(e) => setSoloPendientes(e.target.checked)} />
            Solo sin confirmar
          </label>
          <span className="small muted">{lista.length} de {votos.length}</span>
        </div>

        {lista.length === 0 ? (
          <Vacio titulo="Nadie por aquí">Los votantes aparecen en cuanto alguien envía el formulario de /mg1/votacion.</Vacio>
        ) : (
          <div className="tabla-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th><th>Correo</th><th>Ciudad</th><th>Artista</th>
                  {/* Por persona, el voto también va tapado: con la lista se reconstruye el ranking. */}
                  <th>Voto</th><th>Confirmado</th><th>Fuente</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((x) => (
                  <tr key={x.id}>
                    <td>{x.nombre}</td>
                    <td className="mono">{x.email}</td>
                    <td>{x.ciudad}</td>
                    <td>{x.es_artista ? "Sí" : "No"}</td>
                    <td>
                      {x.finalista
                        ? revelado ? nombreFinalista(x.finalista) : "•••"
                        : <Tag suave color="var(--warning)">Sin confirmar</Tag>}
                    </td>
                    <td className="small">{fechaHora(x.confirmado_at)}</td>
                    <td className="small muted">{x.utm_source ?? "directo"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
