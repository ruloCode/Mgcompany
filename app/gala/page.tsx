import type { Metadata } from "next"
import BrandMarquee from "@/components/brand-marquee"
import ScrollProgress from "@/components/scroll-progress"
import ScrollReveal from "@/components/scroll-reveal"
import SectionHeading from "@/components/section-heading"
import FaqAccordion, { type FaqItem } from "@/components/mg1/faq-accordion"
import PopIn from "@/components/mg1/pop-in"
import StatItem from "@/components/mg1/stat-item"
import Cronograma from "@/components/gala/cronograma"
import CtaFlotante from "@/components/gala/cta-flotante"
import HeroGala from "@/components/gala/hero"
import RegistroGalaForm from "@/components/gala/registro-form"
import { GALA_CIUDAD, GALA_CUPO, GALA_HORARIO, GALA_REPARTO } from "@/lib/gala"

export const dynamic = "force-dynamic"

const OG_TITLE = "Gala MG · Primer encuentro de la comunidad"
const OG_DESCRIPTION =
  "Viernes 11 de septiembre, 6:00 a 9:00 p.m. El primer evento presencial de la comunidad MG: 80 lugares, sin cover, solo con registro confirmado."

/* La tarjeta OG se referencia directo, sin comprobar que el archivo exista.
   El truco de existsSync que usan las páginas estáticas no sirve aquí: esta
   ruta es dinámica, así que generateMetadata corre en el lambda, y Next no
   incluye public/ en el bundle de la función — el archivo se sirve desde el
   CDN pero desde dentro no se ve, y la comprobación caía siempre al OG
   genérico. Se regenera con scripts/generar-og-gala.mjs. */
export function generateMetadata(): Metadata {
  const ogImage = "/og/og-gala.jpg"

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
      images: [{ url: ogImage, width: 1200, height: 630, alt: "Gala MG — viernes 11 de septiembre" }],
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
  "VIERNES 11 DE SEPTIEMBRE",
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
        Al confirmarte te llega el <b className={hl}>código a tu correo</b>. Es lo único
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
        <b className="text-white"> a tu correo</b>.
      </>
    ),
  },
  {
    question: "¿Qué pasa si el cupo ya se llenó?",
    answer: (
      <>
        Quedas en <b className="text-white">lista de espera</b>, no rechazado. Si alguien
        cae, el equipo escribe por correo en orden de llegada.
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
        En {GALA_CIUDAD}. La dirección exacta va en el correo de confirmación, junto con el
        QR: es un evento privado y por eso no se publica.
      </>
    ),
  },
]

export default function GalaPage() {
  return (
    <>
      <ScrollProgress />
      <CtaFlotante />

      <HeroGala />

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
                  Tres horas, de {GALA_HORARIO} Llega temprano: la acreditación con QR
                  toma unos minutos y el showcase empieza puntual.
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
                  La sala es de <b className={hl}>{GALA_CUPO} personas</b> y cada registro
                  se revisa a mano. Deja tu <b className={hl}>correo bien escrito</b> — por
                  ahí llegan la confirmación y el QR de entrada.
                </>
              }
            />
          </ScrollReveal>

          <div className="mt-10 md:mt-14">
            <RegistroGalaForm />
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
