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
import CountUp from "@/components/mg1/count-up"
import HeroDisc from "@/components/mg1/hero-disc"
import MetricRow from "@/components/mg1/metric-row"
import Parallax from "@/components/mg1/parallax"
import PopIn from "@/components/mg1/pop-in"

const OG_TITLE = "La Coronación MG1 · Propuesta para tu bar"
const OG_DESCRIPTION =
  "La noche final del primer reality musical de la escena urbana bogotana busca casa. Viernes 30 o sábado 31 de octubre, 6–9 p.m."

export function generateMetadata(): Metadata {
  const custom = "/og/og-mg1-coronacion.jpg"
  const ogImage = existsSync(join(process.cwd(), "public", custom))
    ? custom
    : "/og/og-mg1-jurado.jpg"

  return {
    title: "La Coronación MG1 · Propuesta para tu bar | MG Company Group",
    description: OG_DESCRIPTION,
    // Propuesta de alianza: se comparte por enlace, no se indexa.
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
          alt: "La Coronación MG1 — propuesta de alianza para bares de Bogotá",
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
const waUrl = (texto: string) => `https://wa.me/${WA}?text=${encodeURIComponent(texto)}`

const HERO_META = [
  { label: "Evento:", value: "Noche final en vivo" },
  { label: "Horario:", value: "6:00 – 9:00 p.m." },
  { label: "Ciudad:", value: "Bogotá" },
]

const FECHAS = [
  { dia: "Vie 30 de octubre", hora: "6:00 – 9:00 p.m." },
  { dia: "Sáb 31 de octubre", hora: "6:00 – 9:00 p.m." },
]

const MARQUEE_ITEMS = [
  "AQUÍ NO SE IMPROVISA, AQUÍ SE ESCRIBE",
  "CONCURSO MG1",
  "LA CORONACIÓN",
  "PRIMERA EDICIÓN · BOGOTÁ",
]

const SOPORTE = [
  { nombre: "Jony Roy", rol: "DJ y productor de los más respetados de la escena urbana" },
  { nombre: "Miguelacho TF", rol: "Cantante y productor, jurado de MG1" },
]

const TERCEROS = ["Lee Fonse", "MC Troka", "Pyrio", "Nikory", "+ Invitados"]

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
    concepto: (
      <>
        Veces que la gente compartió nuestro contenido en los últimos 14 días — el
        contenido <b className={hl}>se pasa de mano en mano</b>
      </>
    ),
    value: 906,
  },
  {
    concepto: (
      <>
        De las interacciones vienen de <b className={hl}>Bogotá y Soacha</b>: público que
        sí puede llegar a tu bar
      </>
    ),
    value: 65.6,
    decimals: 1,
    suffix: "%",
  },
  {
    concepto: (
      <>
        De la audiencia tiene entre <b className={hl}>18 y 34 años</b> — la edad que
        consume en barra
      </>
    ),
    value: 83,
    suffix: "%",
  },
  {
    concepto: (
      <>
        Personas se inscribieron solo al evento de cierre de convocatoria, que reunió
        influencers, modelos, bailarines, managers y productores de la escena
      </>
    ),
    value: 62,
  },
]

const BENEFICIOS: { title: string; desc: React.ReactNode }[] = [
  {
    title: "Tu noche arranca llena",
    desc: (
      <>
        El evento va de 6:00 a 9:00 p.m.: tu bar se llena desde temprano y, cuando el
        show termina,{" "}
        <b className={hl}>a las 9 tienes la casa llena de público joven con la noche
        apenas comenzando</b>. El resto de tu viernes o sábado arranca caliente, sin que
        tengas que hacer nada.
      </>
    ),
  },
  {
    title: "Público local, no seguidores lejanos",
    desc: (
      <>
        El 65,6 % de la interacción de la campaña viene de{" "}
        <b className={hl}>Bogotá y Soacha</b>. La convocatoria fue local, los artistas son
        locales y sus públicos también.
      </>
    ),
  },
  {
    title: "Tu marca dentro del show",
    desc: (
      <>
        El bar aparece como <b className={hl}>sede oficial de La Coronación</b>: mencionado
        dentro de los capítulos del reality y etiquetado en todo el contenido de la
        campaña durante el mes y medio previo. Cada estreno semanal invita a la final en
        tu bar.
      </>
    ),
  },
  {
    title: "Contenido profesional para ti",
    desc: (
      <>
        Nuestro equipo audiovisual cubre la noche completa. Te entregamos{" "}
        <b className={hl}>fotos y video editado de tu bar lleno</b>, listos para tus
        propias redes. Eso solo, cotizado aparte, ya vale la noche.
      </>
    ),
  },
  {
    title: "Los artistas traen a su gente",
    desc: (
      <>
        Un cartel con <b className={hl}>más de 285.000 seguidores combinados</b>, 12
        concursantes movilizando a sus públicos para la final, y una comunidad que lleva
        dos meses siguiendo la historia.
      </>
    ),
  },
  {
    title: "El evento lo operamos nosotros",
    desc: (
      <>
        MG pone el{" "}
        <b className={hl}>equipo audiovisual, el registro de entrada con QR y el personal
        de apoyo</b>{" "}
        para la logística de la noche. Tu bar pone el espacio, el sonido y la tarima que
        ya tiene — y vende su barra.
      </>
    ),
  },
]

const PEDIMOS: React.ReactNode[] = [
  <>
    <b className="text-white">El espacio</b> el viernes 30 o el sábado 31 de octubre, de
    6:00 a 9:00 p.m. (montaje desde la tarde).
  </>,
  <>
    <b className="text-white">Sonido y tarima del bar</b> — buscamos un lugar con show en
    vivo, listo para recibir el cartel.
  </>,
  <>
    <b className="text-white">Permiso de grabación</b> dentro del bar para el contenido
    del evento y las redes.
  </>,
  <>
    <b className="text-white">Una conversación</b> para acordar los términos: consumo
    mínimo, taquilla, barra o el modelo que al bar le funcione. Vamos con la mente
    abierta.
  </>,
]

const PLAN: { title: string; desc: React.ReactNode }[] = [
  {
    title: "Anuncio de la sede",
    desc: <>Reel presentando tu bar como la casa de La Coronación, en collab con los jurados.</>,
  },
  {
    title: "Estreno de capítulos",
    desc: (
      <>
        9, 16 y 23 de octubre — y el día se acomoda al del bar: si eliges viernes, los
        estrenos van en viernes; si eliges sábado, en sábado. Cada capítulo cierra
        invitando a la final en tu bar.
      </>
    ),
  },
  {
    title: "Cartel del lineup",
    desc: <>Piezas del cartel con tu bar en el afiche, compartidas por los artistas.</>,
  },
  {
    title: "Cuenta regresiva",
    desc: <>Historias diarias con el mapa, el evento de Facebook y registro con QR.</>,
  },
  {
    title: "La noche",
    desc: (
      <>
        El capítulo final se estrena en YouTube en el instante de la coronación, y nuestro
        equipo cubre el evento completo para redes — con material que también es tuyo.
      </>
    ),
  },
]

export default function MG1CoronacionPage() {
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
                    [ MG Company · Propuesta de alianza · Bogotá ]
                  </span>
                  <span className="h-px flex-1 bg-mg-red/40" />
                </div>

                <h1 className="mt-6 font-heading uppercase leading-[0.9] tracking-tight text-[clamp(2.75rem,9vw,7rem)]">
                  <span className="block text-stroke">La Coronación</span>
                  <span className="block text-mg-red">MG1</span>
                  <span className="block">busca casa.</span>
                </h1>

                <p className="mt-6 max-w-xl text-base leading-relaxed text-zinc-300 md:text-lg">
                  La noche final del <b className={hl}>primer reality musical</b> de la
                  escena urbana bogotana — y estamos buscando{" "}
                  <b className={hl}>el bar que sea su casa</b>.
                </p>

                <div className="mt-8 flex flex-wrap gap-3" role="list">
                  {FECHAS.map((fecha, i) => (
                    <PopIn key={fecha.dia} delay={0.2 + i * 0.1} rotate={i === 0 ? -2 : 2}>
                      <div
                        role="listitem"
                        className={`min-w-[13rem] border-2 px-5 py-4 ${
                          i === 0
                            ? "border-mg-red bg-mg-red"
                            : "border-white bg-white text-mg-black"
                        }`}
                      >
                        <p className="font-heading text-2xl uppercase leading-none tracking-wide">
                          {fecha.dia}
                        </p>
                        <p
                          className={`mt-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.18em] ${
                            i === 0 ? "text-white/80" : "text-mg-red"
                          }`}
                        >
                          {fecha.hora}
                        </p>
                      </div>
                    </PopIn>
                  ))}
                </div>

                <a
                  href={waUrl(
                    "Hola MG, nos interesa ser la casa de La Coronación MG1. ¿Hablamos?",
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
                  El Disco Ruby · se entrega esa noche
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
                Esa noche necesita una casa: un lugar con la energía de la escena, donde
                quepan los 12 artistas, los jurados, sus públicos y la gente que lleva un
                mes votando. <b className={hl}>Queremos que sea tu bar</b>.
              </>
            }
          />
        </ScrollReveal>

        <div className="mt-10 grid gap-6 md:mt-14 md:grid-cols-2 md:gap-10">
          <ScrollReveal direction="up">
            <p className="max-w-[62ch] text-base leading-relaxed text-zinc-300 md:text-lg">
              <b className={hl}>MG1 es un reality de música urbana hecho en Bogotá:</b> 12
              artistas seleccionados en convocatoria abierta escriben y graban su canción
              sobre un mismo beat, frente a una mesa de jurados de la escena. Son{" "}
              <b className={hl}>cuatro capítulos con estreno semanal en YouTube desde el 9
              de octubre</b>, el campeón lo elige el público con votaciones abiertas, y
              todo termina en una sola noche: la coronación.
            </p>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.12}>
            <p className="max-w-[62ch] border-l-4 border-mg-red pl-6 text-base leading-relaxed text-zinc-300 md:text-lg">
              El capítulo final se estrena{" "}
              <b className={hl}>esa misma noche, en el momento exacto de la coronación</b>{" "}
              — nadie conoce el resultado hasta ese instante, y la única forma de vivirlo
              primero es estar ahí. Esta página te muestra, con números, por qué te
              conviene.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* 02 · El cartel */}
      <section className="border-t border-white/10 bg-white/[0.02]">
        <div className="container mx-auto px-4 py-16 text-center md:px-6 md:py-24 lg:px-10">
          <ScrollReveal direction="up">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.3em] text-mg-red-bright md:text-xs">
              [ 02 / El show de esa noche ]
            </p>
            <h2 className="mt-4 font-heading uppercase leading-[0.9] tracking-tight text-[clamp(2.5rem,7vw,5rem)]">
              El cartel
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-zinc-400 md:text-base">
              Todos confirmados. Cada uno mueve a su propia audiencia hacia el evento.
            </p>
          </ScrollReveal>

          <PopIn delay={0.1}>
            <p className="mt-12 font-heading uppercase leading-[0.95] tracking-tight text-mg-red text-[clamp(2.5rem,10vw,5.5rem)] [filter:drop-shadow(0_0_26px_rgba(232,32,12,0.45))]">
              Queens Tafari
            </p>
          </PopIn>
          <ScrollReveal direction="up" delay={0.15}>
            <p className="mt-3 text-sm font-semibold text-white md:text-base">
              120.000 seguidores en Instagram · 149.600 en TikTok
            </p>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-400 md:text-xs">
              Dúo jurado de MG1 · show en vivo
            </p>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.1}>
            <span
              aria-hidden="true"
              className="mx-auto my-10 block h-1 w-28 bg-mg-red md:my-12"
            />
          </ScrollReveal>

          <div className="flex flex-wrap items-baseline justify-center gap-x-10 gap-y-2">
            {SOPORTE.map((artista, i) => (
              <PopIn key={artista.nombre} delay={i * 0.1}>
                <p className="font-heading uppercase leading-tight tracking-tight text-[clamp(1.6rem,5vw,2.75rem)]">
                  {artista.nombre}
                </p>
              </PopIn>
            ))}
          </div>
          <ScrollReveal direction="up" delay={0.15}>
            <p className="mx-auto mt-3 max-w-2xl text-xs text-zinc-400 md:text-sm">
              {SOPORTE.map((a) => a.rol).join(" · ")}
            </p>
          </ScrollReveal>

          <div className="mt-10 flex flex-wrap items-baseline justify-center gap-x-8 gap-y-2">
            {TERCEROS.map((nombre, i) => (
              <PopIn key={nombre} delay={i * 0.07}>
                <p className="font-heading uppercase leading-tight tracking-tight text-zinc-200 text-[clamp(1.15rem,3.6vw,1.75rem)]">
                  {nombre}
                </p>
              </PopIn>
            ))}
          </div>
          <ScrollReveal direction="up" delay={0.15}>
            <p className="mx-auto mt-4 max-w-2xl text-xs leading-relaxed text-zinc-400 md:text-sm">
              Artistas que llevan años construyendo la escena desde la tarima, la calle y
              el estudio — junto a los 12 concursantes de MG1, cada uno con su público
              detrás.
            </p>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.2}>
            <div className="mt-12 inline-flex flex-wrap items-baseline justify-center gap-x-4 gap-y-1 border-2 border-white px-6 py-4 md:px-8">
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-300 md:text-xs">
                Alcance combinado del cartel
              </span>
              <CountUp
                value={285_000}
                prefix="+"
                className="font-heading leading-none tracking-tight text-mg-red text-[clamp(1.75rem,6vw,2.5rem)]"
              />
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-300 md:text-xs">
                seguidores
              </span>
            </div>
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
              title="La campaña ya está andando"
              subtitle={
                <>
                  Esto no es una promesa de publicidad futura: es una máquina que lleva{" "}
                  <b className={hl}>cinco semanas moviéndose</b>, medida y{" "}
                  <b className={hl}>sin un peso de pauta</b>. El bar que se sume entra a
                  una campaña en marcha.
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
            2026. Con gusto las mostramos en la reunión.
          </p>
        </div>
      </section>

      <BrandMarquee items={MARQUEE_ITEMS} variant="outline" />

      {/* 04 · Qué gana tu bar */}
      <section className="container mx-auto px-4 py-16 md:px-6 md:py-24 lg:px-10">
        <ScrollReveal direction="up" className="[&_.font-mono]:text-mg-red-bright">
          <SectionHeading
            index="04"
            kicker="El beneficio"
            title="Qué gana tu bar"
            subtitle={
              <>
                Una noche llena desde temprano, público local de 18 a 34, tu marca dentro
                del show y <b className={hl}>contenido profesional</b> que te queda.
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

      {/* 05 · Qué pedimos + el plan */}
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
                <SectionHeading index="06" kicker="La campaña" title="El mes y medio de bombo" />
              </ScrollReveal>
              <ol className="mt-8 border-t border-white/10">
                {PLAN.map((paso, i) => (
                  <ScrollReveal key={paso.title} direction="up" delay={i * 0.08}>
                    <li className="flex gap-4 border-b border-white/10 py-5">
                      <PopIn delay={i * 0.08 + 0.1} rotate={-90}>
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-mg-red font-heading text-lg">
                          {i + 1}
                        </span>
                      </PopIn>
                      <div>
                        <p className="font-heading text-xl uppercase tracking-wide">
                          {paso.title}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-zinc-400 md:text-[15px]">
                          {paso.desc}
                        </p>
                      </div>
                    </li>
                  </ScrollReveal>
                ))}
              </ol>
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
              Elige la fecha
              <br />y hablemos.
            </h2>
          </PopIn>

          <ScrollReveal direction="up" delay={0.25}>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white md:text-lg">
              Escríbenos y en una <b>reunión de 20 minutos</b> te mostramos las métricas
              completas, el plan del evento y cerramos los términos que le sirvan al bar.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <a
                href={waUrl("Hola MG, nos interesa el viernes 30 de octubre para La Coronación MG1.")}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-4 border-2 border-mg-black bg-mg-black px-6 py-4 transition-colors duration-300 hover:bg-transparent md:px-8 md:py-5"
              >
                <span className="font-mono text-xs font-medium uppercase tracking-[0.25em] md:text-sm">
                  Nos sirve el viernes 30
                </span>
                <DiagonalArrow
                  size={22}
                  strokeWidth={1.75}
                  className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </a>
              <a
                href={waUrl("Hola MG, nos interesa el sábado 31 de octubre para La Coronación MG1.")}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-4 border-2 border-white bg-white px-6 py-4 text-mg-black transition-colors duration-300 hover:bg-transparent hover:text-white md:px-8 md:py-5"
              >
                <span className="font-mono text-xs font-medium uppercase tracking-[0.25em] md:text-sm">
                  Nos sirve el sábado 31
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
