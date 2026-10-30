"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, Pause, Play } from "lucide-react"

import DiscoFinalista from "@/components/mg1/disco-finalista"
import type { Finalista, ResultadoConfirmacion } from "@/lib/mg1-votacion"

/* El botón que convierte el voto en un voto que cuenta.

   Existe un clic aquí, y no confirmación automática al abrir el enlace,
   porque los filtros de correo abren los enlaces para revisarlos: el voto lo
   confirmaría un robot. Ver app/api/mg1/votacion/confirmar. */

interface Props {
  token: string
  finalista: Finalista
  yaConfirmado?: boolean
}

export default function ConfirmarVoto({ token, finalista, yaConfirmado = false }: Props) {
  const [estado, setEstado] = useState<"listo" | "enviando" | ResultadoConfirmacion>(
    yaConfirmado ? "ya_confirmado" : "listo",
  )
  const [error, setError] = useState<string | null>(null)
  const audio = useRef<HTMLAudioElement | null>(null)
  const [sonando, setSonando] = useState(false)

  useEffect(() => () => audio.current?.pause(), [])

  function reproductor() {
    if (!audio.current) {
      const a = new Audio(finalista.audio)
      a.preload = "auto"
      a.addEventListener("play", () => setSonando(true))
      a.addEventListener("pause", () => setSonando(false))
      a.addEventListener("ended", () => setSonando(false))
      audio.current = a
    }
    return audio.current
  }

  function alternarAudio() {
    const a = reproductor()
    if (a.paused) a.play().catch(() => {})
    else a.pause()
  }

  async function confirmar() {
    setEstado("enviando")
    setError(null)

    // iOS solo deja sonar un audio que se tocó dentro del gesto del usuario, y la
    // respuesta llega después: se desbloquea aquí en silencio y suena al confirmar.
    const a = reproductor()
    a.muted = true
    a.play().catch(() => {})
    a.pause()

    try {
      const res = await fetch("/api/mg1/votacion/confirmar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ t: token }),
      })
      const json = await res.json().catch(() => ({}))
      a.muted = false
      if (json.resultado) {
        const r = json.resultado as ResultadoConfirmacion
        setEstado(r)
        if (r === "confirmado" || r === "ya_confirmado") {
          a.currentTime = 0
          a.play().catch(() => {})
        }
        return
      }
      setEstado("listo")
      setError(json.error ?? "No pudimos confirmar tu voto. Intenta de nuevo.")
    } catch {
      a.muted = false
      setEstado("listo")
      setError("Sin conexión. Revisa tus datos móviles e intenta de nuevo.")
    }
  }

  const confirmado = estado === "confirmado" || estado === "ya_confirmado"

  return (
    <div className="grid items-center gap-12 lg:grid-cols-2">
      <div className="mx-auto w-full max-w-[360px]">
        <div
          className={
            confirmado
              ? "[filter:drop-shadow(0_0_40px_rgba(232,32,12,0.75))] transition-[filter] duration-700"
              : "[filter:drop-shadow(0_18px_30px_rgba(0,0,0,0.65))] transition-[filter] duration-700"
          }
        >
          <DiscoFinalista nombre={finalista.nombre} cancion={finalista.cancion} girando={confirmado} />
        </div>
      </div>

      <div>
        {confirmado ? (
          <>
            <p className="font-mono text-xs font-medium uppercase tracking-[0.3em] text-mg-red-bright">[ Voto confirmado ]</p>
            <h1 className="mt-4 font-heading text-6xl uppercase leading-[0.9] md:text-8xl">Tu voto cuenta</h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-zinc-300">
              Votaste por <b className="text-white">{finalista.nombre}</b>. El resultado es secreto hasta la
              coronación: se anuncia en vivo la noche del cierre.
            </p>
            <button
              type="button"
              onClick={alternarAudio}
              className="mt-8 inline-flex min-h-[48px] items-center gap-3 border-2 border-white/25 px-5 font-mono text-xs font-bold uppercase tracking-[0.18em] text-white transition-colors hover:border-white/60"
            >
              {sonando ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {sonando ? "Pausar" : "Escuchar"} «{finalista.cancion}»
            </button>
          </>
        ) : estado === "vencido" || estado === "invalido" || estado === "cerrada" ? (
          <>
            <p className="font-mono text-xs font-medium uppercase tracking-[0.3em] text-mg-red-bright">[ No se pudo ]</p>
            <h1 className="mt-4 font-heading text-5xl uppercase leading-[0.9] md:text-7xl">
              {estado === "cerrada" ? "La votación cerró" : "Este enlace ya no sirve"}
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-zinc-300">
              {estado === "cerrada"
                ? "Llegaste tarde a confirmar: este voto no entra en el conteo."
                : "Puede que hayas pedido otro correo después de este. Usa el más reciente, o vuelve a votar."}
            </p>
          </>
        ) : (
          <>
            <p className="font-mono text-xs font-medium uppercase tracking-[0.3em] text-mg-red-bright">[ Último paso ]</p>
            <h1 className="mt-4 font-heading text-5xl uppercase leading-[0.9] md:text-7xl">
              Confirma tu voto por {finalista.nombre}
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-zinc-300">
              «{finalista.cancion}». Un toque y queda contado.
            </p>
            {error ? (
              <div role="alert" className="mt-6 border-2 border-mg-red/60 bg-mg-red/10 px-4 py-3 text-sm">
                {error}
              </div>
            ) : null}
            <button
              type="button"
              onClick={confirmar}
              disabled={estado === "enviando"}
              className="mt-8 inline-flex min-h-[56px] items-center gap-3 bg-mg-red px-8 font-mono text-sm font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-mg-red/90 disabled:opacity-60"
            >
              {estado === "enviando" ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
              Confirmar mi voto
            </button>
          </>
        )}
      </div>
    </div>
  )
}
