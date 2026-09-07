"use client"

import { motion } from "framer-motion"
import AnimatedCounter from "@/components/mg1/animated-counter"
import { GALA_CUPO } from "@/lib/gala"

/* Cuánto queda del aforo.

   HOY NO SE MONTA EN NINGUNA PÁGINA. Se quitó del hero de /gala por decisión
   del equipo: enseñar el contador en vivo con la lista todavía corta juega en
   contra —"quedan 80 de 80" se lee como que no va nadie— y el aforo real ya lo
   impone la base de datos, que es donde importa. Se conserva entero para
   volver a montarlo cuando la lista esté llena y el número empuje en lugar de
   frenar: basta con importarlo y pasarle `ocupados`.
   No es un contador de urgencia inventado: el salón cabe 80 y ese número lo
   impone la base de datos. Cuando llega a cero el formulario no se cierra —
   pasa a lista de espera— y el medidor lo dice con esas palabras. */

export default function MedidorCupo({ ocupados }: { ocupados: number }) {
  const restantes = Math.max(0, GALA_CUPO - ocupados)
  const lleno = restantes === 0
  const porcentaje = Math.min(100, Math.round((ocupados / GALA_CUPO) * 100))

  return (
    <div className="border-t-4 border-mg-red bg-white/[0.03] p-6 md:p-8">
      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.25em] text-zinc-400">
        {lleno ? "Aforo completo" : "Lugares disponibles"}
      </p>

      <p className="mt-3 flex items-baseline gap-3">
        <AnimatedCounter
          value={lleno ? GALA_CUPO : restantes}
          className="font-heading text-[clamp(3rem,12vw,5rem)] leading-none text-mg-red"
        />
        <span className="font-mono text-sm uppercase tracking-[0.2em] text-zinc-400">
          {lleno ? `de ${GALA_CUPO} ocupados` : `de ${GALA_CUPO}`}
        </span>
      </p>

      <div
        className="mt-6 h-2 w-full overflow-hidden bg-white/10"
        role="progressbar"
        aria-valuenow={porcentaje}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Ocupación del aforo"
      >
        <motion.span
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: porcentaje / 100 }}
          viewport={{ once: true, amount: 0.8 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className="block h-full origin-left bg-mg-red"
        />
      </div>

      <p className="mt-4 text-sm leading-relaxed text-zinc-400">
        {lleno ? (
          <>
            Ya no quedan sillas. Puedes registrarte igual: entras a la{" "}
            <b className="text-white">lista de espera</b> y el equipo escribe si se libera
            un espacio.
          </>
        ) : (
          <>
            Registrarte no es entrar: el equipo confirma uno por uno y el{" "}
            <b className="text-white">QR llega por correo</b>.
          </>
        )}
      </p>
    </div>
  )
}
