import { existsSync } from "fs"
import { join } from "path"
import type { Metadata } from "next"
import BrandMarquee from "@/components/brand-marquee"
import DiagonalArrow from "@/components/diagonal-arrow"
import ScrollProgress from "@/components/scroll-progress"
import ScrollReveal from "@/components/scroll-reveal"
import SectionHeading from "@/components/section-heading"
import SpecMeta from "@/components/spec-meta"
import FaqAccordion, { type FaqItem } from "@/components/mg1/faq-accordion"
import Parallax from "@/components/mg1/parallax"
import PopIn from "@/components/mg1/pop-in"
import StatItem from "@/components/mg1/stat-item"
import Cronograma from "@/components/gala/cronograma"
import CtaFlotante from "@/components/gala/cta-flotante"
import CuentaRegresiva from "@/components/gala/cuenta-regresiva"
import MedidorCupo from "@/components/gala/medidor-cupo"
import RegistroGalaForm from "@/components/gala/registro-form"
import { getSupabaseAdmin } from "@/lib/supabase-admin"
import {
  GALA_CIUDAD,
  GALA_CUPO,
  GALA_EDICION,
  GALA_FECHA,
  GALA_HORARIO,
  GALA_HORA_FIN_TXT,
  GALA_HORA_INICIO,
  GALA_HORA_INICIO_TXT,
  GALA_REPARTO,
  fechaLarga,
} from "@/lib/gala"

export const dynamic = "force-dynamic"

const OG_TITLE = "Gala MG · Primer encuentro de la comunidad"
const OG_DESCRIPTION =
  "11 de octubre, 5:00 a 9:00 p.m. El primer evento presencial de la comunidad MG: 80 lugares, sin cover, solo con registro confirmado."

export function generateMetadata(): Metadata {
  const custom = "/og/og-gala.jpg"
  const ogImage = existsSync(join(process.cwd(), "public", custom)) ? custom : "/og/og-home.jpg"

  return {
    title: "Gala MG · Registro | MG Company Group",
    description: OG_DESCRIPTION,
    alternates: { canonical: "/gala" },
    openGraph: {
      type: "website",
      locale: "es_CO",
      siteName: "MG Company Group",
      url: "/gala",
      title: OG_TITLE,
      description: OG_DESCRIPTION,
      images: [{ url: ogImage, width: 1200, height: 630, alt: "Gala MG — 11 de octubre" }],
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

const MARQUEE = [
  "GALA MG",
  "11 DE OCTUBRE",
  "EVENTO PRIVADO",
  "80 LUGARES",
  "SIN COVER",
]

const ACCESO = [
  {
    num: "1",
    title: "Te registras",
    desc: (
      <>
        Llenas el formulario. Toma <b className={hl}>menos de un minuto</b> y no tiene
        costo.
      </>
    ),
  },
  {
    num: "2",
    title: "El equipo confirma",
    desc: (
      <>
        Revisamos <b className={hl}>uno por uno</b>. La sala es de 80 personas y hay que
        cuidar quién entra.
      </>
    ),
  },
  {
    num: "3",
    title: "Llega tu QR",
    desc: (
      <>
        Al confirmarte te llega el <b className={hl}>código por WhatsApp</b>. Es lo único
        que abre la puerta.
      </>
    ),
  },
]

const FAQ: FaqItem[] = [
  {
    question: "¿Tiene costo?",
    answer: (
      <>
        No. La Gala es <b className="text-white">sin cover</b>: es un encuentro de la
        comunidad, no una boletería.
      </>
    ),
  },
  {
    question: "¿Me registro y ya entré?",
    answer: (
      <>
        No. Todos los registros entran <b className="text-white">por revisar</b> y el
        equipo confirma a mano. Solo cuando quedas confirmado se genera tu QR y te llega
        por WhatsApp.
      </>
    ),
  },
  {
    question: "¿Qué pasa si el cupo ya se llenó?",
    answer: (
      <>
        Quedas en <b className="text-white">lista de espera</b>, no rechazado. Si alguien
        cae, el equipo escribe por WhatsApp en orden de llegada.
      </>
    ),
  },
  {
    question: "¿Puedo llevar acompañante?",
    answer: (
      <>
        Cada artista confirmado tiene <b className="text-white">dos invitaciones</b>. Si no
        eres artista del roster, cada persona se registra por separado: el QR es
        individual e intransferible.
      </>
    ),
  },
  {
    question: "¿Dónde es?",
    answer: (
      <>
        En {GALA_CIUDAD}. La dirección exacta se envía por WhatsApp junto con el QR: es un
        evento privado y por eso no se publica.
      </>
    ),
  },
]

/** Cuántas sillas quedan. Se lee en el servidor para que el número ya venga
 *  pintado en el HTML — un contador que aparece medio segundo tarde en un
 *  celular lento se lee como si no hubiera cupo. */
async function ocupacion(): Promise<number> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return 0

  const { count } = await supabase
    .from("gala_registros")
    .select("id", { count: "exact", head: true })
    .eq("edicion", GALA_EDICION)
    .in("estado", ["pending", "confirmed"])

  return count ?? 0
}

export default async function GalaPage() {
  const ocupados = await ocupacion()
  const restantes = Math.max(0, GALA_CUPO - ocupados)

  const HERO_META = [
    { label: "Fecha:", value: fechaLarga() },
    { label: "Hora:", value: `${GALA_HORA_INICIO_TXT} – ${GALA_HORA_FIN_TXT}` },
    { label: "Ciudad:", value: GALA_CIUDAD },
    { label: "Cover:", value: "Sin costo" },
  ]

  return (
    <>
      <ScrollProgress />
      <CtaFlotante />

      {/* Hero */}
      <header className="relative overflow-hidden border-b border-white/10">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-1/3 -top-1/4 h-[70vh] w-[70vh] rounded-full bg-mg-red/20 blur-[120px]"
        />

        <div className="container relative mx-auto grid grid-cols-12 gap-8 px-4 pb-14 pt-10 md:px-6 md:pb-20 md:pt-16 lg:px-10">
          <div className="col-span-12 lg:col-span-7">
            <ScrollReveal direction="up">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 animate-pulse rounded-full bg-mg-red" />
                <p className="font-mono text-[11px] font-medium uppercase tracking-[0.28em] text-mg-red-bright md:text-xs">
                  [ Evento privado · Registro abierto ]
                </p>
              </div>

              <h1 className="mt-5 font-heading uppercase leading-[0.88] tracking-tight text-[clamp(3.25rem,15vw,8rem)]">
                <span className="block">Gala</span>
                <span className="block text-mg-red">MG</span>
              </h1>

              <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-zinc-300 md:text-lg">
                El <b className={hl}>primer encuentro presencial</b> de la comunidad MG.
                Una noche, {GALA_CUPO} personas y la escena entera en la misma sala:
                artistas, managers y productores. <b className={hl}>Sin cover</b> — pero
                solo se entra con registro confirmado.
              </p>

              <div className="mt-8">
                <CuentaRegresiva iso={`${GALA_FECHA}T${GALA_HORA_INICIO}:00-05:00`} />
              </div>

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

              <div className="mt-8 border-l-4 border-mg-red pl-5">
                <SpecMeta items={HERO_META} className="[&_dd]:text-mg-red-bright" />
              </div>
            </ScrollReveal>
          </div>

          <div className="col-span-12 lg:col-span-5">
            <ScrollReveal direction="up" delay={0.15}>
              <Parallax from={0} to={40}>
                <MedidorCupo ocupados={ocupados} />
              </Parallax>
            </ScrollReveal>
          </div>
        </div>
      </header>

      <BrandMarquee items={MARQUEE} variant="red" />

      {/* 01 · Quiénes estarán */}
      <section className="container mx-auto px-4 py-14 md:px-6 md:py-24 lg:px-10">
        <ScrollReveal direction="up" className="[&_.font-mono]:text-mg-red-bright">
          <SectionHeading
            index="01"
            kicker="La sala"
            title="Quiénes estarán"
            subtitle={
              <>
                La Gala no es un show con público: es la comunidad MG reunida por primera
                vez. Por eso el aforo es de <b className={hl}>{GALA_CUPO} personas</b> y por
                eso cada registro se revisa.
              </>
            }
          />
        </ScrollReveal>

        <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3 md:mt-14">
          {GALA_REPARTO.map((r, i) => (
            <StatItem key={r.label} value={r.valor} label={r.label} sub={r.sub} index={i} />
          ))}
        </div>
      </section>

      {/* 02 · Cronograma */}
      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="container mx-auto px-4 py-14 md:px-6 md:py-24 lg:px-10">
          <ScrollReveal direction="up" className="[&_.font-mono]:text-mg-red-bright">
            <SectionHeading
              index="02"
              kicker="La noche"
              title="Cronograma"
              subtitle={
                <>
                  Cuatro horas, de {GALA_HORARIO} Llega temprano: la
                  acreditación con QR toma unos minutos y el showcase empieza puntual.
                </>
              }
            />
          </ScrollReveal>

          <div className="mt-10 md:mt-16">
            <Cronograma />
          </div>
        </div>
      </section>

      {/* 03 · Cómo se entra */}
      <section className="container mx-auto px-4 py-14 md:px-6 md:py-24 lg:px-10">
        <ScrollReveal direction="up" className="[&_.font-mono]:text-mg-red-bright">
          <SectionHeading
            index="03"
            kicker="El acceso"
            title="Cómo se entra"
            subtitle={
              <>
                Registrarte te pone en la lista, no en la sala. El equipo MG confirma uno
                por uno y <b className={hl}>el QR solo existe cuando estás confirmado</b>.
              </>
            }
          />
        </ScrollReveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-3 md:mt-14 md:gap-6">
          {ACCESO.map((paso, i) => (
            <ScrollReveal key={paso.num} direction="up" delay={i * 0.08}>
              <div className="h-full border-t-4 border-mg-red bg-white/[0.03] p-6 transition-transform duration-300 hover:-translate-y-1">
                <PopIn delay={i * 0.08 + 0.15} rotate={-90}>
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-mg-red font-heading text-xl">
                    {paso.num}
                  </span>
                </PopIn>
                <h3 className="mt-5 font-heading text-2xl uppercase tracking-wide">
                  {paso.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-300">{paso.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <BrandMarquee items={MARQUEE} variant="outline" />

      {/* 04 · Registro */}
      <section id="registro" className="scroll-mt-20">
        <div className="container mx-auto px-4 py-14 md:px-6 md:py-24 lg:px-10">
          <ScrollReveal direction="up" className="[&_.font-mono]:text-mg-red-bright">
            <SectionHeading
              index="04"
              kicker="Tu lugar"
              title="Regístrate"
              subtitle={
                <>
                  {restantes > 0 ? (
                    <>
                      Quedan <b className={hl}>{restantes} de {GALA_CUPO}</b> lugares.
                    </>
                  ) : (
                    <>
                      El aforo está completo: tu registro entra a{" "}
                      <b className={hl}>lista de espera</b>.
                    </>
                  )}{" "}
                  Deja tu WhatsApp bien escrito — por ahí llega la confirmación y el QR.
                </>
              }
            />
          </ScrollReveal>

          <div className="mt-10 md:mt-14">
            <RegistroGalaForm restantes={restantes} />
          </div>
        </div>
      </section>

      {/* 05 · Preguntas */}
      <section className="border-t border-white/10 bg-white/[0.02]">
        <div className="container mx-auto px-4 py-14 md:px-6 md:py-24 lg:px-10">
          <ScrollReveal direction="up" className="[&_.font-mono]:text-mg-red-bright">
            <SectionHeading index="05" kicker="Dudas" title="Preguntas frecuentes" />
          </ScrollReveal>

          <div className="mt-10 max-w-3xl md:mt-14">
            <FaqAccordion items={FAQ} />
          </div>

          <p className="mt-12 max-w-3xl font-mono text-[11px] uppercase leading-relaxed tracking-[0.18em] text-zinc-500">
            MG Company se reserva el derecho de admisión y permanencia · El pase es único e
            intransferible · Tus datos se usan solo para la gestión de este evento
          </p>
        </div>
      </section>

      {/* Aire para que la barra fija del móvil no tape el último bloque */}
      <div aria-hidden className="h-20 md:hidden" />
    </>
  )
}
