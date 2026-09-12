"use client"

import { motion } from "framer-motion"
import CountUp from "./count-up"

interface RazonRowProps {
  index: number
  /** Cifra que carga el argumento (2006, 1.000, 65,6, 2) */
  value: number
  decimals?: number
  suffix?: string
  agrupar?: boolean
  /** Qué es esa cifra: "artistas", "pisos"… */
  unidad: string
  titulo: string
  children: React.ReactNode
}

/**
 * Una razon = una cifra. Misma gramatica que `MetricRow` en la seccion de
 * numeros: el dato manda y el texto solo lo remata, para no repetir parrafos.
 */
export default function RazonRow({
  index,
  value,
  decimals,
  suffix,
  agrupar,
  unidad,
  titulo,
  children,
}: RazonRowProps) {
  const delay = index * 0.08

  return (
    <li className="group relative border-b border-white/10">
      <div className="grid grid-cols-12 items-baseline gap-x-6 gap-y-3 py-7 transition-colors duration-300 md:gap-x-8 md:py-9 md:group-hover:bg-white/[0.03]">
        <div className="col-span-12 md:col-span-4 lg:col-span-3">
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.3em] text-white/40 transition-colors duration-300 group-hover:text-mg-red-bright">
            {String(index + 1).padStart(2, "0")} / 04
          </span>
          <div className="mt-2 flex items-baseline gap-2 transition-transform duration-300 md:group-hover:translate-x-1">
            <CountUp
              value={value}
              decimals={decimals}
              suffix={suffix}
              agrupar={agrupar}
              className="font-heading leading-none tracking-tight text-[clamp(2.5rem,8vw,3.75rem)]"
            />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 md:text-[11px]">
              {unidad}
            </span>
          </div>
        </div>

        <h3 className="col-span-12 font-heading text-xl uppercase leading-tight tracking-wide transition-colors duration-300 group-hover:text-mg-red md:col-span-8 md:text-2xl lg:col-span-3">
          {titulo}
        </h3>

        <p className="col-span-12 max-w-[52ch] text-sm leading-relaxed text-zinc-300 md:col-span-8 md:col-start-5 md:text-[15px] lg:col-span-6 lg:col-start-7">
          {children}
        </p>
      </div>

      <motion.span
        aria-hidden="true"
        className="absolute -bottom-px left-0 h-px w-full origin-left bg-mg-red"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      />
    </li>
  )
}
