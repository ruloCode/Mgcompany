"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { animate, motion, useInView } from "framer-motion"
import { cn } from "@/lib/utils"

interface CountUpProps {
  value: number
  /** Decimales a mostrar (65,6 % -> decimals={1}) */
  decimals?: number
  prefix?: string
  suffix?: string
  duration?: number
  /** false para años y codigos: 2006, no 2.006 */
  agrupar?: boolean
  className?: string
  affixClassName?: string
}

/**
 * Contador que arranca al entrar en pantalla.
 * El formato es es-CO fijo — si dependiera del locale del navegador, el HTML del
 * servidor y el del cliente no coincidirian y React tiraria error de hidratacion.
 */
export default function CountUp({
  value,
  decimals = 0,
  prefix,
  suffix,
  duration = 1.6,
  agrupar = true,
  className,
  affixClassName,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })
  const [count, setCount] = useState(0)

  const fmt = useMemo(
    () =>
      new Intl.NumberFormat("es-CO", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
        useGrouping: agrupar,
      }),
    [decimals, agrupar],
  )

  useEffect(() => {
    if (!inView) return
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setCount(v),
    })
    return () => controls.stop()
  }, [inView, value, duration])

  return (
    <motion.span
      ref={ref}
      className={cn("inline-block", className)}
      initial={{ opacity: 0, scale: 0.85, y: 10 }}
      animate={inView ? { opacity: 1, scale: 1, y: 0 } : undefined}
      transition={{ type: "spring", stiffness: 190, damping: 19 }}
    >
      {prefix && <span className={cn("text-mg-red", affixClassName)}>{prefix}</span>}
      <span className="tabular-nums">{fmt.format(count)}</span>
      {suffix && <span className={cn("text-mg-red", affixClassName)}>{suffix}</span>}
    </motion.span>
  )
}
