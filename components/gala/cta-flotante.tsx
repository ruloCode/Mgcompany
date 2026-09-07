"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"

/* Barra fija con el CTA, solo en móvil.
   Aparece cuando el hero ya salió de pantalla y desaparece cuando el
   formulario está a la vista: si ya lo tienes delante, un botón que dice
   "ir al formulario" solo tapa el formulario. */

export default function CtaFlotante({ objetivo = "registro" }: { objetivo?: string }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const form = document.getElementById(objetivo)
    if (!form) return

    let paso = false
    let enForm = false

    const onScroll = () => {
      paso = window.scrollY > window.innerHeight * 0.7
      setVisible(paso && !enForm)
    }

    const io = new IntersectionObserver(
      ([e]) => {
        enForm = e.isIntersecting
        setVisible(paso && !enForm)
      },
      { rootMargin: "-15% 0px -25% 0px" },
    )
    io.observe(form)

    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()

    return () => {
      io.disconnect()
      window.removeEventListener("scroll", onScroll)
    }
  }, [objetivo])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 90 }}
          animate={{ y: 0 }}
          exit={{ y: 90 }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-mg-black/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur md:hidden"
        >
          <a
            href={`#${objetivo}`}
            className="flex min-h-[52px] w-full items-center justify-center bg-mg-red font-mono text-xs font-medium uppercase tracking-[0.25em] text-white"
          >
            Registrarme
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
