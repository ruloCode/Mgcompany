import type { Metadata } from "next"
import Link from "next/link"

import DiagonalArrow from "@/components/diagonal-arrow"
import ConfirmarVoto from "@/components/mg1/confirmar-voto"
import { MG1_FIESTA, buscarFinalista, confirmarVotoSchema } from "@/lib/mg1-votacion"
import { VotacionNoDisponible, verEnlace, type VistaEnlace } from "@/lib/mg1-votacion-datos"

/* Aterrizaje del enlace del correo. Abrirla NO confirma nada (ver el
   componente ConfirmarVoto): muestra a quién se va a confirmar y espera el
   toque. Tampoco dice, en ningún caso, cómo va la votación. */

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Confirma tu voto · Final MG1",
  // Cada enlace es personal: no tiene nada que hacer en un buscador.
  robots: { index: false, follow: false },
}

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function ConfirmarVotoPage({ searchParams }: Props) {
  const sp = await searchParams
  const t = Array.isArray(sp.t) ? sp.t[0] : sp.t
  const valido = confirmarVotoSchema.safeParse({ t })

  let vista: VistaEnlace | "sin_servicio" = { estado: "invalido" }
  if (valido.success) {
    try {
      vista = await verEnlace(valido.data.t)
    } catch (e) {
      console.error("[mg1/votacion/confirmar] no se pudo leer el enlace:", e instanceof VotacionNoDisponible ? e.message : e)
      vista = "sin_servicio"
    }
  }

  const finalista =
    vista !== "sin_servicio" && (vista.estado === "pendiente" || vista.estado === "ya_confirmado")
      ? buscarFinalista(vista.finalista)
      : null

  return (
    <div className="flex min-h-svh flex-col overflow-x-clip border-t-8 border-mg-red bg-mg-black text-white">
      <main className="container mx-auto flex flex-1 items-center px-4 py-16 md:px-6 lg:px-10">
        {vista !== "sin_servicio" && finalista && valido.success ? (
          <ConfirmarVoto
            token={valido.data.t}
            finalista={finalista}
            // Un segundo clic sobre el mismo correo se pinta como confirmado.
            yaConfirmado={vista.estado === "ya_confirmado"}
          />
        ) : (
          <div className="max-w-2xl">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.3em] text-mg-red-bright">[ Final MG1 ]</p>
            <h1 className="mt-4 font-heading text-5xl uppercase leading-[0.9] md:text-7xl">
              {vista === "sin_servicio"
                ? "Danos un momento"
                : vista.estado === "vencido"
                  ? "Este enlace venció"
                  : "Este enlace no sirve"}
            </h1>
            <p className="mt-5 text-base leading-relaxed text-zinc-300">
              {vista === "sin_servicio"
                ? "No pudimos revisar tu enlace ahora mismo. Vuelve a abrirlo desde el correo en unos minutos."
                : "Puede que hayas pedido otro correo después de este, o que el enlace esté incompleto. Usa el correo más reciente o vuelve a votar."}
            </p>
            <Link
              href="/mg1/votacion#votar"
              className="group mt-8 inline-flex items-center gap-4 border-2 border-mg-red bg-mg-red px-6 py-4 transition-colors hover:bg-transparent"
            >
              <span className="font-mono text-xs font-bold uppercase tracking-[0.25em]">Ir a votar</span>
              <DiagonalArrow size={20} strokeWidth={1.75} />
            </Link>
          </div>
        )}
      </main>

      <Link
        href={MG1_FIESTA.url}
        className="group block bg-mg-red transition-colors hover:bg-mg-red/90"
      >
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-4 px-4 py-6 md:px-6 lg:px-10">
          <div>
            <p className="font-heading text-3xl uppercase leading-none md:text-4xl">👑 {MG1_FIESTA.nombre}</p>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-white/85">
              {MG1_FIESTA.cuando} · {MG1_FIESTA.donde}
            </p>
          </div>
          <span className="inline-flex items-center gap-3 font-mono text-xs font-bold uppercase tracking-[0.2em]">
            Quiero estar en la lista
            <DiagonalArrow size={20} strokeWidth={1.75} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </Link>
    </div>
  )
}
