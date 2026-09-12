"use client"

import { motion } from "framer-motion"
import CountUp from "./count-up"

interface MetricRowProps {
  /** La frase que explica la cifra */
  concepto: React.ReactNode
  value: number
  decimals?: number
  prefix?: string
  suffix?: string
  index?: number
}

/**
 * Fila de la "taquilla": cifra enorme + concepto, con una linea roja que se
 * traza al revelarse. En movil la cifra va primero — es lo que frena el scroll.
 */
export default function MetricRow({
  concepto,
  value,
  decimals,
  prefix,
  suffix,
  index = 0,
}: MetricRowProps) {
  const delay = Math.min(index * 0.08, 0.4)

  return (
    <div className="relative border-b border-white/10 py-6 md:py-7">
      <div className="flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between md:gap-12">
        <motion.p
          className="order-2 max-w-[52ch] text-sm leading-relaxed text-zinc-300 md:order-1 md:text-base"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, delay: delay + 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          {concepto}
        </motion.p>

        <div className="order-1 shrink-0 md:order-2 md:text-right">
          <CountUp
            value={value}
            decimals={decimals}
            prefix={prefix}
            suffix={suffix}
            className="font-heading leading-none tracking-tight text-[clamp(2.75rem,9vw,4.25rem)]"
          />
        </div>
      </div>

      <motion.span
        aria-hidden="true"
        className="absolute -bottom-px left-0 h-px w-full origin-left bg-mg-red"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  )
}
