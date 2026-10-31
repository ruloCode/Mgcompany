"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AnimatePresence, motion } from "framer-motion"
import { Loader2, Pause, Play } from "lucide-react"

import DiagonalArrow from "@/components/diagonal-arrow"
import PlatformLinks from "@/components/platform-links"
import Corona from "@/components/mg1/corona"
import DiscoFinalista from "@/components/mg1/disco-finalista"
import {
  MG1_FIESTA,
  votoPublicoSchema,
  type Finalista,
  type RespuestaVoto,
  type VotoPublicoInput,
} from "@/lib/mg1-votacion"
import { cn } from "@/lib/utils"

/* La sala de escucha y la urna, en una sola pieza porque se hablan: el botón
   "Votar por…" de cada disco elige en el formulario.

   El reproductor es UN solo elemento de audio para toda la página. No hay
   forma de que suenen dos canciones a la vez porque no existen dos
   reproductores: tocar otro disco cambia la fuente del mismo. Lo que suele
   "bugear" un reproductor casero son las promesas de play() que se cruzan
   cuando alguien toca rápido dos discos; esas (AbortError) se ignoran a
   propósito, porque significan exactamente lo que la persona quería. */

const inputClass =
  "w-full border-2 border-white/15 bg-white/[0.03] px-4 py-3.5 text-base text-white " +
  "placeholder:text-zinc-500 transition-colors focus:border-mg-red focus:outline-none " +
  "focus:ring-1 focus:ring-mg-red disabled:opacity-60"
const labelClass = "mb-2 block font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-400"
const errorClass = "mt-1.5 text-sm text-mg-red-bright"

const reloj = (s: number) =>
  Number.isFinite(s) && s > 0 ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "0:00"

/* ============================================================
   El reproductor
   ============================================================ */

function useReproductor() {
  const audio = useRef<HTMLAudioElement | null>(null)
  const actualRef = useRef<Finalista | null>(null)
  const [actual, setActual] = useState<Finalista | null>(null)
  const [sonando, setSonando] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [tiempo, setTiempo] = useState({ pos: 0, dur: 0 })
  const [fallo, setFallo] = useState<string | null>(null)

  useEffect(() => {
    const a = new Audio()
    // Nada se descarga hasta que alguien da play: en datos móviles, cuatro
    // canciones precargadas son megas que nadie pidió.
    a.preload = "none"
    audio.current = a

    const ac = new AbortController()
    const on = (ev: string, fn: () => void) => a.addEventListener(ev, fn, { signal: ac.signal })
    on("playing", () => {
      setSonando(true)
      setCargando(false)
    })
    // Pausar mientras carga rechaza el play() con AbortError, que se ignora:
    // el que apaga el "cargando" en ese caso es este evento.
    on("pause", () => {
      setSonando(false)
      setCargando(false)
    })
    on("waiting", () => setCargando(true))
    on("canplay", () => setCargando(false))
    on("loadedmetadata", () => setTiempo({ pos: a.currentTime, dur: a.duration || 0 }))
    on("timeupdate", () => setTiempo({ pos: a.currentTime, dur: a.duration || 0 }))
    on("ended", () => {
      setSonando(false)
      a.currentTime = 0
    })
    on("error", () => {
      if (!actualRef.current) return
      setFallo(actualRef.current.slug)
      setSonando(false)
      setCargando(false)
    })

    return () => {
      ac.abort()
      a.pause()
      a.removeAttribute("src")
      a.load()
    }
  }, [])

  const reproducir = useCallback((f: Finalista) => {
    const a = audio.current
    if (!a) return
    setCargando(true)
    a.play().catch((e: DOMException) => {
      // Otro play() o un pause() pisó a este: es lo que la persona pidió.
      if (e.name === "AbortError") return
      setCargando(false)
      // El navegador exige un gesto; el siguiente toque lo resuelve.
      if (e.name === "NotAllowedError") return
      setFallo(f.slug)
    })
  }, [])

  const alternar = useCallback(
    (f: Finalista) => {
      const a = audio.current
      if (!a) return

      if (actualRef.current?.slug === f.slug && fallo !== f.slug) {
        if (a.paused) reproducir(f)
        else a.pause()
        return
      }

      a.pause()
      actualRef.current = f
      setActual(f)
      setFallo(null)
      setTiempo({ pos: 0, dur: 0 })
      a.src = f.audio
      reproducir(f)
    },
    [fallo, reproducir],
  )

  const buscar = useCallback((pos: number) => {
    const a = audio.current
    if (a && Number.isFinite(pos)) a.currentTime = pos
  }, [])

  // La pantalla bloqueada del celular muestra qué suena y deja pausar.
  useEffect(() => {
    if (!actual || typeof navigator === "undefined" || !("mediaSession" in navigator)) return
    navigator.mediaSession.metadata = new MediaMetadata({
      title: actual.cancion,
      artist: actual.nombre,
      album: "Final MG1 · MG Company",
      artwork: [{ src: "/logo-mg.png", sizes: "512x512", type: "image/png" }],
    })
    navigator.mediaSession.setActionHandler("play", () => reproducir(actual))
    navigator.mediaSession.setActionHandler("pause", () => audio.current?.pause())
  }, [actual, reproducir])

  return { actual, sonando, cargando, tiempo, fallo, alternar, buscar }
}

/* ============================================================
   Piezas
   ============================================================ */

function Ecualizador({ activo }: { activo: boolean }) {
  return (
    <span className="inline-flex h-4 items-end gap-[3px]" aria-hidden>
      {[0, 0.25, 0.1, 0.4].map((d, i) => (
        <span
          key={i}
          className="mg1-anim block w-[3px] origin-bottom bg-mg-red"
          style={{
            height: "100%",
            animation: activo ? `mg1-eq 0.9s ease-in-out ${d}s infinite` : "none",
            transform: activo ? undefined : "scaleY(0.25)",
          }}
        />
      ))}
    </span>
  )
}

interface PropsDisco {
  f: Finalista
  indice: number
  reproductor: ReturnType<typeof useReproductor>
  elegido: boolean
  onElegir: (slug: string) => void
}

function TarjetaFinalista({ f, indice, reproductor, elegido, onElegir }: PropsDisco) {
  const { actual, sonando, cargando, tiempo, fallo, alternar, buscar } = reproductor
  const activo = actual?.slug === f.slug
  const gira = activo && sonando
  const falla = fallo === f.slug

  return (
    <article className="flex flex-col">
      <button
        type="button"
        onClick={() => alternar(f)}
        aria-label={gira ? `Pausar «${f.cancion}»` : `Escuchar «${f.cancion}» de ${f.nombre}`}
        className="group relative mx-auto block w-full max-w-[340px] cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mg-red/60"
      >
        <div
          className={cn(
            "transition-[filter,transform] duration-700 group-hover:scale-[1.02] group-active:scale-[0.99]",
            gira
              ? "[filter:drop-shadow(0_0_38px_rgba(232,32,12,0.75))]"
              : "[filter:drop-shadow(0_18px_30px_rgba(0,0,0,0.65))]",
          )}
        >
          <DiscoFinalista nombre={f.nombre} cancion={f.cancion} girando={gira} />
        </div>
      </button>

      <div className="mt-6 flex items-start gap-4">
        <button
          type="button"
          onClick={() => alternar(f)}
          aria-label={gira ? "Pausar" : "Escuchar"}
          className={cn(
            "flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            gira ? "border-mg-red bg-mg-red text-white" : "border-white/25 text-white hover:border-mg-red hover:bg-mg-red",
          )}
        >
          {activo && cargando ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : gira ? (
            <Pause className="h-6 w-6" fill="currentColor" />
          ) : (
            <Play className="ml-0.5 h-6 w-6" fill="currentColor" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.25em] text-mg-red-bright">
            Finalista {String(indice + 1).padStart(2, "0")}
            <Ecualizador activo={gira} />
          </p>
          <h3 className="mt-1 font-heading text-3xl uppercase leading-[0.95] tracking-wide md:text-4xl">{f.nombre}</h3>
          <p className="mt-1 truncate text-sm text-zinc-300">«{f.cancion}»</p>
          {f.ciudad ? (
            <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">{f.ciudad}</p>
          ) : null}
        </div>
      </div>

      {/* La barra de tiempo solo existe para el disco que suena. */}
      <div className="mt-4 h-9">
        {falla ? (
          <p className="text-sm text-mg-red-bright">No pudimos cargar la canción. Toca play para intentar de nuevo.</p>
        ) : activo ? (
          <div className="flex items-center gap-3">
            <span className="w-10 font-mono text-[11px] tabular-nums text-zinc-400">{reloj(tiempo.pos)}</span>
            <input
              type="range"
              min={0}
              max={tiempo.dur || 0}
              step={0.1}
              value={Math.min(tiempo.pos, tiempo.dur || 0)}
              onChange={(e) => buscar(Number(e.target.value))}
              aria-label={`Posición en «${f.cancion}»`}
              className="h-1 flex-1 cursor-pointer accent-[#E8200C]"
              disabled={!tiempo.dur}
            />
            <span className="w-10 text-right font-mono text-[11px] tabular-nums text-zinc-400">{reloj(tiempo.dur)}</span>
          </div>
        ) : null}
      </div>

      <PlatformLinks links={f.redes} className="mt-2" />

      <button
        type="button"
        onClick={() => onElegir(f.slug)}
        className={cn(
          "group mt-6 inline-flex items-center justify-between gap-4 border-2 px-5 py-4 transition-colors duration-300",
          elegido
            ? "border-mg-red bg-mg-red text-white"
            : "border-white/20 text-white hover:border-mg-red hover:bg-mg-red",
        )}
      >
        <span className="font-mono text-xs font-bold uppercase tracking-[0.22em]">
          {elegido ? `Tu voto: ${f.nombre}` : `Votar por ${f.nombre}`}
        </span>
        <DiagonalArrow size={20} strokeWidth={1.75} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </button>
    </article>
  )
}

/** Lo que sigue sonando mientras la persona baja a votar. */
function BarraSonando({ reproductor }: { reproductor: ReturnType<typeof useReproductor> }) {
  const { actual, sonando, cargando, tiempo, alternar } = reproductor
  const avance = tiempo.dur ? (tiempo.pos / tiempo.dur) * 100 : 0

  return (
    <AnimatePresence>
      {actual ? (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-mg-black/90 backdrop-blur-md"
        >
          <div className="h-[3px] bg-white/10">
            <div className="h-full bg-mg-red transition-[width] duration-300 ease-linear" style={{ width: `${avance}%` }} />
          </div>
          <div className="container mx-auto flex items-center gap-4 px-4 py-3 md:px-6 lg:px-10">
            <button
              type="button"
              onClick={() => alternar(actual)}
              aria-label={sonando ? "Pausar" : "Seguir escuchando"}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-mg-red text-white"
            >
              {cargando ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : sonando ? (
                <Pause className="h-5 w-5" fill="currentColor" />
              ) : (
                <Play className="ml-0.5 h-5 w-5" fill="currentColor" />
              )}
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate font-heading text-xl uppercase leading-none tracking-wide">{actual.nombre}</p>
              <p className="truncate text-xs text-zinc-400">«{actual.cancion}»</p>
            </div>
            <Ecualizador activo={sonando} />
            <a
              href="#votar"
              className="hidden border border-white/25 px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.2em] hover:border-mg-red sm:inline-block"
            >
              Votar
            </a>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

/* ============================================================
   La urna
   ============================================================ */

interface Props {
  finalistas: Finalista[]
  utm: { utm_source?: string; utm_medium?: string; utm_campaign?: string }
}

export default function SalaVotacion({ finalistas, utm }: Props) {
  const reproductor = useReproductor()
  const [errorServidor, setErrorServidor] = useState<string | null>(null)
  const [hecho, setHecho] = useState<(RespuestaVoto & { email: string; finalista: Finalista }) | null>(null)

  const {
    register, handleSubmit, setValue, setError, watch, reset,
    formState: { errors, isSubmitting },
  } = useForm<VotoPublicoInput>({
    resolver: zodResolver(votoPublicoSchema),
    defaultValues: { website: "", ...utm },
  })
  const elegido = watch("finalista")

  const elegir = (slug: string) => {
    setValue("finalista", slug, { shouldValidate: Boolean(errors.finalista) })
    document.getElementById("votar")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  async function enviar(datos: VotoPublicoInput) {
    setErrorServidor(null)
    try {
      const res = await fetch("/api/mg1/votacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        const campos = (json.fields ?? {}) as Record<string, string[]>
        for (const [campo, msgs] of Object.entries(campos)) {
          setError(campo as keyof VotoPublicoInput, { message: msgs[0] })
        }
        setErrorServidor(json.error ?? "No pudimos registrar tu voto. Intenta de nuevo.")
        return
      }
      setHecho({
        ...(json as RespuestaVoto),
        email: datos.email,
        finalista: finalistas.find((f) => f.slug === datos.finalista)!,
      })
      document.getElementById("votar")?.scrollIntoView({ behavior: "smooth", block: "start" })
    } catch {
      setErrorServidor("Sin conexión. Revisa tus datos móviles e intenta de nuevo.")
    }
  }

  return (
    <>
      {/* Los discos */}
      {/* Cuatro discos: 2×2 hasta que caben los cuatro en fila sin encoger el nombre. */}
      <div className="grid gap-16 sm:grid-cols-2 md:gap-12 xl:grid-cols-4">
        {finalistas.map((f, i) => (
          <motion.div
            key={f.slug}
            initial={{ opacity: 0, y: 40, rotate: -8 }}
            whileInView={{ opacity: 1, y: 0, rotate: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
          >
            <TarjetaFinalista
              f={f}
              indice={i}
              reproductor={reproductor}
              elegido={elegido === f.slug}
              onElegir={elegir}
            />
          </motion.div>
        ))}
      </div>

      {/* El voto */}
      <section id="votar" className="mt-24 scroll-mt-8 border-t-4 border-mg-red bg-white/[0.02] px-5 py-12 md:mt-32 md:px-10 md:py-16">
        <AnimatePresence mode="wait">
          {hecho ? (
            <motion.div key="listo" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Listo
                datos={hecho}
                onOtra={() => {
                  setHecho(null)
                  reset({ website: "", ...utm })
                }}
              />
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleSubmit(enviar)}
              noValidate
              className="relative max-w-2xl"
            >
              <p className="font-mono text-xs font-medium uppercase tracking-[0.3em] text-mg-red-bright">[ Tu voto ]</p>
              <h2 className="mt-3 font-heading text-5xl uppercase leading-[0.9] md:text-7xl">¿Quién se lleva el Disco Ruby?</h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-zinc-300">
                Un correo, un voto. Te mandamos un enlace para confirmarlo: hasta que no lo abras,
                tu voto no cuenta. Así sabemos que detrás de cada voto hay una persona.
              </p>

              {/* Honeypot: invisible para personas, irresistible para bots. */}
              <div aria-hidden className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
                <label htmlFor="v-website">No llenes este campo</label>
                <input id="v-website" tabIndex={-1} autoComplete="off" {...register("website")} />
              </div>

              <fieldset className="mt-10">
                <legend className={labelClass}>Mi finalista</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {finalistas.map((f) => (
                    <label
                      key={f.slug}
                      className={cn(
                        "flex min-h-[64px] cursor-pointer flex-col justify-center border-2 px-4 py-3 transition-colors",
                        elegido === f.slug ? "border-mg-red bg-mg-red/15" : "border-white/15 hover:border-white/40",
                      )}
                    >
                      <input type="radio" value={f.slug} className="sr-only" {...register("finalista")} />
                      <span className="font-heading text-2xl uppercase leading-none tracking-wide">{f.nombre}</span>
                      <span className="mt-1 truncate text-xs text-zinc-400">«{f.cancion}»</span>
                    </label>
                  ))}
                </div>
                {errors.finalista && <p className={errorClass}>{errors.finalista.message}</p>}
              </fieldset>

              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="v-nombre" className={labelClass}>Tu nombre</label>
                  <input id="v-nombre" autoComplete="name" className={inputClass} placeholder="Ej: Laura" {...register("nombre")} />
                  {errors.nombre && <p className={errorClass}>{errors.nombre.message}</p>}
                </div>
                <div>
                  <label htmlFor="v-ciudad" className={labelClass}>Ciudad</label>
                  <input id="v-ciudad" autoComplete="address-level2" className={inputClass} placeholder="Ej: Bogotá" {...register("ciudad")} />
                  {errors.ciudad && <p className={errorClass}>{errors.ciudad.message}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="v-email" className={labelClass}>Correo</label>
                  <input
                    id="v-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="off"
                    spellCheck={false}
                    className={inputClass}
                    placeholder="tu@correo.com"
                    {...register("email")}
                  />
                  <p className="mt-1.5 text-xs text-zinc-500">Aquí llega el enlace para confirmar. Sin confirmar, el voto no cuenta.</p>
                  {errors.email && <p className={errorClass}>{errors.email.message}</p>}
                </div>
              </div>

              <fieldset className="mt-8">
                <legend className={labelClass}>¿Eres artista?</legend>
                <div className="flex gap-3">
                  {[
                    { v: "si", l: "Sí, hago música" },
                    { v: "no", l: "No" },
                  ].map((o) => (
                    <label key={o.v} className="cursor-pointer">
                      <input type="radio" value={o.v} className="peer sr-only" {...register("es_artista")} />
                      <span className="flex min-h-[48px] items-center border-2 border-white/15 px-5 text-sm transition-colors peer-checked:border-mg-red peer-checked:bg-mg-red/15 peer-focus-visible:ring-2 peer-focus-visible:ring-mg-red">
                        {o.l}
                      </span>
                    </label>
                  ))}
                </div>
                {errors.es_artista && <p className={errorClass}>{errors.es_artista.message}</p>}
              </fieldset>

              <label className="mt-8 flex cursor-pointer gap-3 text-sm leading-relaxed text-zinc-300">
                <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-[#E8200C]" {...register("acepta_datos")} />
                <span>Autorizo a MG Company a tratar mis datos para registrar mi voto y escribirme sobre MG1 (Ley 1581 de 2012).</span>
              </label>
              {errors.acepta_datos && <p className={errorClass}>{errors.acepta_datos.message}</p>}

              {errorServidor ? (
                <div role="alert" className="mt-8 border-2 border-mg-red/60 bg-mg-red/10 px-4 py-3 text-sm text-white">
                  {errorServidor}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-8 w-full bg-mg-red px-6 py-4 font-mono text-sm font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-mg-red/90 disabled:opacity-60 sm:w-auto"
              >
                {isSubmitting ? "Enviando…" : "Votar"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </section>

      <BarraSonando reproductor={reproductor} />
      {/* Que la barra fija no tape el final de la página. */}
      {reproductor.actual ? <div className="h-20" aria-hidden /> : null}
    </>
  )
}

/* ============================================================
   Después de votar
   ============================================================ */

/* Un solo mensaje para todos los casos, a propósito: la API no dice si el voto
   es nuevo, un cambio o el que ya contaba (ver lib/mg1-votacion.ts), así que
   esta pantalla tampoco puede. El correo es el que lo dice. */
function textoListo(email: string, f: string): React.ReactNode {
  return (
    <>
      Te mandamos un correo a <b className="text-white">{email}</b>. Ábrelo y toca{" "}
      <b className="text-white">Confirmar mi voto</b>: hasta entonces tu voto por {f} no cuenta. Si ya tenías un
      voto, el correo te dice qué pasa con él. Si no lo ves en un par de minutos, búscalo en Promociones o en Spam.
    </>
  )
}

function Listo({
  datos,
  onOtra,
}: {
  datos: RespuestaVoto & { email: string; finalista: Finalista }
  onOtra: () => void
}) {

  const compartir = () => {
    const url = `${window.location.origin}/mg1/votacion?utm_source=whatsapp&utm_medium=compartir`
    const texto = `Ya voté en la final de MG1. Escucha a los finalistas y vota tú, cierra el viernes 30 a las 9:45 p.m.: ${url}`
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank", "noopener,noreferrer")
  }

  return (
    <div className="max-w-2xl" role="status">
      <p className="font-mono text-xs font-medium uppercase tracking-[0.3em] text-mg-red-bright">[ Falta un paso ]</p>
      <h2 className="mt-3 font-heading text-5xl uppercase leading-[0.9] md:text-7xl">Revisa tu correo</h2>
      <p className="mt-5 text-base leading-relaxed text-zinc-300">{textoListo(datos.email, datos.finalista.nombre)}</p>

      {datos.enlace_dev ? (
        <div className="mt-6 border-2 border-dashed border-amber-400/60 p-4 text-sm text-amber-200">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em]">Solo en desarrollo · sin Resend</p>
          <a href={datos.enlace_dev} className="mt-2 block break-all underline">{datos.enlace_dev}</a>
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={compartir}
          className="flex min-h-[48px] items-center justify-center bg-[#25D366] px-5 font-mono text-xs font-bold uppercase tracking-[0.18em] text-black"
        >
          Invitar a votar por WhatsApp
        </button>
        <button
          type="button"
          onClick={onOtra}
          className="min-h-[48px] border-2 border-white/25 px-5 font-mono text-xs font-bold uppercase tracking-[0.18em] text-white hover:border-white/60"
        >
          Me equivoqué de correo
        </button>
      </div>

      <a
        href={MG1_FIESTA.url}
        className="group mt-10 block border-2 border-white/15 p-5 transition-colors hover:border-mg-red md:p-6"
      >
        <p className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.25em] text-mg-red-bright">
          <Corona className="h-5 w-5 shrink-0 text-white" />
          {MG1_FIESTA.nombre}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-zinc-300">
          El campeón se corona en vivo la misma noche del cierre. {MG1_FIESTA.cuando} · {MG1_FIESTA.donde}. Entrada
          gratis con registro.
        </p>
        <p className="mt-4 inline-flex items-center gap-3 font-mono text-xs font-bold uppercase tracking-[0.2em]">
          Quiero estar en la lista
          <DiagonalArrow size={18} strokeWidth={1.75} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </p>
      </a>
    </div>
  )
}
