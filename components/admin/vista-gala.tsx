"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { fmt } from "@/lib/mg/fechas"
import type { RegistroGala } from "@/lib/mg/datos"
import { actualizarRegistroGala, enviarPaseGala, enviarPasesGalaPendientes } from "@/app/admin/acciones"
import { whatsapp } from "@/lib/mg/telefono"
import {
  ESTADOS_GALA,
  GALA_CUPO,
  GALA_HORARIO,
  TIPOS_ASISTENTE,
  colorEstado,
  etiquetaEstado,
  etiquetaTipo,
  fechaLarga,
} from "@/lib/gala"
import { Copiar, Kpi, Modal, Tag, Vacio } from "./ui"

/* Curaduría de la Gala.
   Dos trabajos distintos en la misma pantalla y conviene no confundirlos:
   ADMITIR (quién entra, lo decide la coordinación) y ACREDITAR (quién ya
   llegó, lo marca quien está en la puerta). El segundo puede venir de una
   concesión individual —'gala:acreditar'— sin dar voto en el primero. */

const FILTROS = [
  { valor: "todos", label: "Todos" },
  ...ESTADOS_GALA.map((e) => ({ valor: e.valor, label: e.label })),
]

/** Asunto y cuerpo del correo de confirmación.
 *
 *  El envío es manual a propósito: no hay proveedor de correo conectado, así
 *  que el panel arma el mensaje y lo abre en el cliente de correo de quien
 *  confirma. Prometer un envío automático que no existe sería peor que un
 *  clic. Cuando se conecte uno (Resend o similar), esta función es el texto
 *  que ese servicio debe mandar.
 */
function enlaceCorreo(r: RegistroGala, urlPase: string | null): string {
  const nombre = (r.nombre_artistico || r.nombre_completo).split(" ")[0]
  const cuando = `${fechaLarga()}, ${GALA_HORARIO}`

  const asunto =
    r.estado === "confirmed"
      ? "Tu pase para la Gala MG · estás dentro"
      : r.estado === "waitlist"
        ? "Gala MG · quedaste en lista de espera"
        : "Recibimos tu registro a la Gala MG"

  const cuerpo =
    r.estado === "confirmed" && urlPase
      ? `Hola ${nombre},\n\nTu registro quedó confirmado para la Gala MG.\n\nCuándo: ${cuando}\nDónde: Bogotá (te compartimos la dirección exacta por este medio)\n\nEste es tu pase de entrada:\n${urlPase}\n\nEs único e intransferible: preséntalo en la puerta desde tu celular. Nos vemos.\n\nEquipo MG Company`
      : r.estado === "waitlist"
        ? `Hola ${nombre},\n\nRecibimos tu registro a la Gala MG. El cupo ya está lleno, así que quedaste en lista de espera: si se abre un espacio te escribimos por este mismo medio, en orden de llegada.\n\nGracias por querer estar.\n\nEquipo MG Company`
        : r.estado === "rejected"
          ? `Hola ${nombre},\n\nGracias por registrarte a la Gala MG. Esta vez no alcanzamos a darte un lugar, pero te avisamos del siguiente encuentro.\n\nEquipo MG Company`
          : `Hola ${nombre},\n\nRecibimos tu registro a la Gala MG (${cuando}). Estamos armando la lista y te confirmamos por este medio.\n\nEquipo MG Company`

  return `mailto:${r.email}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`
}

/** WhatsApp queda para lo urgente del mismo día, no para confirmar. */
function mensajeWhatsApp(r: RegistroGala, urlPase: string | null): string {
  const nombre = (r.nombre_artistico || r.nombre_completo).split(" ")[0]
  const cuando = `${fechaLarga()}, ${GALA_HORARIO}`

  if (r.estado === "confirmed" && urlPase) {
    return `¡Hola ${nombre}! Tu registro quedó confirmado para la Gala MG — ${cuando}. Este es tu pase de entrada: ${urlPase} Es único e intransferible, preséntalo en la puerta. Nos vemos.`
  }
  if (r.estado === "waitlist") {
    return `¡Hola ${nombre}! Recibimos tu registro para la Gala MG. El cupo ya está lleno, así que quedaste en lista de espera: si se abre un espacio te escribimos por aquí de una.`
  }
  if (r.estado === "rejected") {
    return `¡Hola ${nombre}! Gracias por registrarte a la Gala MG. Esta vez no alcanzamos a darte un lugar, pero te avisamos del siguiente encuentro.`
  }
  return `¡Hola ${nombre}! Recibimos tu registro para la Gala MG (${cuando}). Estamos armando la lista y te confirmamos por aquí.`
}

export default function VistaGala({
  registros, puedeAdmitir, puedeAcreditar,
}: {
  registros: RegistroGala[]
  /** Mover el estado: confirmar, rechazar, subir de la lista de espera. */
  puedeAdmitir: boolean
  /** Marcar ingresos y anotar. Puede venir de una concesión individual. */
  puedeAcreditar: boolean
}) {
  const [filtro, setFiltro] = useState("todos")
  const [tipo, setTipo] = useState("todos")
  const [busca, setBusca] = useState("")
  const [soloSinEntrar, setSoloSinEntrar] = useState(false)
  const [detalle, setDetalle] = useState<RegistroGala | null>(null)
  const [aviso, setAviso] = useState<{ ok: boolean; msg: string } | null>(null)
  const [enviando, setEnviando] = useState<string | null>(null)
  const [, arrancar] = useTransition()

  // El origen sale del navegador porque el pase se comparte por WhatsApp y
  // tiene que apuntar al dominio por el que entró el equipo, no a uno fijo.
  const [origen, setOrigen] = useState("")
  useEffect(() => setOrigen(window.location.origin), [])

  const urlPase = (r: RegistroGala) => (r.codigo ? `${origen}/gala/pase/${r.codigo}` : null)

  const conteo = (e: string) => registros.filter((r) => r.estado === e).length
  const confirmados = conteo("confirmed")
  const pendientes = conteo("pending")
  const ocupados = confirmados + pendientes
  const entraron = registros.filter((r) => r.ingreso_at).length

  const lista = useMemo(() => {
    let l = registros
    if (filtro !== "todos") l = l.filter((r) => r.estado === filtro)
    if (tipo !== "todos") l = l.filter((r) => r.tipo_asistente === tipo)
    if (soloSinEntrar) l = l.filter((r) => !r.ingreso_at)
    if (busca) {
      const q = busca.toLowerCase()
      l = l.filter((r) =>
        `${r.nombre_completo} ${r.nombre_artistico ?? ""} ${r.email} ${r.celular} ${r.codigo ?? ""} ${r.instagram ?? ""}`
          .toLowerCase()
          .includes(q))
    }
    return l
  }, [registros, filtro, tipo, busca, soloSinEntrar])

  const cambiarEstado = (r: RegistroGala, estado: string) =>
    arrancar(async () => { await actualizarRegistroGala(r.id, { estado }) })

  const alternarIngreso = (r: RegistroGala) =>
    arrancar(async () => { await actualizarRegistroGala(r.id, { ingreso: !r.ingreso_at }) })

  const enviarUno = async (r: RegistroGala) => {
    setAviso(null)
    setEnviando(r.id)
    const res = await enviarPaseGala(r.id)
    setEnviando(null)
    setAviso(res.ok
      ? { ok: true, msg: `Pase enviado a ${r.email}.` }
      : { ok: false, msg: res.error ?? "No se pudo enviar." })
  }

  const enviarTodos = async () => {
    setAviso(null)
    setEnviando("todos")
    const res = await enviarPasesGalaPendientes()
    setEnviando(null)
    setAviso(res.ok
      ? { ok: true, msg: `Listo: los pases pendientes salieron por correo.` }
      : { ok: false, msg: res.error ?? "No se pudo enviar." })
  }

  /** Confirmados a los que todavía no les ha llegado el pase. */
  const sinCorreo = registros.filter((r) => r.estado === "confirmed" && !r.correo_enviado_at).length

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Gala MG</h1>
          <div className="sub">
            {fechaLarga()} · {GALA_HORARIO} · aforo {GALA_CUPO}.
            {puedeAcreditar && !puedeAdmitir
              ? " Puedes marcar ingresos y anotar; a quién se admite lo decide la coordinación."
              : " Nadie queda confirmado solo: el pase QR se emite al confirmar y se envía por correo."}
          </div>
        </div>
        <div className="spacer" />
        <a className="btn" href="/gala" target="_blank" rel="noopener noreferrer">Ver landing ↗</a>
      </div>

      <div className="kpis">
        <Kpi valor={`${confirmados}/${GALA_CUPO}`} label="Confirmados" ayuda="Con pase emitido" />
        <Kpi valor={pendientes} label="Por revisar" ayuda="Ocupan silla mientras se deciden" />
        <Kpi valor={conteo("waitlist")} label="Lista de espera" />
        <Kpi valor={conteo("rejected")} label="No admitidos" />
        <Kpi valor={entraron} label="Ya entraron" ayuda="Acreditados en la puerta" />
      </div>

      <div className="card">
        <h2>Aforo</h2>
        <div className="gala-aforo">
          <div className="bar" role="img"
            aria-label={`${confirmados} confirmados y ${pendientes} por revisar de ${GALA_CUPO} lugares`}>
            <i className="conf" style={{ width: `${Math.min(100, (confirmados / GALA_CUPO) * 100)}%` }} />
            <i className="pend" style={{ width: `${Math.min(100 - (confirmados / GALA_CUPO) * 100, (pendientes / GALA_CUPO) * 100)}%` }} />
          </div>
          <span className="small mono">{ocupados} / {GALA_CUPO}</span>
        </div>
        <p className="small muted" style={{ marginBottom: 0 }}>
          Verde: confirmados. Ámbar: por revisar — todavía ocupan silla. Quien llega
          después de los {GALA_CUPO} entra en lista de espera automáticamente; subirlo
          de ahí es una decisión de ustedes, la base no lo impide.
        </p>
      </div>

      {puedeAdmitir ? (
        <div className="card">
          <h2>Correos del pase</h2>
          <p className="small muted">
            Confirmar emite el pase; esto lo entrega. Se envía solo a quien está
            confirmado y todavía no lo ha recibido, así que apretar dos veces no
            duplica correos.
          </p>
          <div className="acciones" style={{ marginTop: 10 }}>
            <button className="btn primary" onClick={enviarTodos}
              disabled={enviando !== null || sinCorreo === 0}>
              {enviando === "todos"
                ? "Enviando…"
                : sinCorreo === 0
                  ? "Todos los pases enviados"
                  : `Enviar ${sinCorreo} ${sinCorreo === 1 ? "pase pendiente" : "pases pendientes"}`}
            </button>
          </div>
          {aviso ? (
            <p className={aviso.ok ? "small" : "small"} role="status"
              style={{ marginTop: 10, color: aviso.ok ? "var(--good)" : "var(--bad)" }}>
              {aviso.msg}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="card" style={{ padding: "10px 14px" }}>
        <div className="frow" style={{ margin: 0 }}>
          <div className="seg" role="group" aria-label="Filtrar por estado">
            {FILTROS.map((f) => (
              <button key={f.valor} type="button"
                className={filtro === f.valor ? "on" : undefined}
                onClick={() => setFiltro(f.valor)}>
                {f.label}
                {f.valor !== "todos" ? ` ${conteo(f.valor)}` : ` ${registros.length}`}
              </button>
            ))}
          </div>
          <select value={tipo} onChange={(e) => setTipo(e.target.value)} aria-label="Filtrar por tipo de asistente">
            <option value="todos">Todo tipo de asistente</option>
            {TIPOS_ASISTENTE.map((t) => <option key={t.valor} value={t.valor}>{t.label}</option>)}
          </select>
          <input placeholder="Buscar nombre, correo, celular o código…" value={busca}
            onChange={(e) => setBusca(e.target.value)} style={{ flex: 1, minWidth: 180 }}
            aria-label="Buscar registro" />
          <label className="small" style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
            <input type="checkbox" checked={soloSinEntrar}
              onChange={(e) => setSoloSinEntrar(e.target.checked)} />
            Sin entrar
          </label>
          <span className="small muted">{lista.length} resultados</span>
        </div>
      </div>

      <div className="card">
        <h2>Registros</h2>
        {lista.length === 0 ? (
          <Vacio titulo="Nada por aquí todavía">
            Los registros aparecen en cuanto alguien envía el formulario de /gala.
          </Vacio>
        ) : (
          <div className="gala-lista">
            {lista.map((r) => {
              const wa = whatsapp(r.celular)
              const url = urlPase(r)
              return (
                <div key={r.id} className={r.ingreso_at ? "gala-fila entro" : "gala-fila"}
                  style={{ "--c": colorEstado(r.estado) } as React.CSSProperties}>
                  <div className="quien">
                    <span className="dato">
                      <b>{r.nombre_artistico || r.nombre_completo}</b>
                      <Copiar valor={r.nombre_completo} etiqueta="el nombre completo" />
                    </span>
                    <div className="meta">
                      <Tag suave color={colorEstado(r.estado)}>{etiquetaEstado(r.estado)}</Tag>
                      <span>{etiquetaTipo(r.tipo_asistente)}</span>
                      <span className="mono">{r.rango_edad}</span>
                      {r.nombre_artistico ? <span className="muted">{r.nombre_completo}</span> : null}
                      <span className="dato">
                        <span className="mono">{r.celular}</span>
                        <Copiar valor={r.celular} etiqueta="el celular" />
                        {wa ? (
                          <a href={`https://wa.me/${wa}?text=${encodeURIComponent(mensajeWhatsApp(r, url))}`}
                            target="_blank" rel="noopener noreferrer"
                            aria-label={`Escribirle por WhatsApp a ${r.nombre_completo}`}>WA ↗</a>
                        ) : null}
                      </span>
                      {r.instagram ? (
                        <a href={`https://instagram.com/${r.instagram}`} target="_blank" rel="noopener noreferrer">
                          @{r.instagram}
                        </a>
                      ) : null}
                      <span className="muted mono">{fmt(r.created_at.slice(0, 10))}</span>
                      {r.estado === "confirmed" ? (
                        <span className={r.correo_enviado_at ? "muted" : undefined}
                          style={r.correo_enviado_at ? undefined : { color: "var(--warn, #eda100)" }}>
                          {r.correo_enviado_at ? "✉ pase enviado" : "✉ sin enviar"}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="acciones-fila">
                    {r.codigo ? (
                      <span className="dato">
                        <span className="gala-pase mono">{r.codigo}</span>
                        <Copiar valor={url ?? r.codigo} etiqueta="el enlace del pase" />
                      </span>
                    ) : null}

                    {puedeAdmitir ? (
                      <select value={r.estado} onChange={(e) => cambiarEstado(r, e.target.value)}
                        aria-label={`Estado de ${r.nombre_completo}`}>
                        {ESTADOS_GALA.map((e) => <option key={e.valor} value={e.valor}>{e.label}</option>)}
                      </select>
                    ) : null}

                    {r.estado === "confirmed" && puedeAcreditar ? (
                      <button className={r.ingreso_at ? "btn sm" : "btn sm brand"}
                        onClick={() => alternarIngreso(r)}>
                        {r.ingreso_at ? "Deshacer ingreso" : "Marcar ingreso"}
                      </button>
                    ) : null}

                    {puedeAdmitir && r.estado === "confirmed" ? (
                      <button className="btn sm" onClick={() => enviarUno(r)}
                        disabled={enviando !== null}
                        title={r.correo_enviado_at
                          ? `Reenviar el pase a ${r.email}`
                          : `Enviar el pase a ${r.email}`}>
                        {enviando === r.id ? "Enviando…" : r.correo_enviado_at ? "Reenviar" : "Enviar pase"}
                      </button>
                    ) : null}

                    <a className="btn sm ghost" href={enlaceCorreo(r, url)}
                      title={`Escribirle a mano a ${r.email}`}>Correo ↗</a>

                    <button className="btn sm ghost" onClick={() => setDetalle(r)}>Ficha</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="card">
        <h2>Sobre estos datos</h2>
        <p className="small muted" style={{ marginBottom: 0 }}>
          Nombre, correo y celular de gente que no es del equipo, recogidos con
          autorización (Ley 1581 de 2012). Los lee quien ve esta sección y nadie más — ni
          siquiera con sesión en el panel. No los saques de aquí sin necesidad.
        </p>
      </div>

      {detalle ? (
        <Ficha
          registro={detalle}
          url={urlPase(detalle)}
          puedeAnotar={puedeAcreditar}
          onClose={() => setDetalle(null)}
        />
      ) : null}
    </>
  )
}

/* ============================================================
   Ficha
   ============================================================ */

function Ficha({
  registro, url, puedeAnotar, onClose,
}: {
  registro: RegistroGala
  url: string | null
  puedeAnotar: boolean
  onClose: () => void
}) {
  const [notas, setNotas] = useState(registro.notas ?? "")
  const [estado, setEstado] = useState<"idle" | "guardando" | "listo" | "error">("idle")
  const [, arrancar] = useTransition()
  const wa = whatsapp(registro.celular)

  const guardar = () =>
    arrancar(async () => {
      setEstado("guardando")
      const res = await actualizarRegistroGala(registro.id, { notas })
      setEstado(res.ok ? "listo" : "error")
    })

  const filas: [string, React.ReactNode][] = [
    ["Nombre", registro.nombre_completo],
    ["Nombre artístico", registro.nombre_artistico || "—"],
    ["Correo", <span key="mail" className="dato"><span className="mono">{registro.email}</span><Copiar valor={registro.email} etiqueta="el correo" /></span>],
    ["Celular", <span key="cel" className="dato"><span className="mono">{registro.celular}</span><Copiar valor={registro.celular} etiqueta="el celular" /></span>],
    ["Tipo", etiquetaTipo(registro.tipo_asistente)],
    ["Edad", registro.rango_edad],
    ["Instagram", registro.instagram ? `@${registro.instagram}` : "—"],
    ["TikTok", registro.tiktok ? `@${registro.tiktok}` : "—"],
    ["Estado", <Tag key="est" suave color={colorEstado(registro.estado)}>{etiquetaEstado(registro.estado)}</Tag>],
    ["Registrado", fmt(registro.created_at.slice(0, 10))],
    ["Confirmado", registro.confirmado_at ? fmt(registro.confirmado_at.slice(0, 10)) : "—"],
    ["Ingreso", registro.ingreso_at ? new Date(registro.ingreso_at).toLocaleString("es-CO") : "Todavía no llega"],
  ]

  return (
    <Modal titulo={registro.nombre_artistico || registro.nombre_completo} onClose={onClose}
      pie={
        <>
          <a className="btn primary" href={enlaceCorreo(registro, url)}>
            Enviar por correo ↗
          </a>
          {wa ? (
            <a className="btn" href={`https://wa.me/${wa}?text=${encodeURIComponent(mensajeWhatsApp(registro, url))}`}
              target="_blank" rel="noopener noreferrer">
              WhatsApp ↗
            </a>
          ) : null}
          {url ? (
            <a className="btn" href={url} target="_blank" rel="noopener noreferrer">Ver pase ↗</a>
          ) : null}
          <button className="btn ghost" onClick={onClose}>Cerrar</button>
        </>
      }
    >
      <dl className="tab-ficha" style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 14px", fontSize: 13 }}>
        {filas.map(([k, v]) => (
          <div key={k} style={{ display: "contents" }}>
            <dt className="muted small">{k}</dt>
            <dd style={{ minWidth: 0 }}>{v}</dd>
          </div>
        ))}
      </dl>

      {registro.codigo ? (
        <p className="small" style={{ marginTop: 14 }}>
          Pase <span className="gala-pase mono">{registro.codigo}</span> — el QR lo emitió la
          base al confirmar. Se envía por correo con el botón de abajo.
        </p>
      ) : (
        <p className="small muted" style={{ marginTop: 14 }}>
          Sin pase todavía: el QR se genera solo cuando el estado pasa a Confirmado.
        </p>
      )}

      <h3>Notas internas</h3>
      <textarea
        value={notas}
        onChange={(e) => { setNotas(e.target.value); setEstado("idle") }}
        disabled={!puedeAnotar}
        rows={3}
        placeholder="Quién lo trae, qué acordaron, por qué entra…"
        style={{ width: "100%" }}
      />
      {puedeAnotar ? (
        <div className="acciones" style={{ marginTop: 8 }}>
          <button className="btn sm" onClick={guardar} disabled={estado === "guardando"}>
            {estado === "guardando" ? "Guardando…" : "Guardar nota"}
          </button>
          {estado === "listo" ? <span className="small muted">Guardado</span> : null}
          {estado === "error" ? <span className="small" style={{ color: "var(--critical)" }}>No se pudo guardar</span> : null}
        </div>
      ) : null}
    </Modal>
  )
}
