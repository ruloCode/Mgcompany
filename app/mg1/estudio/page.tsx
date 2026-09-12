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
import SpecMeta from "@/components/spec-meta"
import BigStatement from "@/components/mg1/big-statement"
import HeroDisc from "@/components/mg1/hero-disc"
import MetricRow from "@/components/mg1/metric-row"
import Parallax from "@/components/mg1/parallax"
import PopIn from "@/components/mg1/pop-in"

const OG_TITLE = "MG1 se graba en un estudio. Puede ser el tuyo."
const OG_DESCRIPTION =
  "Buscamos el estudio audiovisual donde se grabará el reality MG1: dos jornadas entre el 24 y el 30 de septiembre. Propuesta de asociación."

export function generateMetadata(): Metadata {
  const custom = "/og/og-mg1-estudio.jpg"
  const ogImage = existsSync(join(process.cwd(), "public", custom))
    ? custom
    : "/og/og-mg1-jurado.jpg"

  return {
    title: "MG1 · El set | MG Company Group",
    description: OG_DESCRIPTION,
    // Propuesta de asociación: se comparte por enlace, no se indexa.
    robots: { index: false, follow: false },
    openGraph: {
      type: "website",
      locale: "es_CO",
      siteName: "MG Company Group",
      title: OG_TITLE,
      description: OG_DESCRIPTION,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: "MG1 — propuesta de asociación para estudios audiovisuales de Bogotá",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: OG_TITLE,
      description: OG_DESCRIPTION,
      images: [ogImage],
    },
  }
}

const hl = "text-mg-red-bright font-semibold"

const WA = "573150589998"
const CORREO = "oficialmgmusic@gmail.com"
const waUrl = (texto: string) => `https://wa.me/${WA}?text=${encodeURIComponent(texto)}`

const HERO_META = [
  { label: "Formato:", value: "4 capítulos · YouTube" },
  { label: "Rodaje:", value: "2 jornadas de 6 a 10 h" },
  { label: "Ciudad:", value: "Bogotá" },
]

const MARQUEE_ITEMS = [
  "AQUÍ NO SE IMPROVISA, AQUÍ SE ESCRIBE",
  "CONCURSO MG1",
  "EL SET",
  "PRIMERA EDICIÓN · BOGOTÁ",
]

const METRICAS: {
  concepto: React.ReactNode
  value: number
  decimals?: number
  suffix?: string
}[] = [
  {
    concepto: (
      <>
        Vistas orgánicas del contenido MG1 en las últimas{" "}
        <b className={hl}>cinco semanas</b> de campaña
      </>
    ),
    value: 47_600,
    suffix: "+",
  },
  {
    concepto: <>Veces que la gente compartió nuestro contenido en los últimos 14 días</>,
    value: 906,
  },
  {
    concepto: (
      <>
        De las interacciones vienen de <b className={hl}>Bogotá y Soacha</b> — la ciudad
        donde está tu estudio y tus clientes
      </>
    ),
    value: 65.6,
    decimals: 1,
    suffix: "%",
  },
  {
    concepto: (
      <>
        De la audiencia tiene entre <b className={hl}>18 y 34 años</b> — la generación que
        está grabando su primer EP y su primer video
      </>
    ),
    value: 83,
    suffix: "%",
  },
  {
    concepto: (
      <>
        Artistas se inscribieron a la convocatoria de la primera edición — cada uno,{" "}
        <b className={hl}>un cliente potencial de estudio</b> que ahora conoce el show
      </>
    ),
    value: 62,
    suffix: "+",
  },
  {
    concepto: (
      <>
        Seguidores combinados de los <b className={hl}>tres jurados</b> que estarán
        grabando dentro de tu estudio
      </>
    ),
    value: 285_000,
    suffix: "+",
  },
]

const BENEFICIOS: { title: string; desc: React.ReactNode }[] = [
  {
    title: "Set oficial del reality",
    desc: (
      <>
        Tu estudio en pantalla en <b className={hl}>los cuatro capítulos completos</b>, con
        crédito como set oficial en cada uno y mención en la descripción de los videos.
        Contenido que no caduca: queda publicado en YouTube de forma permanente.
      </>
    ),
  },
  {
    title: "Visibilidad frente a tu cliente ideal",
    desc: (
      <>
        La audiencia de MG1 son{" "}
        <b className={hl}>artistas que necesitan exactamente lo que tú vendes</b>: un
        espacio profesional para grabar su música y su imagen. Es publicidad puesta frente
        al público correcto, no frente a cualquiera.
      </>
    ),
  },
  {
    title: "Contenido hecho para tus redes",
    desc: (
      <>
        Nuestro equipo audiovisual te entrega un <b className={hl}>paquete propio</b>:
        fotos profesionales de tu estudio en plena producción, video del espacio
        funcionando y <b className={hl}>un comercial editado a tu medida</b>. Trabajo real
        de producción, como parte del acuerdo.
      </>
    ),
  },
  {
    title: "Los jurados publican desde tu casa",
    desc: (
      <>
        Queens Tafari, Jony Roy y Miguelacho TF —{" "}
        <b className={hl}>más de 285.000 seguidores combinados</b> — generan contenido
        durante el rodaje: historias, detrás de cámaras y publicaciones en colaboración
        donde tu estudio aparece etiquetado.
      </>
    ),
  },
  {
    title: "Etiquetado en toda la campaña",
    desc: (
      <>
        Durante el mes y medio de campaña, el contenido del show{" "}
        <b className={hl}>menciona y etiqueta al estudio</b>: anuncio del rodaje, detrás de
        cámaras, estrenos semanales y piezas de expectativa.
      </>
    ),
  },
  {
    title: "Una relación, no un favor",
    desc: (
      <>
        MG produce música, video y eventos para artistas todo el año. El estudio que sea
        nuestra casa en la primera edición es{" "}
        <b className={hl}>el primer llamado para lo que viene</b>: temporada 2, sesiones
        con artistas y producciones de clientes.
      </>
    ),
  },
]

const PEDIMOS: React.ReactNode[] = [
  <>
    <b className="text-white">Dos jornadas completas de estudio</b> entre el jueves 24 y
    el miércoles 30 de septiembre — idealmente días seguidos.
  </>,
  <>
    <b className="text-white">Jornadas de entre 6 y 10 horas:</b> grabamos dos capítulos
    por día, con dinámicas distintas por bloque.
  </>,
  <>
    <b className="text-white">Un espacio con luces y ciclorama</b> (o fondo equivalente)
    con capacidad para la mesa de jurados, los concursantes y nuestro equipo.
  </>,
  <>
    <b className="text-white">Permiso de uso de imagen del espacio</b> en los capítulos y
    el contenido de campaña.
  </>,
  <>
    <b className="text-white">Una conversación</b> para armar el modelo del acuerdo — al
    lado te contamos cómo lo vemos.
  </>,
]

const MODELOS: { title: string; desc: React.ReactNode }[] = [
  {
    title: "Asociación por visibilidad",
    desc: (
      <>
        El estudio pone el espacio; MG pone la exposición completa: capítulos, campaña,
        jurados y el paquete de contenido para tus redes.
      </>
    ),
  },
  {
    title: "Intercambio de producción",
    desc: (
      <>
        Además del rodaje, nuestro equipo produce piezas para el estudio — comerciales,
        fotos, video institucional — como pago en trabajo.
      </>
    ),
  },
  {
    title: "Tarifa especial + alianza",
    desc: (
      <>
        Un acuerdo económico preferencial que abre la relación de largo plazo: estudio
        aliado de MG para la temporada 2 y las producciones de nuestros artistas.
      </>
    ),
  },
]

export default function MG1EstudioPage() {
  return (
    <div className="overflow-x-clip bg-mg-black text-white">
      <ScrollProgress />

      {/* Hero */}
      <header className="relative flex min-h-svh items-center overflow-hidden border-t-8 border-mg-red">
        <div className="container mx-auto grid grid-cols-12 items-center gap-x-4 gap-y-12 px-4 py-16 md:px-6 md:py-20 lg:gap-x-10 lg:px-10">
          <div className="col-span-12 lg:col-span-7">
            <Parallax from={0} to={-70}>
              <ScrollReveal direction="up">
                <div className="flex items-center gap-3">
                  <span className="text-xl leading-none text-mg-red">&#10022;</span>
                  <span className="font-mono text-[10px] font-medium uppercase tracking-[0.3em] text-mg-red-bright md:text-xs">
                    [ MG Company · Propuesta de asociación · Bogotá ]
                  </span>
                  <span className="h-px flex-1 bg-mg-red/40" />
                </div>

                <h1 className="mt-6 font-heading uppercase leading-[0.9] tracking-tight text-[clamp(2.75rem,8.5vw,6.5rem)]">
                  <span className="block text-stroke">MG1 se graba</span>
                  <span className="block">en un estudio.</span>
                  <span className="block text-mg-red">Puede ser el tuyo.</span>
                </h1>

                <p className="mt-6 max-w-xl text-base leading-relaxed text-zinc-300 md:text-lg">
                  Buscamos el estudio audiovisual que será el set del{" "}
                  <b className={hl}>primer reality musical</b> de la escena urbana
                  bogotana — dos jornadas de rodaje y{" "}
                  <b className={hl}>cuatro capítulos que quedan publicados para siempre</b>.
                </p>

                <PopIn delay={0.2} rotate={-2}>
                  <div className="mt-8 inline-block border-2 border-mg-red bg-mg-red px-5 py-4">
                    <p className="font-heading text-2xl uppercase leading-none tracking-wide">
                      2 días de rodaje
                    </p>
                    <p className="mt-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-white/80">
                      Entre el jue 24 y el mié 30 de septiembre
                    </p>
                  </div>
                </PopIn>

                <div>
                  <a
                    href={waUrl(
                      "Hola MG, somos un estudio y nos interesa ser el set de MG1.",
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group mt-9 inline-flex items-center gap-4 border-2 border-mg-red bg-mg-red px-6 py-4 transition-colors duration-300 hover:bg-transparent hover:text-mg-red-bright md:px-8 md:py-5"
                  >
                    <span className="font-mono text-xs font-medium uppercase tracking-[0.3em] md:text-sm">
                      Hablemos por WhatsApp
                    </span>
                    <DiagonalArrow
                      size={24}
                      strokeWidth={1.75}
                      className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </a>
                </div>

                <div className="mt-8 border-l-4 border-mg-red pl-5">
                  <SpecMeta items={HERO_META} className="[&_dd]:text-mg-red-bright" />
                </div>
              </ScrollReveal>
            </Parallax>
          </div>

          <div className="col-span-12 mx-auto w-full max-w-sm lg:col-span-5 lg:max-w-md">
            <ScrollReveal direction="up" delay={0.15}>
              <Parallax from={0} to={60}>
                <HeroDisc />
                <p className="mt-6 text-center font-mono text-xs uppercase tracking-[0.2em] text-zinc-400">
                  Cuatro capítulos · grabados en dos jornadas
                </p>
              </Parallax>
            </ScrollReveal>
          </div>
        </div>
      </header>

      <BrandMarquee items={MARQUEE_ITEMS} variant="red" />

      {/* 01 · Por qué te escribimos */}
      <section className="container mx-auto px-4 py-16 md:px-6 md:py-24 lg:px-10">
        <ScrollReveal direction="up" className="[&_.font-mono]:text-mg-red-bright">
          <SectionHeading
            index="01"
            kicker="El contexto"
            title="Por qué te estamos escribiendo"
            subtitle={
              <>
                El lugar donde se graben los cuatro capítulos no va a ser un fondo
                cualquiera: va a ser <b className={hl}>el set del show</b>, en pantalla de
                principio a fin, capítulo tras capítulo.
              </>
            }
          />
        </ScrollReveal>

        <div className="mt-10 grid gap-6 md:mt-14 md:grid-cols-2 md:gap-10">
          <ScrollReveal direction="up">
            <p className="max-w-[62ch] text-base leading-relaxed text-zinc-300 md:text-lg">
              <b className={hl}>MG1 es un reality de música urbana hecho en Bogotá:</b> 12
              artistas seleccionados en convocatoria abierta escriben y graban su canción
              sobre un mismo beat, frente a una mesa de jurados de la escena — Queens
              Tafari, Jony Roy y Miguelacho TF.
            </p>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.12}>
            <p className="max-w-[62ch] border-l-4 border-mg-red pl-6 text-base leading-relaxed text-zinc-300 md:text-lg">
              Son <b className={hl}>cuatro capítulos con estreno semanal en YouTube desde
              el 9 de octubre</b>, el campeón lo elige el público con votaciones abiertas,
              y todo cierra con una fiesta de coronación a fin de mes. Esta página te
              muestra por qué eso le sirve a tu estudio, con números.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* 02 · El set */}
      <section className="border-t border-white/10 bg-white/[0.02]">
        <div className="container mx-auto px-4 py-16 md:px-6 md:py-24 lg:px-10">
          <ScrollReveal direction="up">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.3em] text-mg-red-bright md:text-xs">
              [ 02 / El set ]
            </p>
          </ScrollReveal>

          <div className="mt-8 max-w-5xl">
            <BigStatement
              text="Un reality visto por artistas, grabado en tu estudio, es"
              accent="tu portafolio corriendo solo."
            />
          </div>

          <ScrollReveal direction="up" delay={0.2}>
            <p className="mt-8 max-w-[62ch] text-base leading-relaxed text-zinc-300 md:text-lg">
              Piénsalo desde tu negocio: ¿quién ve un concurso de música urbana? Artistas.
              Gente que escribe, graba y sueña con verse en un set profesional —{" "}
              <b className={hl}>exactamente el cliente que un estudio audiovisual busca</b>.
              Durante cuatro semanas, cientos de artistas de Bogotá van a ver tus luces, tu
              ciclorama y tu espacio funcionando en un show real. No es una pauta que se
              acaba: <b className={hl}>los capítulos quedan en YouTube para siempre</b>.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* 03 · Los números */}
      <section className="bg-mg-black">
        <div className="container mx-auto px-4 py-16 md:px-6 md:py-24 lg:px-10">
          <ScrollReveal direction="up" className="[&_.font-mono]:text-mg-red-bright">
            <SectionHeading
              index="03"
              kicker="Los números"
              title="La audiencia ya existe"
              subtitle={
                <>
                  Esto no es un proyecto en el papel: la campaña lleva{" "}
                  <b className={hl}>cinco semanas andando</b>, medida y{" "}
                  <b className={hl}>sin un peso de pauta</b>. El estudio que se sume entra
                  a una máquina en marcha.
                </>
              }
            />
          </ScrollReveal>

          <div className="mt-12 border-t-2 border-mg-red md:mt-16">
            {METRICAS.map((metrica, i) => (
              <MetricRow
                key={i}
                index={i}
                concepto={metrica.concepto}
                value={metrica.value}
                decimals={metrica.decimals}
                suffix={metrica.suffix}
              />
            ))}
          </div>

          <p className="mt-6 max-w-2xl font-mono text-[11px] uppercase leading-relaxed tracking-[0.14em] text-zinc-500 md:text-xs">
            Fuente: métricas de Instagram y TikTok de MG Company, agosto–septiembre de
            2026. Con gusto las mostramos completas en la reunión.
          </p>
        </div>
      </section>

      <BrandMarquee items={MARQUEE_ITEMS} variant="outline" />

      {/* 04 · Qué gana tu estudio */}
      <section className="container mx-auto px-4 py-16 md:px-6 md:py-24 lg:px-10">
        <ScrollReveal direction="up" className="[&_.font-mono]:text-mg-red-bright">
          <SectionHeading
            index="04"
            kicker="El beneficio"
            title="Qué gana tu estudio"
            subtitle={
              <>
                Cuatro capítulos con tu espacio en pantalla, una audiencia que{" "}
                <b className={hl}>es tu cliente ideal</b> y un paquete de contenido hecho
                para tus redes.
              </>
            }
          />
        </ScrollReveal>

        <div className="mt-12 grid gap-6 md:mt-16 md:grid-cols-2 lg:grid-cols-3">
          {BENEFICIOS.map((item, i) => (
            <ScrollReveal key={item.title} direction="up" delay={(i % 3) * 0.08}>
              <div className="h-full border-t-4 border-mg-red bg-white/[0.03] p-6 transition-transform duration-300 hover:-translate-y-1 md:p-7">
                <h3 className="font-heading text-2xl uppercase leading-tight tracking-wide text-mg-red">
                  {item.title}
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-zinc-300 md:text-[15px]">
                  {item.desc}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* 05 · Qué pedimos + modelos de acuerdo */}
      <section className="border-t border-white/10 bg-white/[0.02]">
        <div className="container mx-auto px-4 py-16 md:px-6 md:py-24 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <ScrollReveal direction="up" className="[&_.font-mono]:text-mg-red-bright [&_h2]:text-[clamp(2rem,4vw,3.25rem)]">
                <SectionHeading index="05" kicker="El trato" title="Qué pedimos" />
              </ScrollReveal>
              <ul className="mt-8 border-t border-white/10">
                {PEDIMOS.map((item, i) => (
                  <ScrollReveal key={i} direction="up" delay={i * 0.08}>
                    <li className="relative border-b border-white/10 py-4 pl-8 text-sm leading-relaxed text-zinc-300 md:text-[15px]">
                      <span
                        aria-hidden="true"
                        className="absolute left-0 top-[1.35rem] h-3 w-3 bg-mg-red"
                      />
                      {item}
                    </li>
                  </ScrollReveal>
                ))}
              </ul>
            </div>

            <div>
              <ScrollReveal direction="up" className="[&_.font-mono]:text-mg-red-bright [&_h2]:text-[clamp(2rem,4vw,3.25rem)]">
                <SectionHeading index="06" kicker="Los caminos" title="Cómo puede ser el acuerdo" />
              </ScrollReveal>
              <ol className="mt-8 border-t border-white/10">
                {MODELOS.map((modelo, i) => (
                  <ScrollReveal key={modelo.title} direction="up" delay={i * 0.08}>
                    <li className="flex gap-4 border-b border-white/10 py-5">
                      <PopIn delay={i * 0.08 + 0.1} rotate={-90}>
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-mg-red font-heading text-lg">
                          {i + 1}
                        </span>
                      </PopIn>
                      <div>
                        <p className="font-heading text-xl uppercase tracking-wide">
                          {modelo.title}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-zinc-400 md:text-[15px]">
                          {modelo.desc}
                        </p>
                      </div>
                    </li>
                  </ScrollReveal>
                ))}
              </ol>
              <ScrollReveal direction="up" delay={0.25}>
                <p className="mt-5 text-sm leading-relaxed text-zinc-400 md:text-[15px]">
                  Los tres caminos están abiertos. La reunión es para encontrar el que le
                  sirva a tu estudio.
                </p>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-mg-red text-center">
        <div className="container mx-auto px-4 py-16 md:px-6 md:py-24 lg:px-10">
          <PopIn>
            <div className="mb-8 flex h-9 items-end justify-center gap-1.5" aria-hidden="true">
              {[0, 0.15, 0.3, 0.45, 0.6].map((delay) => (
                <span
                  key={delay}
                  className="mg1-anim h-full w-1.5 origin-bottom bg-white"
                  style={{ animation: `mg1-eq 1s ease-in-out ${delay}s infinite` }}
                />
              ))}
            </div>
          </PopIn>

          <PopIn delay={0.1}>
            <h2 className="font-heading uppercase leading-[0.95] tracking-tight text-[clamp(2.25rem,6vw,5rem)]">
              Cuadremos una visita.
            </h2>
          </PopIn>

          <ScrollReveal direction="up" delay={0.25}>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white md:text-lg">
              Escríbenos y en una <b>reunión de 20 minutos</b> —en tu estudio, para conocer
              el espacio— te mostramos el proyecto completo, las métricas y armamos el
              acuerdo.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <a
                href={waUrl(
                  "Hola MG, somos un estudio y queremos conocer la propuesta de MG1.",
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-4 border-2 border-mg-black bg-mg-black px-6 py-4 transition-colors duration-300 hover:bg-transparent md:px-8 md:py-5"
              >
                <span className="font-mono text-xs font-medium uppercase tracking-[0.25em] md:text-sm">
                  Escribir por WhatsApp
                </span>
                <DiagonalArrow
                  size={22}
                  strokeWidth={1.75}
                  className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </a>
              <a
                href={`mailto:${CORREO}?subject=${encodeURIComponent(
                  "Nuestro estudio quiere ser el set de MG1",
                )}`}
                className="group inline-flex items-center gap-4 border-2 border-white bg-white px-6 py-4 text-mg-black transition-colors duration-300 hover:bg-transparent hover:text-white md:px-8 md:py-5"
              >
                <span className="font-mono text-xs font-medium uppercase tracking-[0.25em] md:text-sm">
                  Enviar un correo
                </span>
                <DiagonalArrow
                  size={22}
                  strokeWidth={1.75}
                  className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-4 px-4 py-8 md:px-6 lg:px-10">
          <Link href="/" className="flex items-center gap-4 transition-opacity hover:opacity-70">
            <Image
              src="/logo-mg.png"
              alt="MG Company Group"
              width={36}
              height={36}
              className="h-9 w-9"
            />
            <span className="max-w-[22rem] font-mono text-[11px] uppercase leading-relaxed tracking-[0.2em] text-zinc-400 md:text-xs">
              Producción musical, audiovisual, marketing y eventos para artistas · Bogotá
            </span>
          </Link>
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-mg-red-bright md:text-xs">
            #ConcursoMG1
          </span>
        </div>
      </footer>
    </div>
  )
}
