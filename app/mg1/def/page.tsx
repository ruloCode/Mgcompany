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

const OG_TITLE = "Propuesta DEF · La Coronación MG1"
const OG_DESCRIPTION =
  "Def Jamaica Club como la casa de la noche final del Concurso MG1. Viernes 30 o sábado 31 de octubre, 6–9 p.m."

export function generateMetadata(): Metadata {
  const custom = "/og/og-mg1-def.jpg"
  const ogImage = existsSync(join(process.cwd(), "public", custom))
    ? custom
    : "/og/og-mg1-jurado.jpg"

  return {
    title: "Propuesta DEF · La Coronación MG1 | MG Company Group",
    description: OG_DESCRIPTION,
    // Propuesta dirigida a un solo lugar: se manda por enlace, no se indexa.
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
          alt: "La Coronación MG1 — propuesta para Def Jamaica Club, Soacha",
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

const WA = "573189025388"
const waUrl = (texto: string) => `https://wa.me/${WA}?text=${encodeURIComponent(texto)}`

const HERO_META = [
  { label: "Evento:", value: "Noche final en vivo" },
  { label: "Horario:", value: "6:00 – 9:00 p.m." },
  { label: "Lugar:", value: "DEF · Soacha" },
]

const FECHAS = [
  { dia: "Vie 30 de octubre", hora: "6:00 – 9:00 p.m." },
  { dia: "Sáb 31 de octubre", hora: "6:00 – 9:00 p.m." },
]

const MARQUEE_ITEMS = [
  "AQUÍ NO SE IMPROVISA, AQUÍ SE ESCRIBE",
  "CONCURSO MG1",
  "LA CORONACIÓN EN DEF",
  "SOACHA · OCTUBRE 2026",
]

// Por que DEF y no cualquier bar: lo que encontramos de su propia historia
const POR_QUE_DEF: { title: string; desc: React.ReactNode }[] = [
  {
    title: "Llevan 20 años haciendo esto",
    desc: (
      <>
        DEF abrió en <b className={hl}>2006</b> en la zona rosa de Soacha, de la mano de
        Mike Style, su hermana Magda y un grupo de amigos que querían un lugar para el
        reggae, el hip hop y el dancehall cuando no había ninguno al sur.{" "}
        <b className={hl}>Veinte años después sigue en pie</b>. Nosotros vamos por la
        primera edición de MG1: queremos estrenarla en una casa con historia, no en un
        salón alquilado.
      </>
    ),
  },
  {
    title: "Son la primera tarima de los que empiezan",
    desc: (
      <>
        Por esa tarima han pasado <b className={hl}>cerca de mil artistas</b> —
        Aterciopelados, La Pestilencia, Superlitio, The Mills, Systema Solar, La 33,
        LosPetitFellas, Kevin Flórez, Kafu Bantón— y también los que nadie conocía
        todavía. Eso es <b className={hl}>exactamente MG1</b>: 12 artistas emergentes de
        la escena a los que les estamos dando su primera producción de verdad.
      </>
    ),
  },
  {
    title: "Soacha no es un detalle: es el dato",
    desc: (
      <>
        El <b className={hl}>65,6 % de la interacción de nuestra campaña viene de Bogotá y
        Soacha</b>. La gente que lleva un mes votando, comentando y compartiendo MG1{" "}
        <b className={hl}>ya vive a la vuelta de DEF</b>. No hay que traerla de la otra
        punta de la ciudad: solo hay que decirle dónde.
      </>
    ),
  },
  {
    title: "Dos pisos que funcionan como un solo evento",
    desc: (
      <>
        La <b className={hl}>sala de conciertos del segundo piso</b> es donde pasa la
        coronación; la <b className={hl}>terraza con la barra de 360°</b> es donde la
        gente llega, se registra, come y se queda hablando. Un evento con público,
        prensa y 12 artistas necesita justo eso: un sitio para el show y otro para el
        resto.
      </>
    ),
  },
]

// La noche, hora por hora, montada sobre como abre DEF
const MINUTO_A_MINUTO: { hora: string; que: string; desc: React.ReactNode }[] = [
  {
    hora: "5:00 p.m.",
    que: "Montaje",
    desc: <>Entra nuestro equipo audiovisual, luces y el punto de registro en la terraza.</>,
  },
  {
    hora: "6:00 p.m.",
    que: "Puertas",
    desc: (
      <>
        Abre con registro por <b className={hl}>QR</b> — nosotros ponemos el sistema y el
        personal. Sube la barra desde el primer minuto.
      </>
    ),
  },
  {
    hora: "6:30 p.m.",
    que: "Arranca el show",
    desc: <>Los 12 concursantes, los jurados y el cartel en la sala del segundo piso.</>,
  },
  {
    hora: "8:30 p.m.",
    que: "La coronación",
    desc: (
      <>
        Se anuncia al campeón y <b className={hl}>el capítulo final se estrena en YouTube
        en ese mismo instante</b>. Nadie sabe el resultado hasta ahí.
      </>
    ),
  },
  {
    hora: "9:00 p.m.",
    que: "La noche es de DEF",
    desc: (
      <>
        Nos bajamos de la tarima y les queda{" "}
        <b className={hl}>la casa llena de público joven</b> con toda la noche por
        delante — la de ustedes, con su música y su programación.
      </>
    ),
  },
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
        De las interacciones vienen de <b className={hl}>Bogotá y Soacha</b> — el público
        de la campaña es, literalmente, el barrio de DEF
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
        consume en barra y la que ya se sabe el camino a la Cra. 7
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
    title: "La noche empieza llena, no termina",
    desc: (
      <>
        El evento va de 6:00 a 9:00 p.m. DEF abre viernes y sábado{" "}
        <b className={hl}>hasta la 1:00 a.m.</b>: a las 9 les entregamos la sala y la
        terraza llenas, con la noche apenas arrancando. No les quitamos la rumba —{" "}
        <b className={hl}>se la prendemos</b>.
      </>
    ),
  },
  {
    title: "Si es el 31, es la antesala de Halloween",
    desc: (
      <>
        El sábado 31 la ciudad entera sale disfrazada. Terminar el show a las 9 significa
        que DEF llega a su <b className={hl}>noche de Halloween con la casa ya llena</b> y
        con 12 artistas y sus públicos adentro. Si prefieren dejar el 31 libre,{" "}
        <b className={hl}>el viernes 30 nos sirve igual</b>.
      </>
    ),
  },
  {
    title: "Sede oficial dentro del show",
    desc: (
      <>
        DEF aparece como <b className={hl}>sede oficial de La Coronación</b>: mencionado
        dentro de los capítulos del reality, en el afiche del cartel y etiquetado en todo
        el contenido de la campaña. Cada estreno semanal cierra invitando a la final{" "}
        <b className={hl}>en DEF</b>.
      </>
    ),
  },
  {
    title: "Contenido profesional de su casa llena",
    desc: (
      <>
        Nuestro equipo audiovisual cubre la noche completa. Les entregamos{" "}
        <b className={hl}>fotos y video editado de DEF lleno</b>, listos para{" "}
        <b className={hl}>@defjamaicaclub</b>. Eso solo, cotizado aparte, ya vale la
        noche.
      </>
    ),
  },
  {
    title: "Público nuevo, no el de siempre",
    desc: (
      <>
        Un cartel con <b className={hl}>más de 285.000 seguidores combinados</b>, 12
        concursantes movilizando a los suyos y una comunidad que lleva dos meses siguiendo
        la historia. Gente que quizá nunca ha subido a la terraza —{" "}
        <b className={hl}>y que después sabe cómo llegar</b>.
      </>
    ),
  },
  {
    title: "El evento lo operamos nosotros",
    desc: (
      <>
        MG pone el{" "}
        <b className={hl}>equipo audiovisual, el registro de entrada con QR y el personal
        de apoyo</b>. DEF pone lo que ya tiene: el espacio, el sonido, la tarima y los
        camerinos — y vende su barra.
      </>
    ),
  },
]

const PEDIMOS: React.ReactNode[] = [
  <>
    <b className="text-white">La sala del segundo piso</b> el viernes 30 o el sábado 31 de
    octubre, de 6:00 a 9:00 p.m., con montaje desde las 5:00.
  </>,
  <>
    <b className="text-white">La terraza como zona de llegada</b>: registro con QR, prensa
    y el público que va subiendo. La barra trabaja normal todo el tiempo.
  </>,
  <>
    <b className="text-white">El sonido, las luces y la tarima de DEF</b> — lo que ya usan
    cada fin de semana para música en vivo.
  </>,
  <>
    <b className="text-white">Permiso de grabación</b> dentro del club para los capítulos
    y el contenido de campaña.
  </>,
  <>
    <b className="text-white">Una conversación</b> para acordar los términos: consumo
    mínimo, taquilla, barra o el modelo que a DEF le funcione. Vamos con la mente abierta.
  </>,
]

const PLAN: { title: string; desc: React.ReactNode }[] = [
  {
    title: "Anuncio de la sede",
    desc: (
      <>
        Reel presentando a DEF como la casa de La Coronación, en collab con los jurados y
        con <b className={hl}>@defjamaicaclub</b>.
      </>
    ),
  },
  {
    title: "Estreno de capítulos",
    desc: (
      <>
        9, 16 y 23 de octubre — y el día se acomoda al de DEF: si eligen viernes, los
        estrenos van en viernes; si eligen sábado, en sábado. Cada capítulo cierra
        invitando a la final en DEF.
      </>
    ),
  },
  {
    title: "Cartel del lineup",
    desc: <>Piezas del cartel con DEF en el afiche, compartidas por todos los artistas.</>,
  },
  {
    title: "Cuenta regresiva",
    desc: (
      <>
        Historias diarias con el mapa a la Cra. 7, el evento de Facebook y el registro con
        QR.
      </>
    ),
  },
  {
    title: "La noche",
    desc: (
      <>
        El capítulo final se estrena en YouTube en el instante de la coronación, y nuestro
        equipo cubre el evento completo para redes — con material que también es de DEF.
      </>
    ),
  },
]

export default function MG1DefPage() {
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
                    [ MG Company · Propuesta para Def Jamaica Club ]
                  </span>
                  <span className="h-px flex-1 bg-mg-red/40" />
                </div>

                <h1 className="mt-6 font-heading uppercase leading-[0.9] tracking-tight text-[clamp(2.75rem,9vw,7rem)]">
                  <span className="block text-stroke">La Coronación</span>
                  <span className="block text-mg-red">MG1</span>
                  <span className="block">se corona en DEF.</span>
                </h1>

                <p className="mt-6 max-w-xl text-base leading-relaxed text-zinc-300 md:text-lg">
                  La noche final del <b className={hl}>primer reality musical</b> de la
                  escena urbana de Bogotá y Soacha. Buscamos una casa para esa noche y{" "}
                  <b className={hl}>solo estamos escribiéndole a una</b>.
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
                    "Hola MG, somos DEF. Vimos la propuesta de La Coronación MG1 y queremos hablar.",
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

      {/* 01 · Por qué DEF */}
      <section className="container mx-auto px-4 py-16 md:px-6 md:py-24 lg:px-10">
        <ScrollReveal direction="up" className="[&_.font-mono]:text-mg-red-bright">
          <SectionHeading
            index="01"
            kicker="Por qué ustedes"
            title="Esta propuesta es solo para DEF"
            subtitle={
              <>
                No estamos mandando la misma página a diez bares a ver quién contesta. Nos
                sentamos a mirar dónde tenía sentido cerrar MG1 y{" "}
                <b className={hl}>hay cuatro razones por las que da DEF</b>.
              </>
            }
          />
        </ScrollReveal>

        <div className="mt-10 grid gap-6 md:mt-14 md:grid-cols-2">
          {POR_QUE_DEF.map((item, i) => (
            <ScrollReveal key={item.title} direction="up" delay={(i % 2) * 0.1}>
              <div className="h-full border-t-4 border-mg-red bg-white/[0.03] p-6 transition-transform duration-300 hover:-translate-y-1 md:p-8">
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

        <ScrollReveal direction="up" delay={0.15}>
          <p className="mt-10 max-w-[68ch] border-l-4 border-mg-red pl-6 text-base leading-relaxed text-zinc-300 md:text-lg">
            <b className={hl}>MG1 es un reality de música urbana hecho aquí:</b> 12
            artistas seleccionados en convocatoria abierta escriben y graban su canción
            sobre un mismo beat, frente a una mesa de jurados de la escena. Son{" "}
            <b className={hl}>cuatro capítulos con estreno semanal en YouTube desde el 9
            de octubre</b>, el campeón lo elige el público con votaciones abiertas, y todo
            termina en una sola noche: la coronación. El capítulo final se estrena{" "}
            <b className={hl}>en el momento exacto en que se corona al campeón</b> — nadie
            conoce el resultado hasta ese instante, y la única forma de vivirlo primero es
            estar ahí.
          </p>
        </ScrollReveal>
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
              Todos confirmados. Cada uno mueve a su propia audiencia hacia la tarima de
              DEF.
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
                  <b className={hl}>sin un peso de pauta</b>. DEF no entra a levantar una
                  campaña: entra a una que ya va rodando.
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

      {/* 04 · Qué gana DEF */}
      <section className="container mx-auto px-4 py-16 md:px-6 md:py-24 lg:px-10">
        <ScrollReveal direction="up" className="[&_.font-mono]:text-mg-red-bright">
          <SectionHeading
            index="04"
            kicker="El beneficio"
            title="Qué gana DEF"
            subtitle={
              <>
                Tres horas que terminan justo cuando su noche empieza, público local de 18
                a 34, su nombre dentro del show y{" "}
                <b className={hl}>contenido profesional</b> que les queda.
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

      {/* 05 · La noche, hora por hora */}
      <section className="border-t border-white/10 bg-white/[0.02]">
        <div className="container mx-auto px-4 py-16 md:px-6 md:py-24 lg:px-10">
          <ScrollReveal direction="up" className="[&_.font-mono]:text-mg-red-bright">
            <SectionHeading
              index="05"
              kicker="La operación"
              title="Cómo se ve la noche en DEF"
              subtitle={
                <>
                  Tres horas cerradas, montadas sobre cómo ya funciona la casa: la sala
                  arriba, la terraza abajo y <b className={hl}>la barra abierta todo el
                  tiempo</b>.
                </>
              }
            />
          </ScrollReveal>

          <ol className="mt-12 border-t border-white/10 md:mt-16">
            {MINUTO_A_MINUTO.map((paso, i) => (
              <ScrollReveal key={paso.hora} direction="up" delay={i * 0.07}>
                <li className="grid grid-cols-12 items-baseline gap-x-4 gap-y-1 border-b border-white/10 py-5 md:py-6">
                  <p className="col-span-12 font-mono text-xs font-medium uppercase tracking-[0.2em] text-mg-red-bright md:col-span-2 md:text-sm">
                    {paso.hora}
                  </p>
                  <p className="col-span-12 font-heading text-xl uppercase tracking-wide md:col-span-3 md:text-2xl">
                    {paso.que}
                  </p>
                  <p className="col-span-12 text-sm leading-relaxed text-zinc-300 md:col-span-7 md:text-[15px]">
                    {paso.desc}
                  </p>
                </li>
              </ScrollReveal>
            ))}
          </ol>
        </div>
      </section>

      {/* 06 · Qué pedimos + el plan */}
      <section className="container mx-auto px-4 py-16 md:px-6 md:py-24 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <ScrollReveal
              direction="up"
              className="[&_.font-mono]:text-mg-red-bright [&_h2]:text-[clamp(2rem,4vw,3.25rem)]"
            >
              <SectionHeading index="06" kicker="El trato" title="Qué pedimos" />
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
            <ScrollReveal
              direction="up"
              className="[&_.font-mono]:text-mg-red-bright [&_h2]:text-[clamp(2rem,4vw,3.25rem)]"
            >
              <SectionHeading index="07" kicker="La campaña" title="El mes y medio de bombo" />
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
              Veinte años de tarima.
              <br />
              Falta una coronación.
            </h2>
          </PopIn>

          <ScrollReveal direction="up" delay={0.25}>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white md:text-lg">
              Escríbannos y en una <b>reunión de 20 minutos</b> —en DEF, si quieren— les
              mostramos las métricas completas, el plan del evento y cerramos los términos
              que le sirvan a la casa.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <a
                href={waUrl(
                  "Hola MG, somos DEF. Nos sirve el viernes 30 de octubre para La Coronación MG1.",
                )}
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
                href={waUrl(
                  "Hola MG, somos DEF. Nos sirve el sábado 31 de octubre para La Coronación MG1.",
                )}
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
            Propuesta para DEF
          </span>
        </div>
      </footer>
    </div>
  )
}
