import type { Metadata } from "next"
import { notFound } from "next/navigation"

import TableroJurado from "@/components/mg1/tablero-jurado"
import { buscarJurado } from "@/lib/mg1-seleccion"
import { MesaNoDisponible, cargarMesa } from "@/lib/mg1-seleccion-datos"

interface Props {
  params: Promise<{ jurado: string }>
}

// Los votos cambian mientras el jurado trabaja: nada que cachear.
export const dynamic = "force-dynamic"

// La pagina es privada: se entra por el enlace o no se entra. No se indexa,
// no se enlaza desde ningun lado del sitio y, ademas, se le pide a los
// buscadores que no sigan lo que haya dentro.
export const metadata: Metadata = {
  title: "MG1 · Mesa del jurado",
  robots: { index: false, follow: false, nocache: true },
}

export default async function SeleccionPage({ params }: Props) {
  const { jurado: slug } = await params

  // Slug desconocido = 404, igual que cualquier ruta que no existe. No se
  // confirma ni se niega que ese jurado exista.
  const jurado = buscarJurado(slug)
  if (!jurado) notFound()

  try {
    const mesa = await cargarMesa(jurado.slug)
    return (
      <TableroJurado
        jurado={jurado}
        fichas={mesa.fichas}
        votosIniciales={mesa.misVotos}
        comentariosIniciales={mesa.comentarios}
        demo={mesa.fuente === "dev"}
      />
    )
  } catch (e) {
    // Una mesa vacia por un fallo de credenciales parece "todavia no hay
    // preseleccionados" y manda al jurado a esperar. Mejor decirlo.
    if (e instanceof MesaNoDisponible) {
      console.error("[mg1/seleccion] mesa no disponible:", e.message)
      return <NoDisponible nombre={jurado.nombre} />
    }
    throw e
  }
}

function NoDisponible({ nombre }: { nombre: string }) {
  return (
    <div className="flex min-h-svh items-center justify-center border-t-8 border-mg-red bg-mg-black px-6 text-white">
      <div className="max-w-md text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-mg-red">
          [ MG1 / Mesa del jurado ]
        </p>
        <h1 className="mt-5 font-heading text-5xl uppercase leading-[0.9]">
          Ya volvemos, {nombre}
        </h1>
        <p className="mt-5 text-sm leading-relaxed text-zinc-400">
          No pudimos cargar las fichas en este momento. No es culpa tuya y tu selección está a salvo:
          nada de lo que hayas marcado se pierde. Escríbenos y lo resolvemos en minutos.
        </p>
        <a
          href="https://wa.me/573150589998?text=Hola%20MG%2C%20no%20me%20carga%20la%20mesa%20del%20jurado%20de%20MG1"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-7 inline-block border border-white/30 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors hover:border-mg-red hover:text-mg-red"
        >
          Avisarle al crew ↗
        </a>
      </div>
    </div>
  )
}
