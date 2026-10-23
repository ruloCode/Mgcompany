import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { CONTENIDO_EVENTOS } from "@/lib/eventos"
import { terminosDe } from "@/lib/eventos-terminos"

interface Props {
  params: Promise<{ evento: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { evento } = await params
  const t = terminosDe(evento)
  return {
    title: t ? `Términos y condiciones · ${t.titulo}` : "Términos y condiciones",
    robots: { index: false, follow: false },
  }
}

export default async function TerminosPage({ params }: Props) {
  const { evento } = await params
  const t = terminosDe(evento)
  if (!t) notFound()
  const etiqueta = CONTENIDO_EVENTOS[evento]?.etiqueta ?? "MG Company"

  return (
    <div className="min-h-svh bg-mg-black text-white">
      <header className="border-t-8 border-mg-red">
        <div className="container mx-auto max-w-3xl px-4 pb-8 pt-12 md:px-6 md:pt-16">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-mg-red">[ {etiqueta} ]</p>
          <h1 className="mt-4 font-heading text-[clamp(2.75rem,10vw,5rem)] uppercase leading-[0.9]">
            Términos y condiciones
          </h1>
          <p className="mt-3 text-zinc-400">{t.titulo}</p>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">
            Versión {t.version} · actualizados el {t.actualizados}
          </p>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-4 pb-20 md:px-6">
        {/* Índice: en un texto largo leído en el celular, saltar a "el premio"
            sin desplazarse por todo es lo que hace que de verdad se lea. */}
        <nav aria-label="Secciones" className="mb-10 border-y border-white/10 py-5">
          <ol className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
            {t.secciones.map((s, i) => (
              <li key={s.titulo}>
                <a href={`#s${i + 1}`} className="text-zinc-400 hover:text-white">
                  <span className="font-mono text-xs text-mg-red-bright">{String(i + 1).padStart(2, "0")}</span>{" "}
                  {s.titulo}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {t.secciones.map((s, i) => (
          <section key={s.titulo} id={`s${i + 1}`} className="mb-10 scroll-mt-6">
            <h2 className="flex gap-3 font-heading text-2xl uppercase leading-tight md:text-3xl">
              <span className="text-mg-red">{i + 1}.</span>
              <span>{s.titulo}</span>
            </h2>
            <div className="mt-4 space-y-3">
              {s.parrafos.map((p, j) => (
                <p key={j} className="flex gap-3 text-[15px] leading-relaxed text-zinc-300">
                  <span className="shrink-0 font-mono text-xs leading-[1.7rem] text-zinc-500">{i + 1}.{j + 1}</span>
                  <span>{p}</span>
                </p>
              ))}
            </div>
          </section>
        ))}

        <Link href={`/fiesta/${evento}`}
          className="inline-block border-2 border-white/25 px-5 py-3 font-mono text-xs uppercase tracking-[0.2em] hover:border-white/60">
          ← Volver al registro
        </Link>
      </main>
    </div>
  )
}
