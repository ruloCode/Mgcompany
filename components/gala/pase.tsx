"use client"

import { QRCodeSVG } from "qrcode.react"
import { motion } from "framer-motion"
import {
  GALA_CIUDAD,
  GALA_HORA_FIN_TXT,
  GALA_HORA_INICIO_TXT,
  etiquetaTipo,
  fechaLarga,
} from "@/lib/gala"

/* El pase de entrada.
   El QR codifica la URL de esta misma página, no un identificador suelto: en
   la puerta se escanea con la cámara de cualquier celular y lo que abre es
   esta ficha, con la foto del estado en el momento de mirarla. Un pase
   revocado deja de servir sin tener que reemitir nada.

   Fondo blanco bajo el QR a propósito: los lectores necesitan contraste claro
   y un QR rojo sobre negro falla en la mitad de los teléfonos. */

export interface DatosPase {
  codigo: string
  nombre_completo: string
  nombre_artistico: string | null
  tipo_asistente: string
  ingreso_at: string | null
}

export default function Pase({ pase, url }: { pase: DatosPase; url: string }) {
  const ingresado = Boolean(pase.ingreso_at)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto w-full max-w-sm border-t-4 border-mg-red bg-[#161616]"
    >
      <div className="px-6 pt-6 text-center">
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.3em] text-mg-red-bright">
          [ Pase de entrada ]
        </p>
        <h1 className="mt-3 font-heading text-4xl uppercase leading-none tracking-wide">
          Gala MG
        </h1>
        <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-400">
          {fechaLarga()} · {GALA_HORA_INICIO_TXT}–{GALA_HORA_FIN_TXT} · {GALA_CIUDAD}
        </p>
      </div>

      <div className="mt-6 px-6">
        <div className="mx-auto flex aspect-square w-full max-w-[260px] items-center justify-center bg-white p-4">
          <QRCodeSVG
            value={url}
            level="M"
            marginSize={0}
            className="h-full w-full"
            title={`Pase ${pase.codigo} de la Gala MG`}
          />
        </div>
        <p className="mt-4 text-center font-mono text-lg tracking-[0.3em] text-white">
          {pase.codigo}
        </p>
      </div>

      {/* Troquel: la muesca de un tiquete de verdad */}
      <div aria-hidden className="relative mt-6 h-6">
        <span className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-mg-black" />
        <span className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-mg-black" />
        <span className="absolute inset-x-6 top-1/2 border-t border-dashed border-white/20" />
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 px-6 pb-6 font-mono text-[11px] uppercase tracking-wider">
        <dt className="text-white/45">Nombre:</dt>
        <dd className="text-white">{pase.nombre_completo}</dd>
        {pase.nombre_artistico && (
          <>
            <dt className="text-white/45">Artista:</dt>
            <dd className="text-mg-red-bright">{pase.nombre_artistico}</dd>
          </>
        )}
        <dt className="text-white/45">Perfil:</dt>
        <dd className="text-white">{etiquetaTipo(pase.tipo_asistente)}</dd>
        <dt className="text-white/45">Estado:</dt>
        <dd className={ingresado ? "text-zinc-400" : "text-mg-red-bright"}>
          {ingresado ? "Ingreso ya registrado" : "Confirmado · válido"}
        </dd>
      </dl>

      <p className="border-t border-white/10 px-6 py-4 text-center text-[11px] leading-relaxed text-zinc-500">
        Único e intransferible. Preséntalo en la puerta.
        <br />
        MG Company se reserva el derecho de admisión y permanencia.
      </p>
    </motion.div>
  )
}
