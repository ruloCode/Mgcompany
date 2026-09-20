"use client"

import { Fragment, useEffect, useMemo, useRef, useState, useTransition } from "react"
import { fmt } from "@/lib/mg/fechas"
import type { InscripcionMG1 } from "@/lib/mg/datos"
import { actualizarInscripcion } from "@/app/admin/acciones"
import { whatsapp } from "@/lib/mg/telefono"
import {
  BLOQUES_MG1,
  FRANJAS,
  FRANJA_DIA,
  diasDe,
  etiquetaDia,
  etiquetaDiaLarga,
  franjasDe,
  puedeEse,
  resumenTexto,
  type BloqueMG1,
  type Disponibilidad,
  type Franja,
} from "@/lib/mg1-disponibilidad"
import {
  JURADOS,
  MG1_TOPE_JURADO,
  nombreDeJurado,
} from "@/lib/mg1-seleccion"
import type { MesaJurado } from "@/lib/mg/datos"
import { Copiar, Kpi, Modal, Tag, Vacio } from "./ui"

const ESTADOS: Record<string, { label: string; color: string }> = {
  nuevo:            { label: "Nuevo",           color: "var(--c-sesion)" },
  preseleccionado:  { label: "Preseleccionado", color: "var(--warning)" },
  seleccionado:     { label: "Seleccionado",    color: "var(--good)" },
  descartado:       { label: "Descartado",      color: "var(--muted)" },
}

/** Columnas de la tabla: lo usa el colSpan de la fila desplegable. */
const COLUMNAS = 9

/** Lo que se marca cuando se activa un día completo en un bloque con franjas. */
const TODAS_LAS_FRANJAS = FRANJAS.map((f) => f.valor)

type Aviso = { txt: string; error?: boolean }

export default function VistaMg1({
  inscripciones, mesa, puedeCurar, puedeContactar,
}: {
  inscripciones: InscripcionMG1[]
  /** Lo que lleva votado el jurado en /mg1/seleccion. Solo se lee aqui. */
  mesa: MesaJurado
  /** Decidir: mover el estado de una inscripción. Es de quien opera. */
  puedeCurar: boolean
  /** Acompañar: anotar disponibilidad y notas. Puede venir de una concesión
   *  individual, sin que eso dé voto en la curaduría. */
  puedeContactar: boolean
}) {
  const [filtro, setFiltro] = useState("todos")
  const [filtroDispo, setFiltroDispo] = useState("todos")
  const [busca, setBusca] = useState("")
  const [detalle, setDetalle] = useState<InscripcionMG1 | null>(null)
  const [abierta, setAbierta] = useState<string | null>(null)
  const [, arrancar] = useTransition()

  // Copia local de lo que se está marcando. Sin esto cada clic esperaría al
  // servidor para pintarse, y marcar ocho días se sentiría como un formulario.
  const [locales, setLocales] = useState<Record<string, Disponibilidad>>({})
  const [avisos, setAvisos] = useState<Record<string, Aviso>>({})
  const relojes = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  useEffect(() => {
    const pendientes = relojes.current
    return () => Object.values(pendientes).forEach(clearTimeout)
  }, [])

  const dispoDe = useMemo(() => {
    return (i: InscripcionMG1): Disponibilidad => locales[i.id] ?? i.disponibilidad ?? {}
  }, [locales])

  /** Guarda al soltar, no en cada clic: marcar tres franjas seguidas es una
   *  sola escritura y una sola línea de bitácora, no seis. */
  const programarGuardado = (id: string, dispo: Disponibilidad) => {
    clearTimeout(relojes.current[id])
    setAvisos((a) => ({ ...a, [id]: { txt: "Guardando…" } }))
    relojes.current[id] = setTimeout(() => {
      arrancar(async () => {
        const res = await actualizarInscripcion(id, { disponibilidad: dispo })
        if (!res.ok) {
          // Se suelta la copia local para que la tabla vuelva a lo que hay en
          // la base. Dejar pintado lo que no se guardo es peor que no pintarlo:
          // el equipo seguiria adelante creyendo que quedo anotado.
          setLocales((p) => {
            const { [id]: _descartado, ...resto } = p
            return resto
          })
        }
        setAvisos((a) => ({
          ...a,
          [id]: res.ok ? { txt: "Guardado" } : { txt: res.error ?? "No se pudo guardar", error: true },
        }))
      })
    }, 700)
  }

  const aplicar = (i: InscripcionMG1, fecha: string, franjas: Franja[]) => {
    const dispo: Disponibilidad = { ...dispoDe(i) }
    if (franjas.length) dispo[fecha] = franjas
    else delete dispo[fecha]
    setLocales((p) => ({ ...p, [i.id]: dispo }))
    programarGuardado(i.id, dispo)
  }

  const alternarFranja = (i: InscripcionMG1, fecha: string, franja: Franja) => {
    const previas = franjasDe(dispoDe(i), fecha)
    aplicar(i, fecha, previas.includes(franja) ? previas.filter((f) => f !== franja) : [...previas, franja])
  }

  /** El encabezado del día marca o limpia la fecha entera. */
  const alternarDia = (i: InscripcionMG1, fecha: string, bloque: BloqueMG1) => {
    const previas = franjasDe(dispoDe(i), fecha)
    if (previas.length) aplicar(i, fecha, [])
    else aplicar(i, fecha, bloque.franjas ? [...TODAS_LAS_FRANJAS] : [FRANJA_DIA])
  }

  const lista = useMemo(() => {
    let l = inscripciones
    if (filtro !== "todos") l = l.filter((i) => i.estado === filtro)
    if (filtroDispo === "sin_preguntar") {
      l = l.filter((i) => !i.disponibilidad_actualizada)
    } else if (filtroDispo !== "todos") {
      const bloque = BLOQUES_MG1.find((b) => b.clave === filtroDispo)
      if (bloque) l = l.filter((i) => diasDe(dispoDe(i), bloque) > 0)
    }
    if (busca) {
      const q = busca.toLowerCase()
      l = l.filter((i) =>
        `${i.nombre_artistico} ${i.nombre_completo} ${i.ciudad} ${i.email} ${i.celular}`.toLowerCase().includes(q))
    }
    return l
  }, [inscripciones, filtro, filtroDispo, busca, dispoDe])

  // Cuántas personas pueden cada fecha, sobre lo que se está viendo. Es el
  // número con el que se va a negociar la agenda del estudio.
  const resumen = useMemo(() => {
    const dispos = lista.map((i) => locales[i.id] ?? i.disponibilidad ?? {})
    return BLOQUES_MG1.map((b) => ({
      bloque: b,
      fechas: b.fechas.map((f) => ({
        fecha: f,
        total: dispos.filter((d) => puedeEse(d, f)).length,
        porFranja: FRANJAS.map((fr) => dispos.filter((d) => franjasDe(d, f).includes(fr.valor)).length),
      })),
    }))
  }, [lista, locales])

  const conteo = (e: string) => inscripciones.filter((i) => i.estado === e).length
  const sinPreguntar = inscripciones.filter((i) => !i.disponibilidad_actualizada).length

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Convocatoria MG1</h1>
          <div className="sub">
            Inscripciones que llegan del formulario público de /mg1/convocatoria.
            {puedeContactar && !puedeCurar
              ? " Puedes anotar disponibilidad y notas; el estado lo decide la curaduría."
              : null}
          </div>
        </div>
        <div className="spacer" />
        <a className="btn" href="/mg1/convocatoria" target="_blank" rel="noopener noreferrer">Ver landing ↗</a>
      </div>

      <div className="kpis">
        <Kpi valor={inscripciones.length} label="Inscripciones totales" />
        <Kpi valor={conteo("nuevo")} label="Sin revisar" />
        <Kpi valor={conteo("preseleccionado")} label="Preseleccionados" />
        <Kpi valor={conteo("seleccionado")} label="Seleccionados" />
        <Kpi valor={sinPreguntar} label="Sin preguntar disponibilidad" ayuda="Nadie les ha escrito todavía" />
      </div>

      <div className="card" style={{ padding: "10px 14px" }}>
        <div className="frow" style={{ margin: 0 }}>
          <select value={filtro} onChange={(e) => setFiltro(e.target.value)} aria-label="Filtrar por estado">
            <option value="todos">Todos los estados</option>
            {Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={filtroDispo} onChange={(e) => setFiltroDispo(e.target.value)}
            aria-label="Filtrar por disponibilidad">
            <option value="todos">Toda disponibilidad</option>
            <option value="sin_preguntar">Sin preguntar</option>
            {BLOQUES_MG1.map((b) => <option key={b.clave} value={b.clave}>Disponible: {b.corto}</option>)}
          </select>
          <input placeholder="Buscar nombre, ciudad, correo o celular…" value={busca}
            onChange={(e) => setBusca(e.target.value)} style={{ flex: 1, minWidth: 180 }}
            aria-label="Buscar inscripción" />
          <span className="small muted">{lista.length} resultados</span>
        </div>
      </div>

      <div className="card">
        <h2>Inscripciones</h2>
        {lista.length === 0 ? (
          <Vacio titulo="Nada por aquí todavía">
            Las inscripciones aparecen en cuanto alguien envía el formulario de la convocatoria.
          </Vacio>
        ) : (
          <div className="tabla-wrap">
            <table>
              <thead>
                <tr>
                  <th>Recibida</th>
                  <th>Nombre artístico</th>
                  <th>Nombre completo</th>
                  <th>Celular</th>
                  <th>Ciudad</th>
                  <th>Música</th>
                  <th>Disponibilidad</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {lista.map((i) => {
                  const dispo = dispoDe(i)
                  const wa = whatsapp(i.celular)
                  const desplegada = abierta === i.id
                  return (
                    <Fragment key={i.id}>
                      <tr>
                        <td className="mono small" style={{ whiteSpace: "nowrap" }}>{fmt(i.created_at.slice(0, 10))}</td>
                        <td>
                          <span className="dato">
                            <b>{i.nombre_artistico}</b>
                            <Copiar valor={i.nombre_artistico} etiqueta="el nombre artístico" />
                          </span>
                        </td>
                        <td className="small">
                          <span className="dato">
                            {i.nombre_completo}
                            <Copiar valor={i.nombre_completo} etiqueta="el nombre completo" />
                          </span>
                        </td>
                        <td className="small">
                          <span className="dato">
                            <span className="mono">{i.celular}</span>
                            <Copiar valor={i.celular} etiqueta="el celular" />
                            {wa ? (
                              <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer"
                                title={`Abrir WhatsApp con ${i.nombre_artistico}`}
                                aria-label={`Abrir WhatsApp con ${i.nombre_artistico}`}>WA ↗</a>
                            ) : null}
                          </span>
                        </td>
                        <td className="small">{i.ciudad}</td>
                        <td className="small" style={{ whiteSpace: "nowrap" }}>
                          {i.link_musica ? (
                            <a href={i.link_musica} target="_blank" rel="noopener noreferrer">Escuchar ↗</a>
                          ) : "—"}
                        </td>
                        <td>
                          <button type="button" className="dispo-celda" aria-expanded={desplegada}
                            onClick={() => setAbierta(desplegada ? null : i.id)}
                            aria-label={`Disponibilidad de ${i.nombre_artistico}`}>
                            {i.disponibilidad_actualizada ? (
                              BLOQUES_MG1.map((b) => {
                                const n = diasDe(dispo, b)
                                return (
                                  <span key={b.clave} className={n ? "dispo-mini on" : "dispo-mini"}
                                    style={n ? { background: b.color, borderColor: b.color } : undefined}
                                    title={`${b.titulo}: ${n} de ${b.fechas.length} fechas`}>
                                    {b.abrev}{b.fechas.length > 1 && n ? ` ${n}` : ""}
                                  </span>
                                )
                              })
                            ) : (
                              <span className="chipbtn">sin preguntar</span>
                            )}
                          </button>
                        </td>
                        <td>
                          {puedeCurar ? (
                            <select
                              value={i.estado}
                              onChange={(e) => arrancar(async () => { await actualizarInscripcion(i.id, { estado: e.target.value }) })}
                              aria-label={`Estado de ${i.nombre_artistico}`}
                            >
                              {Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                            </select>
                          ) : (
                            <Tag color={ESTADOS[i.estado]?.color}>{ESTADOS[i.estado]?.label ?? i.estado}</Tag>
                          )}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button className="btn sm" onClick={() => setDetalle(i)}>Ver ficha</button>
                        </td>
                      </tr>

                      {desplegada ? (
                        <tr>
                          <td colSpan={COLUMNAS} style={{ background: "var(--page)" }}>
                            <EditorDisponibilidad
                              inscripcion={i}
                              dispo={dispo}
                              puedeEditar={puedeContactar}
                              aviso={avisos[i.id]}
                              onFranja={(fecha, franja) => alternarFranja(i, fecha, franja)}
                              onDia={(fecha, bloque) => alternarDia(i, fecha, bloque)}
                            />
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <MesaDelJurado mesa={mesa} inscripciones={inscripciones} />

      <ResumenFechas resumen={resumen} total={lista.length} />

      <div className="card">
        <h2>Sobre estos datos</h2>
        <p className="small muted" style={{ marginBottom: 0 }}>
          Son datos personales recogidos con autorización (Ley 1581 de 2012). La tabla es un buzón de solo
          escritura para el público: nadie que no tenga sesión en este panel puede listarlos. Trátalos como lo
          que son y no los saques de aquí sin necesidad.
        </p>
      </div>

      {detalle ? <Ficha inscripcion={detalle} dispo={dispoDe(detalle)} puedeEditar={puedeContactar} onClose={() => setDetalle(null)} /> : null}
    </>
  )
}

/* ============================================================
   Disponibilidad
   ============================================================ */

function EditorDisponibilidad({
  inscripcion, dispo, puedeEditar, aviso, onFranja, onDia,
}: {
  inscripcion: InscripcionMG1
  dispo: Disponibilidad
  puedeEditar: boolean
  aviso?: Aviso
  onFranja: (fecha: string, franja: Franja) => void
  onDia: (fecha: string, bloque: BloqueMG1) => void
}) {
  return (
    <div className="dispo-editor">
      <div className="dispo-cabeza">
        <b>Disponibilidad de {inscripcion.nombre_artistico}</b>
        <div className="spacer" />
        {aviso ? (
          <span className="small" style={{ color: aviso.error ? "var(--critical)" : "var(--muted)" }} role="status">
            {aviso.txt}
          </span>
        ) : inscripcion.disponibilidad_actualizada ? (
          <span className="small muted">
            Anotada el {fmt(inscripcion.disponibilidad_actualizada.slice(0, 10))}
          </span>
        ) : (
          <span className="small muted">Todavía no se le ha preguntado</span>
        )}
        <Copiar valor={resumenTexto(dispo)} etiqueta="el resumen de disponibilidad" />
      </div>

      {BLOQUES_MG1.map((b) => (
        <div className="dispo-bloque" key={b.clave}>
          <h4><i style={{ background: b.color }} aria-hidden />{b.titulo}</h4>
          <p className="small muted">{b.descripcion}</p>
          <div className="dispo-dias">
            {b.fechas.map((f) => {
              const franjas = franjasDe(dispo, f)
              const activo = franjas.length > 0
              return (
                <div className={activo ? "dispo-dia on" : "dispo-dia"} key={f}>
                  <button type="button" className="fecha" disabled={!puedeEditar} aria-pressed={activo}
                    onClick={() => onDia(f, b)}
                    aria-label={`${activo ? "Quitar" : "Marcar"} ${etiquetaDiaLarga(f)}`}>
                    {etiquetaDia(f)}
                  </button>
                  {b.franjas ? (
                    <div className="dispo-franjas">
                      {FRANJAS.map((fr) => (
                        <button key={fr.valor} type="button" disabled={!puedeEditar}
                          aria-pressed={franjas.includes(fr.valor)}
                          aria-label={`${fr.label} del ${etiquetaDiaLarga(f)}`}
                          title={`${fr.label} · ${fr.horas}`}
                          onClick={() => onFranja(f, fr.valor)}>
                          {fr.corto}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function ResumenFechas({
  resumen, total,
}: {
  resumen: { bloque: BloqueMG1; fechas: { fecha: string; total: number; porFranja: number[] }[] }[]
  total: number
}) {
  return (
    <div className="card">
      <h2>Disponibilidad por fecha</h2>
      <p className="small muted">
        Cuántas de las {total} personas que estás viendo pueden cada día. Cambia con los filtros de arriba:
        para cuadrar con el estudio, filtra primero por preseleccionados.
      </p>
      <div className="dispo-resumen-cols">
        {resumen.map(({ bloque, fechas }) => (
          <div key={bloque.clave}>
            <h4 className="dispo-titulo"><i style={{ background: bloque.color }} aria-hidden />{bloque.titulo}</h4>
            <div className="tabla-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Personas</th>
                    {bloque.franjas ? FRANJAS.map((f) => <th key={f.valor}>{f.label}</th>) : null}
                  </tr>
                </thead>
                <tbody>
                  {fechas.map((f) => (
                    <tr key={f.fecha}>
                      <td className="small" style={{ whiteSpace: "nowrap" }}>{etiquetaDiaLarga(f.fecha)}</td>
                      <td className="mono"><b>{f.total}</b></td>
                      {bloque.franjas
                        ? f.porFranja.map((n, k) => <td key={k} className="mono small">{n}</td>)
                        : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ============================================================
   Ficha
   ============================================================ */

function Ficha({
  inscripcion, dispo, puedeEditar, onClose,
}: {
  inscripcion: InscripcionMG1
  dispo: Disponibilidad
  puedeEditar: boolean
  onClose: () => void
}) {
  const [notas, setNotas] = useState(inscripcion.notas ?? "")
  const [pendiente, arrancar] = useTransition()
  const wa = whatsapp(inscripcion.celular)

  return (
    <Modal
      titulo={inscripcion.nombre_artistico}
      ancho="min(600px, 94vw)"
      onClose={onClose}
      pie={
        puedeEditar ? (
          <>
            <button className="btn" onClick={onClose}>Cerrar</button>
            <button className="btn primary" disabled={pendiente}
              onClick={() => arrancar(async () => { await actualizarInscripcion(inscripcion.id, { notas }); onClose() })}>
              {pendiente ? "Guardando…" : "Guardar notas"}
            </button>
          </>
        ) : <button className="btn primary" onClick={onClose}>Cerrar</button>
      }
    >
      <div className="tabla-wrap">
        <table>
          <tbody>
            <tr>
              <th style={{ width: 150 }}>Nombre artístico</th>
              <td><span className="dato">{inscripcion.nombre_artistico}<Copiar valor={inscripcion.nombre_artistico} etiqueta="el nombre artístico" /></span></td>
            </tr>
            <tr>
              <th>Nombre completo</th>
              <td><span className="dato">{inscripcion.nombre_completo}<Copiar valor={inscripcion.nombre_completo} etiqueta="el nombre completo" /></span></td>
            </tr>
            <tr><th>Correo</th><td><a href={`mailto:${inscripcion.email}`}>{inscripcion.email}</a></td></tr>
            <tr>
              <th>Celular</th>
              <td>
                <span className="dato">
                  <span className="mono">{inscripcion.celular}</span>
                  <Copiar valor={inscripcion.celular} etiqueta="el celular" />
                  {wa ? <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer">WhatsApp ↗</a> : null}
                </span>
              </td>
            </tr>
            <tr><th>Ciudad</th><td>{inscripcion.ciudad}</td></tr>
            <tr>
              <th>Música</th>
              <td>
                {inscripcion.link_musica
                  ? <a href={inscripcion.link_musica} target="_blank" rel="noopener noreferrer">{inscripcion.link_musica}</a>
                  : "—"}
              </td>
            </tr>
            <tr><th>Edición</th><td className="mono small">{inscripcion.edicion}</td></tr>
            <tr><th>Recibida</th><td className="mono small">{fmt(inscripcion.created_at.slice(0, 10))}</td></tr>
          </tbody>
        </table>
      </div>

      <h3>Disponibilidad</h3>
      <p className="small" style={{ marginBottom: 4 }}>{resumenTexto(dispo)}</p>
      <p className="small muted">
        {inscripcion.disponibilidad_actualizada
          ? `Anotada el ${fmt(inscripcion.disponibilidad_actualizada.slice(0, 10))}. Se edita desde la columna Disponibilidad de la tabla.`
          : "Todavía no se le ha preguntado. Se anota desde la columna Disponibilidad de la tabla."}
      </p>

      {inscripcion.por_que ? (
        <>
          <h3>Por qué quiere entrar</h3>
          <p className="small" style={{ whiteSpace: "pre-wrap" }}>{inscripcion.por_que}</p>
        </>
      ) : null}

      <h3>Notas de curaduría</h3>
      <textarea rows={3} value={notas} disabled={!puedeEditar} style={{ width: "100%" }}
        placeholder="Lo que el jurado debe saber" onChange={(e) => setNotas(e.target.value)} />
    </Modal>
  )
}

/* ============================================================
   Mesa del jurado
   ============================================================
   El consolidado que los jurados NO ven entre si: quien marco a quien. Aqui
   es donde se decide, porque aqui se ve el cruce. Esta pantalla solo LEE: los
   votos se ponen desde el enlace privado de cada jurado, no desde el panel.
*/

function MesaDelJurado({
  mesa, inscripciones,
}: {
  mesa: MesaJurado
  inscripciones: InscripcionMG1[]
}) {
  const [origen, setOrigen] = useState("")
  useEffect(() => setOrigen(window.location.origin), [])

  const porJurado = useMemo(() => {
    const m: Record<string, number> = {}
    for (const v of mesa.votos) m[v.jurado] = (m[v.jurado] ?? 0) + 1
    return m
  }, [mesa.votos])

  const filas = useMemo(() => {
    const votos: Record<string, string[]> = {}
    for (const v of mesa.votos) (votos[v.inscripcion_id] ??= []).push(v.jurado)

    const coment: Record<string, typeof mesa.comentarios> = {}
    for (const c of mesa.comentarios) (coment[c.inscripcion_id] ??= []).push(c)

    return inscripciones
      .filter((i) => i.estado === "preseleccionado" || votos[i.id] !== undefined)
      .map((i) => ({
        inscripcion: i,
        jurados: votos[i.id] ?? [],
        comentarios: coment[i.id] ?? [],
      }))
      // Primero el consenso. Con el mismo numero de votos, alfabetico: no
      // queremos que el orden de llegada pese en la decision.
      .sort((a, b) =>
        b.jurados.length - a.jurados.length ||
        a.inscripcion.nombre_artistico.localeCompare(b.inscripcion.nombre_artistico))
  }, [mesa, inscripciones])

  const votaron = Object.keys(porJurado).length
  const conVoto = filas.filter((f) => f.jurados.length > 0).length

  return (
    <div className="card">
      <h2>Mesa del jurado</h2>
      <p className="small muted">
        Lo que lleva marcado cada jurado desde su enlace privado. Entre ellos no se ven los votos
        —solo los comentarios—, para que el primero en votar no arrastre a los demás. Aquí sí está el
        cruce completo.
      </p>

      <div className="kpis" style={{ marginBottom: 14 }}>
        {JURADOS.map((j) => (
          <Kpi
            key={j.slug}
            valor={`${porJurado[j.slug] ?? 0}/${MG1_TOPE_JURADO}`}
            label={j.nombre}
            ayuda={`${porJurado[j.slug] ?? 0} fichas marcadas de ${MG1_TOPE_JURADO}`}
          />
        ))}
        <Kpi valor={conVoto} label="Con al menos un voto" />
      </div>

      <div className="frow">
        {JURADOS.map((j) => (
          <span className="dato small" key={j.slug}>
            <span className="mono">/mg1/seleccion/{j.slug}</span>
            <Copiar valor={`${origen}/mg1/seleccion/${j.slug}`} etiqueta={`el enlace de ${j.nombre}`} />
          </span>
        ))}
      </div>

      {votaron === 0 ? (
        <Vacio titulo="Nadie ha votado todavía">
          Pásale a cada jurado su enlace privado y aquí irá apareciendo lo que marque.
        </Vacio>
      ) : (
        <div className="tabla-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <th>Preseleccionado</th>
                <th style={{ width: 70 }}>Votos</th>
                <th>Quién lo marcó</th>
                <th>Lo que dijo el jurado</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f, k) => (
                <tr key={f.inscripcion.id}>
                  <td className="mono small">{String(k + 1).padStart(2, "0")}</td>
                  <td>
                    <b>{f.inscripcion.nombre_artistico}</b>
                    <div className="small muted">{f.inscripcion.ciudad}</div>
                  </td>
                  <td className="mono"><b>{f.jurados.length}</b></td>
                  <td className="small">
                    {f.jurados.length
                      ? f.jurados.map((j) => nombreDeJurado(j)).join(" · ")
                      : <span className="muted">—</span>}
                  </td>
                  <td className="small">
                    {f.comentarios.length ? (
                      <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none" }}>
                        {f.comentarios.map((c) => (
                          <li key={c.jurado} style={{ marginBottom: 4 }}>
                            <b>{nombreDeJurado(c.jurado)}:</b>{" "}
                            <span style={{ whiteSpace: "pre-wrap" }}>{c.texto}</span>
                          </li>
                        ))}
                      </ul>
                    ) : <span className="muted">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
