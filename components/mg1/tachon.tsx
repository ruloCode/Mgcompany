"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface TachonProps {
  children: React.ReactNode
  delay?: number
  className?: string
}

/**
 * Texto que se tacha en rojo al entrar en pantalla. Sirve para corregir en vivo
 * una idea que el lector ya trae puesta ("esto es un alquiler") antes de poner
 * la verdadera. Va en <s> para que un lector de pantalla tambien lo entienda
 * como suprimido; la linea la dibujamos nosotros.
 */
export default function Tachon({ children, delay = 0.25, className }: TachonProps) {
  return (
    <span className="relative inline-block">
      <s className={cn("text-zinc-500 [text-decoration:none]", className)}>{children}</s>
      <motion.span
        aria-hidden="true"
        className="absolute left-0 top-[46%] h-[0.075em] w-full origin-left bg-mg-red"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
      />
    </span>
  )
}
