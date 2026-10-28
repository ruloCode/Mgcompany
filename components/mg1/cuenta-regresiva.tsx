"use client"

import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

/* Cuenta regresiva hasta un instante.

   El reloj de referencia es el del servidor: viaja como `ahora` y se calcula
   el desfase contra el del celular una sola vez. Un celular con la hora mal
   puesta (pasa más de lo que parece) no cuenta mal.

   Al llegar a cero refresca la página: el servidor decide qué se muestra
   después — la votación abierta, o la página cerrada. */

interface Props {
  hasta: string
  ahora: string
  className?: string
}

const pad = (n: number) => String(n).padStart(2, "0")

export default function CuentaRegresiva({ hasta, ahora, className }: Props) {
  const router = useRouter()
  const desfase = useRef<number | null>(null)
  const [restante, setRestante] = useState(() => new Date(hasta).getTime() - new Date(ahora).getTime())
  const refrescado = useRef(false)

  useEffect(() => {
    if (desfase.current === null) desfase.current = new Date(ahora).getTime() - Date.now()
    const tic = () => {
      const r = new Date(hasta).getTime() - (Date.now() + (desfase.current ?? 0))
      setRestante(r)
      if (r <= 0 && !refrescado.current) {
        refrescado.current = true
        // Un respiro: que el servidor ya esté del otro lado del cierre.
        setTimeout(() => router.refresh(), 1500)
      }
    }
    tic()
    const t = setInterval(tic, 1000)
    return () => clearInterval(t)
  }, [hasta, ahora, router])

  const s = Math.max(0, Math.floor(restante / 1000))
  const partes = [
    { v: Math.floor(s / 86400), l: "días" },
    { v: Math.floor((s % 86400) / 3600), l: "horas" },
    { v: Math.floor((s % 3600) / 60), l: "min" },
    { v: s % 60, l: "seg" },
  ]

  return (
    <div className={className} role="timer" aria-live="off">
      <div className="flex items-end gap-3 md:gap-5">
        {partes.map((p, i) => (
          <div key={p.l} className="flex items-end gap-3 md:gap-5">
            <div className="text-center">
              <span className="block font-heading text-5xl leading-none tabular-nums md:text-7xl">{pad(p.v)}</span>
              <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-400 md:text-xs">
                {p.l}
              </span>
            </div>
            {i < partes.length - 1 ? (
              <span className="mb-5 font-heading text-3xl leading-none text-mg-red md:mb-7 md:text-5xl">:</span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}
