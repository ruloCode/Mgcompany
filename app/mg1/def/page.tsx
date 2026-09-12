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
import CountUp from "@/components/mg1/count-up"
import HeroDisc from "@/components/mg1/hero-disc"
import MetricRow from "@/components/mg1/metric-row"
import Parallax from "@/components/mg1/parallax"
import PopIn from "@/components/mg1/pop-in"
import RazonRow from "@/components/mg1/razon-row"

const OG_TITLE = "Propuesta DEF · Su noche + La Coronación MG1"
const OG_DESCRIPTION =
  "Coproducción para el 30 o el 31 de octubre: MG suma artistas, campaña y equipo a la noche que DEF ya tiene programada, y la cierra con la coronación del Concurso MG1."

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
          alt: "La Coronación MG1 — propuesta de coproducción con Def Jamaica Club, Soacha",
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
  { label: "Formato:", value: "Coproducción" },
  { label: "Fecha:", value: "30 o 31 de octubre" },
  { label: "Lugar:", value: "DEF · Soacha" },
]

const FECHAS = ["Vie 30 de octubre", "Sáb 31 de octubre"]

const MARQUEE_ITEMS = [
  "AQUÍ NO SE IMPROVISA, AQUÍ SE ESCRIBE",
  "CONCURSO MG1",
  "LA CORONACIÓN EN DEF",
  "SOACHA · OCTUBRE 2026",
]

// Por que DEF y no cualquier bar: cada razon cuelga de una cifra suya
const RAZONES: {
  value: number
  decimals?: number
  suffix?: string
  agrupar?: boolean
  unidad: string
  titulo: string
  desc: React.ReactNode
}[] = [
  {
    value: 2006,
    agrupar: false,
    unidad: "año de apertura",
    titulo: "Veinte años abriendo",
    desc: (
      <>
        Mike Style, su hermana Magda y unos amigos abrieron DEF en la zona rosa de Soacha
        cuando no había dónde sonar reggae al sur.{" "}
        <b className={hl}>Queremos estrenar MG1 en una casa con historia</b>, no en un
        salón alquilado.
      </>
    ),
  },
  {
    value: 1000,
    unidad: "artistas (aprox.)",
    titulo: "La primera tarima",
    desc: (
      <>
        De Aterciopelados y Systema Solar a los que nadie conocía todavía. Ese oficio —
        darle tarima al que empieza— <b className={hl}>es literalmente MG1</b>: 12
        emergentes y su primera producción de verdad.
      </>
    ),
  },
  {
    value: 65.6,
    decimals: 1,
    suffix: "%",
    unidad: "Bogotá y Soacha",
    titulo: "El público ya vive al lado",
    desc: (
      <>
        Es la porción de la interacción de nuestra campaña que sale de aquí. La gente que
        lleva un mes votando MG1 <b className={hl}>no hay que traerla</b>: hay que decirle
        dónde.
      </>
    ),
  },
  {
    value: 2,
    unidad: "pisos",
    titulo: "Show arriba, llegada abajo",
    desc: (
      <>
        La <b className={hl}>sala del segundo piso</b> para la coronación; la{" "}
        <b className={hl}>terraza de 360°</b> para el registro, la prensa y la barra. Un
        evento con 12 artistas necesita justo eso.
      </>
    ),
  },
]

// El trato en tres columnas: nadie llega con las manos vacias
const APORTES: { quien: string; titulo: string; items: string[]; destacado?: boolean }[] = [
  {
    quien: "Pone DEF",
    titulo: "La noche que ya tienen",
    items: [
      "La fecha y la casa",
      "Su cartel: headliners y DJs",
      "Sonido, luces, tarima y camerinos",
      "Su público de siempre",
      "La barra, que trabaja normal",
    ],
  },
  {
    quien: "Pone MG",
    titulo: "Lo que le sumamos",
    items: [
      "7 artistas más al cartel",
      "Los 12 del reality y sus públicos",
      "Cinco semanas de campaña andando",
      "Equipo audiovisual toda la noche",
      "Boletería con QR y base de asistentes",
    ],
  },
  {
    quien: "Sale",
    titulo: "Una sola noche",
    destacado: true,
    items: [
      "Su lineup, más grande",
      "Cierre con la coronación en vivo",
      "Estreno en YouTube desde su tarima",
      "Contenido profesional para los dos",
      "La casa llena a las 9, no a las 12",
    ],
  },
]

const SOPORTE = [
  { nombre: "Jony Roy", rol: "DJ y productor de los más respetados de la escena urbana" },
  { nombre: "Miguelacho TF", rol: "Cantante y productor, jurado de MG1" },
]

const TERCEROS = ["Lifoams", "MC Trocka", "Pyro", "Nikory", "+ Invitados"]

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
]

// La Gala del 11 de septiembre: la prueba de que la puerta la sabemos operar
const GALA = [
  { value: 62, unidad: "inscritos", nota: "en una lista privada, sin pauta" },
  { value: 80, unidad: "de aforo", nota: "cupo cerrado y lista de espera" },
  { value: 100, suffix: "%", unidad: "con pase QR", nota: "acreditación en la puerta" },
]

// La noche, hora por hora, montada sobre como abre la casa
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
        Entra con <b className={hl}>boleta QR</b> — el sistema lo ponemos nosotros y se
        escanea desde un celular. La barra trabaja desde el primer minuto.
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
    que: "Entra su cartel",
    desc: (
      <>
        Nos bajamos de la tarima y <b className={hl}>la noche sigue siendo de DEF</b>: sus
        headliners, sus DJs y la casa ya llena.
      </>
    ),
  },
]

const BENEFICIOS: { title: string; desc: React.ReactNode }[] = [
  {
    title: "La casa se llena temprano",
    desc: (
      <>
        Un show con 12 artistas y sus públicos no llega a medianoche:{" "}
        <b className={hl}>llega desde el principio</b>. Cuando el reality cierra, la gente
        ya está adentro y la barra lleva horas trabajando — la noche sigue, con su cartel
        y <b className={hl}>la casa llena</b>.
      </>
    ),
  },
  {
    title: "Si es el 31, es la antesala de Halloween",
    desc: (
      <>
        El sábado 31 la ciudad sale disfrazada. Cerrar temprano significa llegar a la{" "}
        <b className={hl}>noche de Halloween con la casa llena</b> y 12 artistas adentro.
        Si prefieren dejar el 31 para lo suyo,{" "}
        <b className={hl}>el viernes 30 nos sirve igual</b>.
      </>
    ),
  },
  {
    title: "Sede oficial dentro del show",
    desc: (
      <>
        DEF aparece como <b className={hl}>sede oficial de La Coronación</b>: mencionado
        en los capítulos, en el afiche del cartel y etiquetado en toda la campaña. Cada
        estreno semanal cierra invitando <b className={hl}>a su casa</b>.
      </>
    ),
  },
  {
    title: "Contenido profesional de la noche",
    desc: (
      <>
        Nuestro equipo cubre el evento completo. Les entregamos{" "}
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
    title: "Boletería con QR, y la lista de quién vino",
    desc: (
      <>
        Montamos la boletería digital: cada asistente entra con{" "}
        <b className={hl}>su QR individual</b>, que su equipo escanea desde un celular. Al
        final queda <b className={hl}>la base de quién estuvo</b> — público real y
        localizado, para llenar la siguiente. Ya lo corrimos en la Gala del 11 de
        septiembre.
      </>
    ),
  },
]

const TERMINOS: React.ReactNode[] = [
  <>
    <b className="text-white">La fecha y el horario:</b> viernes 30 o sábado 31 de
    octubre, y a qué hora arranca y cierra el show. Lo cuadramos con ustedes y ajustamos
    la campaña a lo que digan.
  </>,
  <>
    <b className="text-white">El cartel:</b> cómo se integran sus headliners y sus DJs con
    nuestros artistas, y en qué orden entra cada uno.
  </>,
  <>
    <b className="text-white">El modelo:</b> consumo mínimo, taquilla, barra o el que a
    DEF le funcione. Vamos con la mente abierta.
  </>,
  <>
    <b className="text-white">El anuncio:</b> cómo y cuándo se comunica, y qué piezas
    publica cada uno.
  </>,
]

const PLAN: { title: string; desc: React.ReactNode }[] = [
  {
    title: "Anuncio de la sede",
    desc: (
      <>
        Reel presentando la noche conjunta, en collab con los jurados y con{" "}
        <b className={hl}>@defjamaicaclub</b>.
      </>
    ),
  },
  {
    title: "Estreno de capítulos",
    desc: (
      <>
        9, 16 y 23 de octubre — y el día se acomoda al de DEF. Cada capítulo cierra
        invitando a la final en su casa.
      </>
    ),
  },
  {
    title: "Cartel del lineup",
    desc: <>El afiche conjunto, compartido por todos los artistas de los dos lados.</>,
  },
  {
    title: "Cuenta regresiva",
    desc: <>Historias diarias con el mapa a la Cra. 7, el evento y el registro con QR.</>,
  },
  {
    title: "La noche y lo que queda",
    desc: (
      <>
        Cobertura completa y, después, el material editado en manos de los dos —{" "}
        <b className={hl}>el video sigue trabajando cuando la noche ya pasó</b>.
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
                    [ MG Company · Propuesta de coproducción · DEF ]
                  </span>
                  <span className="h-px flex-1 bg-mg-red/40" />
                </div>

                <h1 className="mt-6 font-heading uppercase leading-[0.9] tracking-tight text-[clamp(2.75rem,9vw,7rem)]">
                  <span className="block text-stroke">Su noche.</span>
                  <span className="block text-mg-red">Nuestra coronación.</span>
                  <span className="block">Un solo evento.</span>
                </h1>

                <p className="mt-6 max-w-xl text-base leading-relaxed text-zinc-300 md:text-lg">
                  El 30 o el 31 de octubre DEF va a estar abierto con su cartel. Les
                  proponemos <b className={hl}>sumar a esa misma noche</b> el cierre del
                  primer reality musical de Soacha y Bogotá: nuestros artistas, nuestra
                  campaña y nuestro equipo, sobre su tarima.
                </p>

                <div className="mt-8 flex flex-wrap gap-3" role="list">
                  {FECHAS.map((fecha, i) => (
                    <PopIn key={fecha} delay={0.2 + i * 0.1} rotate={i === 0 ? -2 : 2}>
                      <div
                        role="listitem"
                        className={`border-2 px-6 py-4 ${
                          i === 0
                            ? "border-mg-red bg-mg-red"
                            : "border-white bg-white text-mg-black"
                        }`}
                      >
                        <p className="font-heading text-2xl uppercase leading-none tracking-wide md:text-3xl">
                          {fecha}
                        </p>
                      </div>
                    </PopIn>
                  ))}
                </div>
                <p className="mt-3 font-mono text-[10px] font-medium uppercase tracking-[0.25em] text-zinc-400 md:text-[11px]">
                  La fecha la eligen ustedes
                </p>

                <a
                  href={waUrl(
                    "Hola MG, somos DEF. Vimos la propuesta de coproducción de La Coronación MG1 y queremos hablar.",
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

      {/* 01 · La propuesta */}
      <section className="container mx-auto px-4 py-16 md:px-6 md:py-24 lg:px-10">
        <ScrollReveal direction="up" className="[&_.font-mono]:text-mg-red-bright">
          <SectionHeading
            index="01"
            kicker="La propuesta"
            title="Su noche, con nuestro cierre"
          />
        </ScrollReveal>

        <div className="mt-10 max-w-4xl md:mt-12">
          <BigStatement
            text="El 30 o el 31 DEF abre con su cartel."
            accent="Nosotros lo hacemos más grande."
            accentEnBloque
          />
          <ScrollReveal direction="up" delay={0.2}>
            <p className="mt-7 max-w-[62ch] text-base leading-relaxed text-zinc-300 md:text-lg">
              La propuesta es simple: una sola noche, coproducida.{" "}
              <b className={hl}>Su programación no se toca</b> — se le suman siete
              artistas al cartel, una campaña de cinco semanas que ya está andando y el
              cierre de un reality que se estrena en YouTube esa misma noche, en vivo,
              desde su tarima.
            </p>
          </ScrollReveal>
        </div>

        {/* Las tres columnas del trato */}
        <div className="mt-12 grid gap-6 md:mt-16 md:grid-cols-3 md:gap-5 lg:gap-6">
          {APORTES.map((col, i) => (
            <ScrollReveal key={col.quien} direction="up" delay={i * 0.12}>
              <div
                className={`relative h-full border-t-4 p-6 transition-transform duration-300 hover:-translate-y-1 md:p-7 ${
                  col.destacado
                    ? "border-mg-red bg-mg-red/10 [box-shadow:inset_0_0_0_1px_rgba(232,32,12,0.35)]"
                    : "border-white/25 bg-white/[0.03]"
                }`}
              >
                <span
                  className={`font-mono text-[10px] font-medium uppercase tracking-[0.28em] ${
                    col.destacado ? "text-mg-red-bright" : "text-white/45"
                  }`}
                >
                  {col.quien}
                </span>
                <h3 className="mt-2 font-heading text-2xl uppercase leading-tight tracking-wide">
                  {col.titulo}
                </h3>
                <ul className="mt-5 space-y-2.5">
                  {col.items.map((item, j) => (
                    <li
                      key={item}
                      className="flex gap-3 text-sm leading-relaxed text-zinc-300 md:text-[15px]"
                    >
                      <PopIn delay={i * 0.12 + j * 0.05}>
                        <span
                          aria-hidden="true"
                          className={`mt-[0.45rem] block h-2 w-2 shrink-0 ${
                            col.destacado ? "bg-mg-red" : "bg-white/40"
                          }`}
                        />
                      </PopIn>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                {/* El signo que une las columnas en desktop */}
                {i < APORTES.length - 1 && (
                  <PopIn
                    delay={0.3 + i * 0.12}
                    rotate={-90}
                    className="absolute -right-[1.35rem] top-1/2 z-10 hidden -translate-y-1/2 md:block lg:-right-[1.6rem]"
                  >
                    <span
                      aria-hidden="true"
                      className="flex h-9 w-9 items-center justify-center bg-mg-black font-heading text-2xl text-mg-red"
                    >
                      {i === 0 ? "+" : "="}
                    </span>
                  </PopIn>
                )}
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* 02 · Por qué DEF */}
      <section className="border-t border-white/10 bg-white/[0.02]">
        <div className="container mx-auto px-4 py-16 md:px-6 md:py-24 lg:px-10">
          <ScrollReveal direction="up" className="[&_.font-mono]:text-mg-red-bright">
            <SectionHeading
              index="02"
              kicker="Por qué ustedes"
              title="Esta propuesta es solo para DEF"
              subtitle={
                <>
                  No la estamos mandando a diez bares a ver quién contesta:{" "}
                  <b className={hl}>hay cuatro razones para escoger a DEF</b>.
                </>
              }
            />
          </ScrollReveal>

          <ul className="mt-12 border-t-2 border-mg-red md:mt-16">
            {RAZONES.map((razon, i) => (
              <RazonRow
                key={razon.titulo}
                index={i}
                value={razon.value}
                decimals={razon.decimals}
                suffix={razon.suffix}
                agrupar={razon.agrupar}
                unidad={razon.unidad}
                titulo={razon.titulo}
              >
                {razon.desc}
              </RazonRow>
            ))}
          </ul>

          <ScrollReveal direction="up" delay={0.15}>
            <p className="mt-10 max-w-[58ch] border-l-4 border-mg-red pl-6 text-sm leading-relaxed text-zinc-300 md:mt-12 md:text-base">
              <b className={hl}>MG1 en una línea:</b> 12 artistas emergentes, un mismo
              beat, cuatro capítulos con estreno semanal en YouTube desde el 9 de octubre
              y un campeón que corona el público. El final se estrena{" "}
              <b className={hl}>en el instante mismo de la coronación</b> — la única forma
              de verlo primero es estar ahí.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* 03 · Lo que sumamos al cartel */}
      <section className="bg-mg-black">
        <div className="container mx-auto px-4 py-16 text-center md:px-6 md:py-24 lg:px-10">
          <ScrollReveal direction="up">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.3em] text-mg-red-bright md:text-xs">
              [ 03 / El cartel ]
            </p>
            <h2 className="mt-4 font-heading uppercase leading-[0.9] tracking-tight text-[clamp(2.5rem,7vw,5rem)]">
              Lo que le sumamos
              <br />a su lineup
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-zinc-400 md:text-base">
              Todos confirmados y todos <b className="text-zinc-200">encima</b> de los
              headliners y DJs que ustedes ya tengan programados para esa noche.
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
              Junto a los 12 concursantes de MG1, cada uno moviendo a su propio público
              hacia la puerta de DEF esa noche.
            </p>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.2}>
            <div className="mt-12 inline-flex flex-wrap items-baseline justify-center gap-x-4 gap-y-1 border-2 border-white px-6 py-4 md:px-8">
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-300 md:text-xs">
                Alcance que entra al cartel
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

      {/* 04 · Los números */}
      <section className="border-t border-white/10 bg-white/[0.02]">
        <div className="container mx-auto px-4 py-16 md:px-6 md:py-24 lg:px-10">
          <ScrollReveal direction="up" className="[&_.font-mono]:text-mg-red-bright">
            <SectionHeading
              index="04"
              kicker="La tracción"
              title="La campaña ya está andando"
              subtitle={
                <>
                  No es una promesa de publicidad futura: es una máquina de{" "}
                  <b className={hl}>cinco semanas</b>, medida y{" "}
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

          {/* La Gala como prueba operativa */}
          <div className="mt-14 border-2 border-mg-red p-6 md:mt-20 md:p-10">
            <ScrollReveal direction="up">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.3em] text-mg-red-bright md:text-xs">
                [ La prueba · 11 de septiembre de 2026 ]
              </p>
              <h3 className="mt-3 font-heading uppercase leading-[0.95] tracking-tight text-[clamp(1.75rem,4.5vw,3rem)]">
                Ya operamos una puerta hace cinco semanas
              </h3>
              <p className="mt-4 max-w-[62ch] text-sm leading-relaxed text-zinc-300 md:text-base">
                La <b className={hl}>Gala MG</b> fue nuestro evento de cierre de
                convocatoria: lista privada, aforo cerrado y{" "}
                <b className={hl}>pase con QR</b> para entrar. Reunió a influencers,
                modelos, bailarines, managers y productores de la escena — y{" "}
                <b className={hl}>hoy sigue rodando en nuestras historias</b>. La misma
                operación es la que traemos a DEF.
              </p>
            </ScrollReveal>

            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              {GALA.map((dato, i) => (
                <ScrollReveal key={dato.unidad} direction="up" delay={i * 0.1}>
                  <div className="border-l-4 border-mg-red pl-4">
                    <CountUp
                      value={dato.value}
                      suffix={dato.suffix}
                      className="font-heading leading-none tracking-tight text-[clamp(2.25rem,6vw,3.25rem)]"
                    />
                    <p className="mt-1 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-mg-red-bright md:text-[11px]">
                      {dato.unidad}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-400 md:text-sm">
                      {dato.nota}
                    </p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <BrandMarquee items={MARQUEE_ITEMS} variant="outline" />

      {/* 05 · Qué gana DEF */}
      <section className="container mx-auto px-4 py-16 md:px-6 md:py-24 lg:px-10">
        <ScrollReveal direction="up" className="[&_.font-mono]:text-mg-red-bright">
          <SectionHeading
            index="05"
            kicker="El beneficio"
            title="Qué gana DEF"
            subtitle={
              <>
                La casa llena desde temprano, público local de 18 a 34, su nombre dentro
                del show y <b className={hl}>contenido profesional</b> que les queda.
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

      {/* 06 · La noche, hora por hora */}
      <section className="border-t border-white/10 bg-white/[0.02]">
        <div className="container mx-auto px-4 py-16 md:px-6 md:py-24 lg:px-10">
          <ScrollReveal direction="up" className="[&_.font-mono]:text-mg-red-bright">
            <SectionHeading
              index="06"
              kicker="La operación"
              title="Cómo se ve la noche en DEF"
              subtitle={
                <>
                  Así la vemos, montada sobre cómo ya funciona la casa: la sala arriba, la
                  terraza abajo y <b className={hl}>la barra abierta todo el tiempo</b>.
                  Las horas son una propuesta — <b className={hl}>se cuadran con ustedes</b>.
                </>
              }
            />
          </ScrollReveal>

          <ol className="mt-12 border-t border-white/10 md:mt-16">
            {MINUTO_A_MINUTO.map((paso, i) => (
              <ScrollReveal key={paso.hora} direction="up" delay={i * 0.07}>
                <li className="group grid grid-cols-12 items-baseline gap-x-4 gap-y-1 border-b border-white/10 py-5 transition-colors duration-300 md:py-6 md:hover:bg-white/[0.03]">
                  <p className="col-span-12 font-mono text-xs font-medium uppercase tracking-[0.2em] text-mg-red-bright md:col-span-2 md:text-sm">
                    {paso.hora}
                  </p>
                  <p className="col-span-12 font-heading text-xl uppercase tracking-wide transition-colors duration-300 group-hover:text-mg-red md:col-span-3 md:text-2xl">
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

      {/* 07 · Los términos + la campaña */}
      <section className="container mx-auto px-4 py-16 md:px-6 md:py-24 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <ScrollReveal
              direction="up"
              className="[&_.font-mono]:text-mg-red-bright [&_h2]:text-[clamp(2rem,4vw,3.25rem)]"
            >
              <SectionHeading
                index="07"
                kicker="La mesa"
                title="Lo que se sienta a negociar"
                subtitle={
                  <>
                    Nada de esto viene decidido. Si la idea les suena,{" "}
                    <b className={hl}>nos sentamos y lo cerramos punto por punto</b>.
                  </>
                }
              />
            </ScrollReveal>
            <ul className="mt-8 border-t border-white/10">
              {TERMINOS.map((item, i) => (
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
              <SectionHeading
                index="08"
                kicker="La campaña"
                title="El mes y medio de bombo"
                subtitle={
                  <>
                    Todo esto corre <b className={hl}>antes</b> de la noche, y DEF va
                    adentro desde la primera pieza.
                  </>
                }
              />
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
              Miramos toda la ciudad para cerrar la primera edición de MG1 y hay un
              solo sitio que lo reúne todo: <b>la casa que lleva veinte años dándole
              tarima al que empieza</b>, en el barrio donde ya vive nuestro público.
              Díganos cuál de las dos fechas les sirve y nos sentamos{" "}
              <b>20 minutos en DEF</b>. La campaña ya está corriendo —{" "}
              <b>el nombre de la sede es lo único que falta anunciar</b>.
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
