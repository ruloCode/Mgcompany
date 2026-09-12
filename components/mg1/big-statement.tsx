"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.08 } },
}

const word = {
  hidden: { opacity: 0, y: 40, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] as const },
  },
}

interface BigStatementProps {
  /** Primera parte de la frase, en blanco */
  text: string
  /** Cierre de la frase, en rojo — lo que queremos que se quede */
  accent?: string
  className?: string
}

/** Frase grande palabra por palabra: la misma entrada que usa `Statement` en MG1. */
export default function BigStatement({ text, accent, className }: BigStatementProps) {
  return (
    <motion.p
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.35 }}
      className={cn(
        "font-heading uppercase leading-[0.95] tracking-tight text-[clamp(1.9rem,5.4vw,3.9rem)]",
        className,
      )}
    >
      {text.split(" ").map((w, i) => (
        <motion.span key={`t-${i}`} variants={word} className="inline-block">
          {w}&nbsp;
        </motion.span>
      ))}
      {accent
        ?.split(" ")
        .map((w, i) => (
          <motion.span
            key={`a-${i}`}
            variants={word}
            className="inline-block text-mg-red"
          >
            {w}&nbsp;
          </motion.span>
        ))}
    </motion.p>
  )
}
