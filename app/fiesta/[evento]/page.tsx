import { existsSync } from "fs"
import { join } from "path"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import RegistroEvento from "@/components/eventos/registro-evento"
import {
  CONTENIDO_EVENTOS,
  GENEROS_EN_VIVO,
  LEYENDA_ALCOHOL,
  barajar,
  fechaEvento,
  horaEvento,
} from "@/lib/eventos"
import { EventosNoDisponible, cargarEvento, type Evento } from "@/lib/eventos-datos"

// Lee el evento en cada visita (si el registro cierra, se nota al instante) y
// baraja los géneros para cada persona.
export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ evento: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ""

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { evento } = await params
  const contenido = CONTENIDO_EVENTOS[evento]
  if (!contenido) return { title: "MG Company Group" }

  const propia = `/og/og-fiesta-${evento}.jpg`
  const og = existsSync(join(process.cwd(), "public", propia)) ? propia : "/og/og-mg1-jurado.jpg"
  const titulo = `${contenido.titular} · MG Company`

  return {
    title: titulo,
    description: contenido.bajada,
    // Lista privada: circula por enlace, no por buscador.
    robots: { index: false, follow: false },
    openGraph: {
      type: "website", locale: "es_CO", siteName: "MG Company Group",
      title: titulo, description: contenido.bajada,
      images: [{ url: og, width: 1200, height: 630, alt: contenido.titular }],
    },
    twitter: { card: "summary_large_image", title: titulo, description: contenido.bajada, images: [og] },
  }
}

export default async function FiestaPage({ params, searchParams }: Props) {
  const { evento: slug } = await params
  const sp = await searchParams
  const contenido = CONTENIDO_EVENTOS[slug]
  if (!contenido) notFound()

  let evento: Evento | null
  try {
    evento = await cargarEvento(slug)
  } catch (e) {
    if (e instanceof EventosNoDisponible) return <Aviso titulo="Ya volvemos" texto="El registro no está disponible en este momento. Intenta en unos minutos." />
    throw e
  }
  if (!evento) notFound()

  const cerrado = Date.now() > new Date(evento.registro_cierra).getTime()

  const datos = [
    { k: "Cuándo", v: fechaEvento(evento.fecha) },
    { k: "Puertas", v: `Desde las ${horaEvento(evento.hora_puertas)}` },
    { k: "Dónde", v: `${evento.lugar} · ${evento.ciudad}` },
    { k: "Entrada", v: "Gratis, con tu QR" },
  ]

  return (
    <div className="min-h-svh overflow-x-clip bg-mg-black text-white">
      <header className="border-t-8 border-mg-red">
        <div className="container mx-auto px-4 pb-10 pt-12 md:px-6 md:pb-14 md:pt-20 lg:px-10">
          <div className="mb-6 flex items-center gap-3">
            <span className="whitespace-nowrap font-mono text-[11px] font-medium uppercase tracking-[0.25em] text-mg-red">
              [ {contenido.etiqueta} ]
            </span>
            <span className="h-px flex-1 bg-mg-red/40" />
            <span className="hidden font-mono text-[11px] uppercase tracking-[0.25em] text-white/40 md:block">Lista privada</span>
          </div>

          <h1 className="font-heading uppercase leading-[0.82] tracking-tight text-[clamp(4rem,17vw,11rem)]">
            {contenido.titular}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-zinc-300 md:text-lg">{contenido.bajada}</p>

          <dl className="mt-10 grid grid-cols-2 border-y border-white/10 md:grid-cols-4">
            {datos.map((d, i) => (
              <div key={d.k} className={`py-4 ${i % 2 ? "pl-4" : "pr-4"} md:px-0 md:pr-6`}>
                <dt className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">{d.k}</dt>
                <dd className="mt-1.5 font-heading text-2xl uppercase leading-tight md:text-3xl">{d.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <main className="container mx-auto grid gap-12 px-4 pb-24 md:px-6 lg:grid-cols-12 lg:gap-16 lg:px-10">
        <section className="lg:col-span-7">
          {cerrado ? (
            <div className="border-2 border-white/15 p-6">
              <h2 className="font-heading text-4xl uppercase">El registro cerró</h2>
              <p className="mt-3 text-zinc-400">Si ya te registraste, tu QR sigue en tu correo.</p>
            </div>
          ) : (
            <RegistroEvento
              evento={slug}
              fechaEvento={evento.fecha}
              generos={barajar(GENEROS_EN_VIVO)}
              refInicial={uno(sp.ref).slice(0, 12)}
              textoCompartir={contenido.compartir}
              utm={{
                utm_source: uno(sp.utm_source).slice(0, 60),
                utm_medium: uno(sp.utm_medium).slice(0, 60),
                utm_campaign: uno(sp.utm_campaign).slice(0, 60),
              }}
            />
          )}
        </section>

        {contenido.concurso ? (
          // En celular va ANTES del formulario: es el gancho para registrarse,
          // y debajo del botón de enviar casi nadie llega a leerla.
          <aside className="order-first lg:order-none lg:col-span-5">
            <div className="border-2 border-mg-red p-6 md:p-8 lg:sticky lg:top-8">
              <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-mg-red-bright">🍾 La dinámica</p>
              <h2 className="mt-3 font-heading text-4xl uppercase leading-[0.9] md:text-5xl">{contenido.concurso.titulo}</h2>
              <ol className="mt-6 space-y-4">
                {contenido.concurso.reglas.map((r, i) => (
                  <li key={i} className="flex gap-3 text-sm leading-relaxed text-zinc-300">
                    <span className="font-mono text-xs text-mg-red-bright">{String(i + 1).padStart(2, "0")}</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ol>
            </div>
          </aside>
        ) : null}
      </main>

      <footer className="border-t border-white/10">
        <div className="container mx-auto px-4 py-8 md:px-6 lg:px-10">
          <p className="max-w-3xl text-xs leading-relaxed text-zinc-500">{LEYENDA_ALCOHOL}</p>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600">MG Company Group · Bogotá</p>
        </div>
      </footer>
    </div>
  )
}

function Aviso({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="flex min-h-svh items-center justify-center border-t-8 border-mg-red bg-mg-black px-6 text-center text-white">
      <div className="max-w-md">
        <h1 className="font-heading text-5xl uppercase">{titulo}</h1>
        <p className="mt-4 text-zinc-400">{texto}</p>
      </div>
    </div>
  )
}
