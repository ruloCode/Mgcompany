"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import {
  MG1_TOPE_JURADO,
  nombreDeJurado,
  plataformaDe,
  reproductorDe,
  type ComentarioJurado,
  type FichaJurado,
  type Jurado,
} from "@/lib/mg1-seleccion"

interface Props {
  jurado: Jurado
  fichas: FichaJurado[]
  votosIniciales: string[]
  comentariosIniciales: Record<string, ComentarioJurado[]>
  /** true = corriendo contra el archivo de desarrollo, no contra la base. */
  demo: boolean
}

type Estado = { txt: string; error?: boolean }

export default function TableroJurado({
  jurado, fichas, votosIniciales, comentariosIniciales, demo,
}: Props) {
  const [marcados, setMarcados] = useState<Set<string>>(() => new Set(votosIniciales))
  const [comentarios, setComentarios] = useState(comentariosIniciales)
  const [abierta, setAbierta] = useState<string | null>(null)
  const [busca, setBusca] = useState("")
  const [soloMias, setSoloMias] = useState(false)
  const [estados, setEstados] = useState<Record<string, Estado>>({})
  const [error, setError] = useState<string | null>(null)

  // La ficha que el jurado intento marcar teniendo ya sus 12. Abre el cuadro
  // de cambio y es a quien entra si decide sacar a alguien.
  const [pendiente, setPendiente] = useState<FichaJurado | null>(null)

  const relojes = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  useEffect(() => {
    const pendientes = relojes.current
    return () => Object.values(pendientes).forEach(clearTimeout)
  }, [])

  const restantes = MG1_TOPE_JURADO - marcados.size
  const completa = restantes <= 0

  const enviarVoto = useCallback(
    async (ficha: FichaJurado, marcar: boolean) => {
      // Optimista: la ficha se pinta al instante y se corrige si el servidor
      // dice que no. Esperar la red para pintar convierte elegir 12 canciones
      // en llenar un formulario.
      setMarcados((prev) => {
        const s = new Set(prev)
        if (marcar) s.add(ficha.id)
        else s.delete(ficha.id)
        return s
      })
      setError(null)

      try {
        const res = await fetch("/api/mg1/seleccion/voto", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jurado: jurado.slug, inscripcion_id: ficha.id, marcar }),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          // Se deshace lo pintado: dejar marcada una ficha que no se guardo
          // seria mentirle al jurado sobre su propia lista.
          setMarcados((prev) => {
            const s = new Set(prev)
            if (marcar) s.delete(ficha.id)
            else s.add(ficha.id)
            return s
          })
          // El tope lo puede cantar el servidor aunque el navegador creyera
          // tener sitio (dos pestañas abiertas): mismo cuadro, mismo remedio.
          if (data.tope) setPendiente(ficha)
          else setError(data.error ?? "No se pudo guardar. Revisa tu conexión.")
        }
      } catch {
        setMarcados((prev) => {
          const s = new Set(prev)
          if (marcar) s.delete(ficha.id)
          else s.add(ficha.id)
          return s
        })
        setError("No se pudo guardar. Revisa tu conexión.")
      }
    },
    [jurado.slug],
  )

  const alternar = useCallback(
    (ficha: FichaJurado) => {
      if (marcados.has(ficha.id)) {
        void enviarVoto(ficha, false)
        return
      }
      if (completa) {
        setPendiente(ficha)
        return
      }
      void enviarVoto(ficha, true)
    },
    [marcados, completa, enviarVoto],
  )

  /** Sacar a uno y meter al que esperaba, en ese orden. */
  const cambiar = useCallback(
    async (sale: FichaJurado, entra: FichaJurado) => {
      setPendiente(null)
      await enviarVoto(sale, false)
      await enviarVoto(entra, true)
    },
    [enviarVoto],
  )

  const guardarComentario = useCallback(
    (ficha: FichaJurado, texto: string) => {
      setComentarios((prev) => {
        const otros = (prev[ficha.id] ?? []).filter((c) => c.jurado !== jurado.slug)
        const limpio = texto.trim()
        return {
          ...prev,
          [ficha.id]: limpio
            ? [...otros, { jurado: jurado.slug, texto: limpio, actualizado: new Date().toISOString() }]
            : otros,
        }
      })

      clearTimeout(relojes.current[ficha.id])
      setEstados((e) => ({ ...e, [ficha.id]: { txt: "Guardando…" } }))
      // Se guarda al dejar de escribir, no en cada tecla: una opinion de tres
      // frases es una escritura, no sesenta.
      relojes.current[ficha.id] = setTimeout(async () => {
        try {
          const res = await fetch("/api/mg1/seleccion/comentario", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jurado: jurado.slug, inscripcion_id: ficha.id, texto }),
          })
          const data = await res.json().catch(() => ({}))
          setEstados((e) => ({
            ...e,
            [ficha.id]: res.ok ? { txt: "Guardado" } : { txt: data.error ?? "No se guardó", error: true },
          }))
        } catch {
          setEstados((e) => ({ ...e, [ficha.id]: { txt: "No se guardó", error: true } }))
        }
      }, 800)
    },
    [jurado.slug],
  )

  const lista = useMemo(() => {
    let l = fichas
    if (soloMias) l = l.filter((f) => marcados.has(f.id))
    const q = busca.trim().toLowerCase()
    if (q) l = l.filter((f) => `${f.nombre_artistico} ${f.ciudad}`.toLowerCase().includes(q))
    return l
  }, [fichas, soloMias, marcados, busca])

  const misFichas = useMemo(
    () => fichas.filter((f) => marcados.has(f.id)),
    [fichas, marcados],
  )

  return (
    <div className="min-h-svh bg-mg-black text-white">
      <Cabecera jurado={jurado} total={fichas.length} demo={demo} />

      {fichas.length === 0 ? <SinFichas /> : null}

      {fichas.length > 0 ? (
        <BarraCupo marcados={marcados.size} onVerMias={() => setSoloMias((v) => !v)} soloMias={soloMias} />
      ) : null}

      <section
        className="container mx-auto px-4 pb-24 md:px-6 lg:px-10"
        hidden={fichas.length === 0}
      >
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nombre o ciudad…"
            aria-label="Buscar participante"
            className="w-full flex-1 border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/35 focus:border-mg-red"
          />
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-white/40">
            {lista.length} de {fichas.length}
          </span>
        </div>

        {error ? (
          <div role="alert" className="mb-6 border border-mg-red/60 bg-mg-red/10 px-4 py-3 text-sm text-white">
            {error}
          </div>
        ) : null}

        {lista.length === 0 ? (
          <p className="border border-white/10 px-4 py-10 text-center text-sm text-white/50">
            {soloMias ? "Todavía no has elegido a nadie." : "Nadie coincide con esa búsqueda."}
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {lista.map((ficha, i) => (
              <Ficha
                key={ficha.id}
                ficha={ficha}
                indice={fichas.indexOf(ficha) + 1}
                orden={i}
                marcada={marcados.has(ficha.id)}
                completa={completa}
                abierta={abierta === ficha.id}
                onAbrir={() => setAbierta(abierta === ficha.id ? null : ficha.id)}
                onAlternar={() => alternar(ficha)}
                comentarios={comentarios[ficha.id] ?? []}
                yo={jurado.slug}
                estado={estados[ficha.id]}
                onComentar={(texto) => guardarComentario(ficha, texto)}
              />
            ))}
          </ul>
        )}
      </section>

      <AnimatePresence>
        {pendiente ? (
          <CuadroCambio
            entra={pendiente}
            mias={misFichas}
            onCerrar={() => setPendiente(null)}
            onCambiar={(sale) => void cambiar(sale, pendiente)}
          />
        ) : null}
      </AnimatePresence>
    </div>
  )
}

/* ============================================================
   Cabecera y barra de cupo
   ============================================================ */

/** La mesa existe pero no hay a quien votar. Pasa si la curaduria todavia no
 *  ha marcado a nadie como preseleccionado. Sin esto el jurado veria un
 *  buscador sobre el vacio y creeria que la pagina esta rota. */
function SinFichas() {
  return (
    <section className="container mx-auto px-4 pb-24 md:px-6 lg:px-10">
      <div className="border border-white/15 px-6 py-14 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-mg-red">
          Todavía no
        </p>
        <h2 className="mt-4 font-heading text-4xl uppercase leading-[0.9] text-white">
          Las fichas aún no están publicadas
        </h2>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-zinc-400">
          El crew está cerrando la preselección. En cuanto quede lista, este mismo enlace te muestra a
          todos los participantes; no tienes que hacer nada.
        </p>
      </div>
    </section>
  )
}

function Cabecera({ jurado, total, demo }: { jurado: Jurado; total: number; demo: boolean }) {
  return (
    <header className="border-t-8 border-mg-red">
      <div className="container mx-auto px-4 pb-8 pt-10 md:px-6 md:pb-10 md:pt-14 lg:px-10">
        <div className="mb-5 flex items-center gap-3">
          <span className="whitespace-nowrap font-mono text-[11px] font-medium uppercase tracking-[0.25em] text-mg-red">
            [ MG1 / Mesa del jurado ]
          </span>
          <span className="h-px flex-1 bg-mg-red/40" />
          <span className="hidden font-mono text-[11px] uppercase tracking-[0.25em] text-white/40 md:block">
            Confidencial
          </span>
        </div>

        <h1 className="font-heading uppercase leading-[0.85] tracking-tight text-white text-[clamp(2.75rem,10vw,7rem)]">
          Hola, {jurado.nombre}
        </h1>

        {total > 0 ? (
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-zinc-400 md:text-base">
            Estos son los <b className="text-white">{total} preseleccionados</b> de MG1. Escúchalos aquí
            mismo y deja marcados los <b className="text-mg-red">{MG1_TOPE_JURADO}</b> que quieres ver
            compitiendo. Puedes cambiar de opinión cuantas veces quieras: lo que dejes marcado al final
            es tu voto. Lo que escribas lo leen los otros jurados; a quién marcaste, no.
          </p>
        ) : (
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-zinc-400 md:text-base">
            Aquí vas a elegir a los <b className="text-mg-red">{MG1_TOPE_JURADO}</b> que competirán en
            MG1.
          </p>
        )}

        {demo ? (
          <p className="mt-5 inline-block border border-yellow-500/50 bg-yellow-500/10 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-yellow-300">
            Modo demo · fichas de prueba, no hay base de datos conectada
          </p>
        ) : null}
      </div>
    </header>
  )
}

function BarraCupo({
  marcados, soloMias, onVerMias,
}: {
  marcados: number
  soloMias: boolean
  onVerMias: () => void
}) {
  const completa = marcados >= MG1_TOPE_JURADO
  return (
    <div className="sticky top-0 z-30 border-y border-white/10 bg-mg-black/90 backdrop-blur-md">
      <div className="container mx-auto flex flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3 md:px-6 lg:px-10">
        <div className="flex items-baseline gap-2">
          <span
            className={`font-heading text-4xl leading-none transition-colors md:text-5xl ${
              completa ? "text-mg-red" : "text-white"
            }`}
          >
            {String(marcados).padStart(2, "0")}
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-white/40">
            / {MG1_TOPE_JURADO} elegidos
          </span>
        </div>

        {/* Doce casillas: se ve de un vistazo cuánto falta, sin leer un número. */}
        <div className="flex flex-1 items-center gap-1" aria-hidden>
          {Array.from({ length: MG1_TOPE_JURADO }, (_, k) => (
            <motion.span
              key={k}
              initial={false}
              animate={{
                backgroundColor: k < marcados ? "#E8200C" : "rgba(255,255,255,0.10)",
                scaleY: k < marcados ? 1 : 0.45,
              }}
              transition={{ type: "spring", stiffness: 380, damping: 26 }}
              className="h-3 flex-1 origin-center"
            />
          ))}
        </div>

        <button
          type="button"
          onClick={onVerMias}
          aria-pressed={soloMias}
          className={`border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors ${
            soloMias
              ? "border-mg-red bg-mg-red text-white"
              : "border-white/20 text-white/60 hover:border-white/50 hover:text-white"
          }`}
        >
          {soloMias ? "Ver todos" : "Ver mis elegidos"}
        </button>

        <span
          role="status"
          className={`font-mono text-[10px] uppercase tracking-[0.2em] ${
            completa ? "text-mg-red" : "text-white/40"
          }`}
        >
          {completa ? "Lista completa" : `Faltan ${MG1_TOPE_JURADO - marcados}`}
        </span>
      </div>
    </div>
  )
}

/* ============================================================
   Ficha
   ============================================================ */

function Ficha({
  ficha, indice, orden, marcada, completa, abierta, onAbrir, onAlternar, comentarios, yo, estado, onComentar,
}: {
  ficha: FichaJurado
  indice: number
  orden: number
  marcada: boolean
  completa: boolean
  abierta: boolean
  onAbrir: () => void
  onAlternar: () => void
  comentarios: ComentarioJurado[]
  yo: string
  estado?: Estado
  onComentar: (texto: string) => void
}) {
  const mio = comentarios.find((c) => c.jurado === yo)
  const otros = comentarios.filter((c) => c.jurado !== yo)

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(orden * 0.03, 0.3), ease: [0.16, 1, 0.3, 1] }}
      className={`relative border transition-colors duration-300 ${
        marcada ? "border-mg-red bg-mg-red/[0.07]" : "border-white/10 bg-white/[0.02] hover:border-white/25"
      }`}
    >
      <div className="flex items-start gap-4 p-5">
        <span className="mt-1 font-mono text-[10px] tracking-[0.25em] text-white/30">
          {String(indice).padStart(2, "0")}
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-3xl uppercase leading-[0.9] text-white md:text-4xl">
            {ficha.nombre_artistico}
          </h2>
          <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-white/45">
            {ficha.ciudad}
          </p>
        </div>

        <BotonElegir marcada={marcada} completa={completa} nombre={ficha.nombre_artistico} onClick={onAlternar} />
      </div>

      <div className="px-5 pb-5">
        <Reproductor link={ficha.link_musica} nombre={ficha.nombre_artistico} />
      </div>

      {ficha.por_que ? (
        <blockquote className="mx-5 mb-5 border-l-2 border-white/15 pl-4 text-sm leading-relaxed text-zinc-400">
          {ficha.por_que}
        </blockquote>
      ) : null}

      <button
        type="button"
        onClick={onAbrir}
        aria-expanded={abierta}
        className="flex w-full items-center gap-3 border-t border-white/10 px-5 py-3 text-left transition-colors hover:bg-white/[0.04]"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/50">
          Notas del jurado
        </span>
        {otros.length ? (
          <span className="border border-white/20 px-1.5 py-0.5 font-mono text-[10px] text-white/70">
            {otros.length}
          </span>
        ) : null}
        {mio ? <span className="h-1.5 w-1.5 rounded-full bg-mg-red" aria-label="Ya escribiste aquí" /> : null}
        <span className="flex-1" />
        <motion.span
          animate={{ rotate: abierta ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="font-mono text-xs text-white/40"
          aria-hidden
        >
          ▾
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {abierta ? (
          <motion.div
            key="panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-white/10 bg-black/40"
          >
            <div className="space-y-4 p-5">
              <div>
                <div className="mb-2 flex items-center gap-3">
                  <label
                    htmlFor={`nota-${ficha.id}`}
                    className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/50"
                  >
                    Lo que tú opinas
                  </label>
                  <span className="flex-1" />
                  {estado ? (
                    <span
                      role="status"
                      className={`font-mono text-[10px] uppercase tracking-[0.2em] ${
                        estado.error ? "text-mg-red" : "text-white/40"
                      }`}
                    >
                      {estado.txt}
                    </span>
                  ) : null}
                </div>
                <textarea
                  id={`nota-${ficha.id}`}
                  rows={3}
                  defaultValue={mio?.texto ?? ""}
                  maxLength={1000}
                  onChange={(e) => onComentar(e.target.value)}
                  placeholder="Lo que quieres que lean los otros jurados sobre esta persona…"
                  className="w-full resize-y border border-white/15 bg-white/5 px-3 py-2 text-sm leading-relaxed text-white outline-none transition-colors placeholder:text-white/30 focus:border-mg-red"
                />
              </div>

              {otros.length ? (
                <ul className="space-y-3 border-t border-white/10 pt-4">
                  {otros.map((c) => (
                    <li key={c.jurado}>
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-mg-red">
                        {nombreDeJurado(c.jurado)}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">{c.texto}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="border-t border-white/10 pt-4 text-xs text-white/35">
                  Nadie más ha escrito sobre esta persona todavía.
                </p>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.li>
  )
}

function BotonElegir({
  marcada, completa, nombre, onClick,
}: {
  marcada: boolean
  completa: boolean
  nombre: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={marcada}
      aria-label={marcada ? `Quitar a ${nombre} de tus 12` : `Elegir a ${nombre}`}
      className={`relative shrink-0 overflow-hidden border px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors duration-300 ${
        marcada
          ? "border-mg-red bg-mg-red text-white"
          : completa
            ? "border-white/15 text-white/40 hover:border-white/30"
            : "border-white/30 text-white hover:border-mg-red hover:text-mg-red"
      }`}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={marcada ? "si" : "no"}
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -14, opacity: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="block"
        >
          {marcada ? "✓ En mis 12" : "Elegir"}
        </motion.span>
      </AnimatePresence>
    </button>
  )
}

/* ============================================================
   Reproductor
   ============================================================
   32 iframes montados a la vez vuelven la pagina un ladrillo, asi que cada
   ficha carga el suyo cuando el jurado lo pide. */

function Reproductor({ link, nombre }: { link: string; nombre: string }) {
  const [sonando, setSonando] = useState(false)
  const repro = useMemo(() => reproductorDe(link), [link])
  const plataforma = useMemo(() => plataformaDe(link), [link])

  if (repro.tipo === "enlace") {
    return (
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-center gap-2 border border-white/25 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-white transition-colors hover:border-mg-red hover:text-mg-red"
      >
        Escuchar en {plataforma}
        <span aria-hidden className="transition-transform group-hover:translate-x-0.5">↗</span>
      </a>
    )
  }

  if (!sonando) {
    return (
      <button
        type="button"
        onClick={() => setSonando(true)}
        className="group flex w-full items-center gap-3 border border-white/20 px-4 py-3 text-left transition-colors hover:border-mg-red"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mg-red text-white transition-transform group-hover:scale-110">
          ▶
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/70 group-hover:text-white">
          Escuchar a {nombre} · {plataforma}
        </span>
      </button>
    )
  }

  return (
    <div className="overflow-hidden border border-white/15">
      <iframe
        src={repro.src}
        title={`Música de ${nombre}`}
        height={repro.alto}
        loading="lazy"
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
        allowFullScreen
        className="w-full"
        style={{ height: repro.alto }}
      />
    </div>
  )
}

/* ============================================================
   "Ya tienes tus 12"
   ============================================================
   No es solo un aviso: es donde se hace el cambio. Mandar al jurado a buscar
   en la lista a quien quiere sacar, y volver, es como se pierde un voto. */

function CuadroCambio({
  entra, mias, onCerrar, onCambiar,
}: {
  entra: FichaJurado
  mias: FichaJurado[]
  onCerrar: () => void
  onCambiar: (sale: FichaJurado) => void
}) {
  useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => { if (e.key === "Escape") onCerrar() }
    document.addEventListener("keydown", alPulsar)
    // El fondo no se mueve mientras el cuadro esta abierto.
    const previo = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", alPulsar)
      document.body.style.overflow = previo
    }
  }, [onCerrar])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCerrar}
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-cambio"
    >
      <motion.div
        initial={{ y: 40, scale: 0.98 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 40, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[88svh] w-full max-w-lg overflow-y-auto border-t-4 border-mg-red bg-mg-black sm:border"
      >
        <div className="border-b border-white/10 p-6">
          <h2 id="titulo-cambio" className="font-heading text-4xl uppercase leading-[0.9] text-white">
            Ya tienes tus {MG1_TOPE_JURADO}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            Para que entre <b className="text-mg-red">{entra.nombre_artistico}</b>, saca a alguien de
            tu lista. Toca a quien quieres sacar y hacemos el cambio.
          </p>
        </div>

        <ul className="divide-y divide-white/[0.07]">
          {mias.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => onCambiar(f)}
                className="group flex w-full items-center gap-3 px-6 py-3.5 text-left transition-colors hover:bg-mg-red/10"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-heading text-xl uppercase leading-tight text-white">
                    {f.nombre_artistico}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                    {f.ciudad}
                  </span>
                </span>
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.2em] text-white/30 transition-colors group-hover:text-mg-red">
                  Sacar →
                </span>
              </button>
            </li>
          ))}
        </ul>

        <div className="border-t border-white/10 p-6">
          <button
            type="button"
            onClick={onCerrar}
            className="w-full border border-white/25 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white transition-colors hover:border-white/60"
          >
            Dejar mi lista como está
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
