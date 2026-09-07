"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { GALA_CRONOGRAMA } from "@/lib/gala"

/* Cronograma como línea de tiempo vertical.
   Vertical también en desktop a propósito: en móvil —que es por donde llega
   casi todo el mundo— una tira horizontal obliga a hacer scroll lateral y la
   gente se pierde la mitad. La línea roja se dibuja con el scroll: es la
   única animación que aporta información (por dónde vas de la noche). */

export default function Cronograma() {
  const ref = useRef<HTMLOListElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 75%", "end 60%"],
  })
  const alto = useTransform(scrollYProgress, [0, 1], ["0%", "100%"])

  return (
    <ol ref={ref} className="relative ml-1 pl-8 md:pl-12">
      {/* Riel: el gris siempre, el rojo según el scroll */}
      <span aria-hidden className="absolute left-0 top-2 h-[calc(100%-1rem)] w-px bg-white/12" />
      <motion.span
        aria-hidden
        style={{ height: alto }}
        className="absolute left-0 top-2 w-px origin-top bg-mg-red"
      />

      {GALA_CRONOGRAMA.map((bloque, i) => (
        <motion.li
          key={bloque.hora}
          initial={{ opacity: 0, x: -14 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.55, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="relative pb-9 last:pb-0"
        >
          <motion.span
            aria-hidden
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ type: "spring", stiffness: 300, damping: 18, delay: i * 0.05 + 0.1 }}
            className="absolute -left-8 top-1.5 h-3 w-3 -translate-x-1/2 rounded-full bg-mg-red ring-4 ring-mg-black md:-left-12"
          />
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.25em] text-mg-red-bright">
            {bloque.hora}
          </p>
          <h3 className="mt-2 font-heading text-2xl uppercase leading-none tracking-wide md:text-3xl">
            {bloque.titulo}
          </h3>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-400 md:text-[15px]">
            {bloque.desc}
          </p>
        </motion.li>
      ))}
    </ol>
  )
}
