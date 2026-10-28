import { existsSync } from "fs"
import { join } from "path"
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

import BrandMarquee from "@/components/brand-marquee"
import DiagonalArrow from "@/components/diagonal-arrow"
import ScrollProgress from "@/components/scroll-progress"
import ScrollReveal from "@/components/scroll-reveal"
import SectionHeading from "@/components/section-heading"
import BigStatement from "@/components/mg1/big-statement"
import CuentaRegresiva from "@/components/mg1/cuenta-regresiva"
import HeroDisc from "@/components/mg1/hero-disc"
import Parallax from "@/components/mg1/parallax"
import PopIn from "@/components/mg1/pop-in"
import SalaVotacion from "@/components/mg1/sala-votacion"
import { CONTENIDO_EVENTOS } from "@/lib/eventos"
import {
  FINALISTAS,
  MG1_FIESTA,
  MG1_VOTACION_ABRE,
  MG1_VOTACION_CIERRA,
  estadoVentana,
  fechaLargaVotacion,
  horaVotacion,
  type EstadoVentana,
} from "@/lib/mg1-votacion"

/* La votación del público de MG1.

   Se lee en cada visita: el estado (antes / abierta / cerrada) lo decide el
   reloj del servidor, y al cerrar la página deja de mostrar a los finalistas
   y el formulario sin que nadie tenga que desplegar nada.

   Lo que esta página NO muestra nunca, en ningún estado: cuántos votos hay,
   quién va adelante, ni el resultado. Eso vive solo en /admin/votacion. */
export const dynamic = "force-dynamic"

const hl = "text-white"

const OG_TITLE = "Final MG1 · Tú coronas al campeón"
const OG_DESCRIPTION =
  "Escucha a los finalistas de MG1 y vota por quién se lleva el Disco Ruby. Un correo, un voto. Cierra el viernes 30 de octubre a las 8:00 p.m."

export function generateMetadata(): Metadata {
  const propia = "/og/og-mg1-votacion.jpg"
  const og = existsSync(join(process.cwd(), "public", propia)) ? propia : "/og/og-mg1-jurado.jpg"
  return {
    title: "Vota en la final de MG1 | MG Company Group",
    description: OG_DESCRIPTION,
    alternates: { canonical: "/mg1/votacion" },
    openGraph: {
      type: "website",
      locale: "es_CO",
      siteName: "MG Company Group",
      url: "/mg1/votacion",
      title: OG_TITLE,
      description: OG_DESCRIPTION,
      images: [{ url: og, width: 1200, height: 630, alt: "Final MG1 — votación del público" }],
    },
    twitter: { card: "summary_large_image", title: OG_TITLE, description: OG_DESCRIPTION, images: [og] },
  }
}

const MARQUEE = ["Tú coronas", "La final", "Disco Ruby", "Un correo, un voto", "#ConcursoMG1", "MG Company"]

const PASOS = [
  { num: "01", titulo: "Escucha", desc: "Dale play a cada disco. Suena una canción a la vez: la que elijas." },
  { num: "02", titulo: "Vota", desc: "Elige a tu finalista y deja tu correo. Un correo es un voto." },
  { num: "03", titulo: "Confirma", desc: "Abre el enlace que te llega al correo. Sin ese toque, el voto no cuenta." },
]

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ""

export default async function VotacionPage({ searchParams }: Props) {
  const sp = await searchParams
  const ahora = new Date().toISOString()

  // En desarrollo, ?ventana=antes|abierta|cerrada fuerza la vista para poder
  // revisar los tres estados. Solo la vista: la API y la base siguen mirando
  // la hora real.
  const forzada = uno(sp.ventana)
  const ventana: EstadoVentana =
    process.env.NODE_ENV !== "production" && ["antes", "abierta", "cerrada"].includes(forzada)
      ? (forzada as EstadoVentana)
      : estadoVentana(ahora)

  const utm = {
    utm_source: uno(sp.utm_source).slice(0, 60) || undefined,
    utm_medium: uno(sp.utm_medium).slice(0, 60) || undefined,
    utm_campaign: uno(sp.utm_campaign).slice(0, 60) || undefined,
  }

  const fiesta = CONTENIDO_EVENTOS["coronacion-mg1"]

  return (
    <div className="overflow-x-clip bg-mg-black text-white">
      <ScrollProgress />

      {/* Hero */}
      <header className="relative flex min-h-svh items-center overflow-hidden border-t-8 border-mg-red">
        {/* Los surcos de fondo: lo que nunca deja de moverse. */}
        <div aria-hidden className="pointer-events-none absolute -right-[30vmax] top-1/2 h-[90vmax] w-[90vmax] -translate-y-1/2 opacity-[0.07]">
          <div
            className="mg1-anim h-full w-full rounded-full"
            style={{
              background: "repeating-radial-gradient(circle, #E8200C 0 1px, transparent 1px 14px)",
              animation: "mg1-spin 60s linear infinite",
            }}
          />
        </div>

        <div className="container relative mx-auto grid grid-cols-12 items-center gap-x-4 gap-y-12 px-4 py-16 md:px-6 md:py-20 lg:gap-x-10 lg:px-10">
          <div className="col-span-12 lg:col-span-7">
            <Parallax from={0} to={-70}>
              <ScrollReveal direction="up">
                <div className="flex items-center gap-3">
                  <span className="text-xl leading-none text-mg-red">&#10022;</span>
                  <span className="font-mono text-xs font-medium uppercase tracking-[0.3em] text-mg-red-bright">
                    [ MG1 · La final · Votación del público ]
                  </span>
                  <span className="h-px flex-1 bg-mg-red/40" />
                </div>

                {ventana === "cerrada" ? (
                  <h1 className="mt-6 font-heading uppercase leading-[0.9] tracking-tight text-[clamp(2.75rem,8.5vw,7rem)]">
                    <span className="block text-stroke">La votación</span>
                    <span className="block text-mg-red">cerró.</span>
                    <span className="block">El campeón se</span>
                    <span className="block">corona en vivo.</span>
                  </h1>
                ) : (
                  <h1 className="mt-6 font-heading uppercase leading-[0.9] tracking-tight text-[clamp(2.75rem,8.5vw,7rem)]">
                    <span className="block text-stroke">Un disco.</span>
                    <span className="block">Un campeón.</span>
                    <span className="block text-mg-red">Tú lo coronas.</span>
                  </h1>
                )}

                <p className="mt-6 max-w-xl text-base leading-relaxed text-zinc-300 md:text-lg">
                  {ventana === "cerrada" ? (
                    <>
                      Gracias por votar. El resultado es <b className={hl}>secreto hasta la coronación</b>: se
                      anuncia en vivo en <b className={hl}>{MG1_FIESTA.nombre}</b>, la misma noche del cierre.
                    </>
                  ) : (
                    <>
                      Cuatro capítulos, un beat y muchas canciones después, quedan los{" "}
                      <b className={hl}>{FINALISTAS.length} finalistas</b> de{" "}
                      <b className={hl}>MG1</b>. El jurado ya habló; ahora decide <b className={hl}>el público</b>:
                      quien gane se lleva el <b className={hl}>Disco Ruby</b> y{" "}
                      <b className={hl}>$10.000.000 en producción</b> para su carrera.
                    </>
                  )}
                </p>

                {ventana === "abierta" ? (
                  <a
                    href="#finalistas"
                    className="group mt-9 inline-flex items-center gap-4 border-2 border-mg-red bg-mg-red px-6 py-4 transition-colors duration-300 hover:bg-transparent hover:text-mg-red-bright md:px-8 md:py-5"
                  >
                    <span className="font-mono text-xs font-medium uppercase tracking-[0.3em] md:text-sm">
                      Escuchar y votar
                    </span>
                    <DiagonalArrow size={24} strokeWidth={1.75} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                ) : (
                  <Link
                    href={MG1_FIESTA.url}
                    className="group mt-9 inline-flex items-center gap-4 border-2 border-mg-red bg-mg-red px-6 py-4 transition-colors duration-300 hover:bg-transparent hover:text-mg-red-bright md:px-8 md:py-5"
                  >
                    <span className="font-mono text-xs font-medium uppercase tracking-[0.3em] md:text-sm">
                      Entrar a la lista de {MG1_FIESTA.nombre}
                    </span>
                    <DiagonalArrow size={24} strokeWidth={1.75} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                )}

                {ventana !== "cerrada" ? (
                  <div className="mt-10 border-l-4 border-mg-red pl-5">
                    <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-400">
                      {ventana === "antes"
                        ? `La votación abre el ${fechaLargaVotacion(MG1_VOTACION_ABRE).toLowerCase()}, ${horaVotacion(MG1_VOTACION_ABRE)}`
                        : `Cierra el ${fechaLargaVotacion(MG1_VOTACION_CIERRA).toLowerCase()}, ${horaVotacion(MG1_VOTACION_CIERRA)}`}
                    </p>
                    <CuentaRegresiva hasta={ventana === "antes" ? MG1_VOTACION_ABRE : MG1_VOTACION_CIERRA} ahora={ahora} />
                  </div>
                ) : null}
              </ScrollReveal>
            </Parallax>
          </div>

          <div className="col-span-12 mx-auto w-full max-w-sm lg:col-span-5 lg:max-w-md">
            <ScrollReveal direction="up" delay={0.15}>
              <Parallax from={0} to={60}>
                <HeroDisc />
                <p className="mt-6 text-center font-mono text-xs uppercase tracking-[0.2em] text-zinc-400">
                  El Disco Ruby · solo existe uno
                </p>
              </Parallax>
            </ScrollReveal>
          </div>
        </div>
      </header>

      <BrandMarquee items={MARQUEE} variant="red" />

      {ventana === "abierta" ? (
        <>
          {/* 01 · Cómo se vota */}
          <section className="container mx-auto px-4 py-16 md:px-6 md:py-24 lg:px-10">
            <ScrollReveal direction="up" className="[&_.font-mono]:text-mg-red-bright">
              <SectionHeading
                index="01"
                kicker="Cómo se vota"
                title="Escucha. Vota. Confirma."
                subtitle={
                  <>
                    Tarda menos de un minuto. El conteo es <b className={hl}>secreto</b>: no se publica en
                    ningún lado, ni siquiera al cierre. El campeón se conoce en vivo.
                  </>
                }
              />
            </ScrollReveal>

            <div className="mt-12 grid gap-6 md:mt-16 md:grid-cols-3">
              {PASOS.map((p, i) => (
                <ScrollReveal key={p.num} direction="up" delay={i * 0.08}>
                  <div className="h-full border-t-4 border-mg-red bg-white/[0.03] p-6 transition-transform duration-300 hover:-translate-y-1">
                    <PopIn delay={i * 0.08 + 0.15} rotate={-90}>
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-mg-red font-heading text-xl">
                        {p.num}
                      </span>
                    </PopIn>
                    <h3 className="mt-5 font-heading text-2xl uppercase tracking-wide">{p.titulo}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-zinc-300">{p.desc}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </section>

          <BrandMarquee items={MARQUEE} variant="outline" />

          {/* 02 · Los finalistas */}
          <section id="finalistas" className="container mx-auto scroll-mt-4 px-4 py-16 md:px-6 md:py-24 lg:px-10">
            <ScrollReveal direction="up" className="[&_.font-mono]:text-mg-red-bright">
              <SectionHeading
                index="02"
                kicker="Los finalistas"
                title="Pon a girar su disco"
                subtitle={
                  <>
                    Toca un disco para escuchar su canción final. Cuando tengas a tu finalista, vota{" "}
                    <b className={hl}>al final de la página</b>.
                  </>
                }
              />
            </ScrollReveal>

            <div className="mt-14 md:mt-20">
              <SalaVotacion finalistas={FINALISTAS} utm={utm} />
            </div>
          </section>
        </>
      ) : ventana === "antes" ? (
        <section className="container mx-auto px-4 py-20 text-center md:px-6 md:py-28 lg:px-10">
          <BigStatement text="Los finalistas se revelan" accent="con el capítulo 3." accentEnBloque />
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-zinc-300">
            Míralo en YouTube y vuelve aquí: la votación abre en cuanto se estrena.
          </p>
        </section>
      ) : (
        <section className="container mx-auto px-4 py-20 text-center md:px-6 md:py-28 lg:px-10">
          <BigStatement text="Gracias por" accent="coronar con nosotros." accentEnBloque />
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-zinc-300">
            Los votos se contaron en privado. Nadie los vio en esta página, y nadie los va a ver aquí.
          </p>

          {/* Solo los nombres, en el orden de siempre: nada que insinúe quién va adelante. */}
          <p className="mt-14 font-mono text-xs font-medium uppercase tracking-[0.3em] text-mg-red-bright">
            [ Uno de los {FINALISTAS.length} se corona esta noche ]
          </p>
          <ul className="mx-auto mt-6 grid max-w-4xl grid-cols-2 gap-3 md:grid-cols-4">
            {FINALISTAS.map((f, i) => (
              <PopIn key={f.slug} delay={i * 0.06}>
                <li className="h-full border-t-4 border-mg-red bg-white/[0.03] px-4 py-5 text-left">
                  <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500">
                    Finalista {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="mt-1 block font-heading text-2xl uppercase leading-none tracking-wide md:text-3xl">
                    {f.nombre}
                  </span>
                  <span className="mt-1 block truncate text-xs text-zinc-400">«{f.cancion}»</span>
                </li>
              </PopIn>
            ))}
          </ul>
        </section>
      )}

      {/* La fiesta */}
      <section className="bg-mg-red">
        <div className="container mx-auto grid items-center gap-10 px-4 py-16 md:px-6 md:py-24 lg:grid-cols-12 lg:px-10">
          <div className="lg:col-span-8">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.3em] text-white/80">
              [ La invitación ]
            </p>
            <h2 className="mt-4 font-heading uppercase leading-[0.9] text-[clamp(3rem,10vw,7.5rem)]">
              {MG1_FIESTA.nombre}
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed md:text-lg">
              La votación cierra a las <b>8:00 p.m.</b> y esa misma noche se corona al campeón, en vivo y con la
              gente que lo vio nacer. Víspera de Halloween: ven disfrazado.
            </p>
            <ul className="mt-6 flex flex-wrap gap-3">
              {[MG1_FIESTA.cuando, MG1_FIESTA.donde, "Entrada gratis con registro"].map((chip, i) => (
                <PopIn key={chip} delay={i * 0.06}>
                  <li className="border border-white/40 bg-black/25 px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.15em] md:text-xs">
                    {chip}
                  </li>
                </PopIn>
              ))}
            </ul>
            <Link
              href={MG1_FIESTA.url}
              className="group mt-9 inline-flex items-center gap-4 border-2 border-white bg-white px-6 py-4 text-mg-black transition-colors duration-300 hover:bg-transparent hover:text-white md:px-8 md:py-5"
            >
              <span className="font-mono text-xs font-bold uppercase tracking-[0.3em] md:text-sm">Quiero estar en la lista</span>
              <DiagonalArrow size={24} strokeWidth={1.75} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>

          {fiesta?.destacado ? (
            <div className="lg:col-span-4">
              <ScrollReveal direction="up">
                <div className="border-2 border-white p-6 text-center md:p-8">
                  <p className="font-heading text-[clamp(2.5rem,7vw,4.5rem)] leading-none">{fiesta.destacado.valor}</p>
                  <p className="mt-2 font-mono text-xs font-bold uppercase tracking-[0.2em]">{fiesta.destacado.texto}</p>
                </div>
              </ScrollReveal>
            </div>
          ) : null}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-4 px-4 py-8 md:px-6 lg:px-10">
          <Link href="/" className="flex items-center gap-4 transition-opacity hover:opacity-70">
            <Image src="/logo-mg.png" alt="MG Company Group" width={36} height={36} className="h-9 w-9" />
            <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-400 md:text-xs">
              Concurso MG1 · La final · Bogotá
            </span>
          </Link>
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-mg-red-bright md:text-xs">#ConcursoMG1</span>
        </div>
      </footer>
    </div>
  )
}
