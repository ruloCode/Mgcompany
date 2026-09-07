"use client"

import { motion } from "framer-motion"
import DiagonalArrow from "@/components/diagonal-arrow"
import CuentaRegresiva from "./cuenta-regresiva"
import {
  GALA_CIUDAD,
  GALA_CUPO,
  GALA_FECHA,
  GALA_HORA_FIN_TXT,
  GALA_HORA_INICIO,
  GALA_HORA_INICIO_TXT,
  fechaLarga,
} from "@/lib/gala"

/* Hero de la Gala.
   La foto manda y el texto se apoya abajo, no al lado: en un celular —que es
   por donde llega casi todo el mundo— una imagen a media pantalla con texto
   al lado deja las dos cosas pequeñas. Aquí la imagen es la pantalla entera y
   el texto se lee sobre el negro al que muere el degradado.

   Dos archivos y no uno recortado: la versión vertical está compuesta para
   que el hueco oscuro quede arriba en 9:16, y la horizontal para que quede a
   la izquierda en 16:9. Recortar una sola se come el aire donde va el título.

   El `-mt` cancela el padding que el layout del sitio le da al <main> para el
   header fijo, así la foto sí llega al borde superior de la pantalla. */

export default function HeroGala() {
  const META = [
    { et: "Fecha", va: fechaLarga() },
    { et: "Hora", va: `${GALA_HORA_INICIO_TXT} – ${GALA_HORA_FIN_TXT}` },
    { et: "Dónde", va: `${GALA_CIUDAD} · dirección en el correo` },
    { et: "Cover", va: "Sin costo · solo con registro" },
  ]

  return (
    <header className="relative -mt-16 flex min-h-[100svh] flex-col justify-end overflow-hidden md:-mt-24 md:min-h-[94vh] lg:-mt-28">
      {/* Foto. El zoom lentísimo al entrar es lo único que se mueve aquí:
          basta para que la sala se sienta viva sin pedirle nada al teléfono. */}
      <motion.div
        aria-hidden
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 2.4, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0"
      >
        <picture>
          <source media="(min-width: 768px)" srcSet="/gala/hero-desktop.jpg" />
          <img
            src="/gala/hero-movil.jpg"
            alt=""
            fetchPriority="high"
            className="h-full w-full object-cover object-center"
          />
        </picture>
      </motion.div>

      {/* Velos: uno vertical para que el texto tenga suelo en móvil y otro
          lateral en desktop, donde el título vive a la izquierda. */}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-mg-black via-mg-black/60 to-mg-black/20" />
      <div aria-hidden className="absolute inset-0 hidden md:block md:bg-gradient-to-r md:from-mg-black md:via-mg-black/55 md:to-transparent" />
      <div aria-hidden className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-mg-black/90 to-transparent" />

      <div className="container relative mx-auto px-4 pb-14 pt-28 md:px-6 md:pb-12 md:pt-32 lg:px-10">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center gap-3">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mg-red opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-mg-red" />
              </span>
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.28em] text-mg-red-bright md:text-xs">
                [ Evento privado · Registro abierto ]
              </p>
            </div>

            <h1 className="mt-4 font-heading uppercase leading-[0.84] tracking-tight text-[clamp(4rem,19vw,10rem)]">
              <span className="block">Gala</span>
              <span className="block text-mg-red [text-shadow:0_0_60px_rgba(232,32,12,0.45)]">MG</span>
            </h1>

            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-zinc-200 md:text-[17px]">
              El <b className="font-semibold text-white">primer encuentro presencial</b> de la
              comunidad MG. Una noche, {GALA_CUPO} personas y la escena entera en la misma
              sala: artistas, managers y productores.{" "}
              <b className="font-semibold text-mg-red-bright">Sin cover</b> — pero solo se
              entra con registro confirmado.
            </p>
          </motion.div>

          <div className="mt-8">
            <CuentaRegresiva iso={`${GALA_FECHA}T${GALA_HORA_INICIO}:00-05:00`} sobreFoto />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <a
              href="#registro"
              className="group mt-8 inline-flex min-h-[60px] w-full items-center justify-center gap-4 border-2 border-mg-red bg-mg-red px-8 transition-colors duration-300 hover:bg-transparent hover:text-mg-red-bright sm:w-auto"
            >
              <span className="font-mono text-xs font-medium uppercase tracking-[0.3em] md:text-sm">
                Quiero mi lugar
              </span>
              <DiagonalArrow
                size={22}
                strokeWidth={1.75}
                className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </a>

            <dl className="mt-7 grid gap-x-8 gap-y-2.5 border-t border-white/20 pt-5 font-mono text-[11px] uppercase tracking-wider sm:grid-cols-2">
              {META.map((m) => (
                <div key={m.et} className="flex gap-3">
                  <dt className="w-[52px] shrink-0 text-white/50">{m.et}:</dt>
                  <dd className="text-mg-red-bright">{m.va}</dd>
                </div>
              ))}
            </dl>
          </motion.div>
        </div>
      </div>
    </header>
  )
}
