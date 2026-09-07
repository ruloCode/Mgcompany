"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

/* Cuenta regresiva a la Gala.
   El servidor y el celular de quien mira están en zonas distintas, así que
   pintar números en el HTML del servidor produce un parpadeo al hidratar.
   Se renderiza el hueco y los números entran al montar. */

const UNIDADES = [
  { clave: "dias", label: "Días" },
  { clave: "horas", label: "Horas" },
  { clave: "min", label: "Min" },
  { clave: "seg", label: "Seg" },
] as const

function restante(objetivo: number) {
  const ms = Math.max(0, objetivo - Date.now())
  const seg = Math.floor(ms / 1000)
  return {
    dias: Math.floor(seg / 86400),
    horas: Math.floor((seg % 86400) / 3600),
    min: Math.floor((seg % 3600) / 60),
    seg: seg % 60,
    terminado: ms === 0,
  }
}

export default function CuentaRegresiva({
  iso,
  sobreFoto = false,
}: {
  iso: string
  /** Sobre una foto el fondo translúcido del hero desaparece: hace falta un
   *  suelo opaco y desenfocado o los números se pierden en el humo rojo. */
  sobreFoto?: boolean
}) {
  const objetivo = new Date(iso).getTime()
  const [t, setT] = useState<ReturnType<typeof restante> | null>(null)

  useEffect(() => {
    setT(restante(objetivo))
    const id = setInterval(() => setT(restante(objetivo)), 1000)
    return () => clearInterval(id)
  }, [objetivo])

  return (
    <div className="flex gap-2.5 sm:gap-3" aria-live="off">
      {UNIDADES.map((u, i) => (
        <motion.div
          key={u.clave}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 + i * 0.07, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className={`min-w-[62px] flex-1 px-2 py-3 text-center sm:min-w-[74px] ${
            sobreFoto
              ? "border border-white/25 bg-black/45 backdrop-blur-sm"
              : "border border-white/15 bg-white/[0.04]"
          }`}
        >
          <span className="block font-heading text-3xl leading-none tabular-nums sm:text-4xl">
            {t ? String(t[u.clave]).padStart(2, "0") : "––"}
          </span>
          <span className="mt-1.5 block font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
            {u.label}
          </span>
        </motion.div>
      ))}
    </div>
  )
}
