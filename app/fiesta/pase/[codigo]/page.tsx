import type { Metadata } from "next"
import { QRCodeSVG } from "qrcode.react"

import { CONTENIDO_EVENTOS, codigoDeEvento, fechaEvento, horaEvento } from "@/lib/eventos"
import { EventosNoDisponible, abrirPase, urlPase, type DatosPaseEvento } from "@/lib/eventos-datos"

export const dynamic = "force-dynamic"

// Un pase es de una persona y abre una puerta: ni se indexa ni se previsualiza.
export const metadata: Metadata = {
  title: "Tu pase · MG Company",
  robots: { index: false, follow: false, nocache: true },
}

export default async function PaseEventoPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo: bruto } = await params
  const codigo = codigoDeEvento(bruto)

  let pase: DatosPaseEvento | null = null
  let sinServicio = false
  if (codigo) {
    try {
      pase = await abrirPase(codigo)
    } catch (e) {
      if (!(e instanceof EventosNoDisponible)) throw e
      sinServicio = true
    }
  }

  if (!pase) {
    return (
      <Marco>
        <h1 className="font-heading text-5xl uppercase">{sinServicio ? "Ya volvemos" : "Pase no encontrado"}</h1>
        <p className="mt-4 text-zinc-400">
          {sinServicio
            ? "No pudimos cargar tu pase ahora mismo. Tu QR del correo sigue sirviendo."
            : "Revisa que el enlace esté completo. Si te registraste, el pase bueno está en tu correo."}
        </p>
      </Marco>
    )
  }

  const { evento } = pase
  const etiqueta = CONTENIDO_EVENTOS[evento.slug]?.etiqueta ?? "MG Company"

  return (
    <Marco>
      <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-mg-red">[ {etiqueta} ]</p>
      <h1 className="mt-3 font-heading text-5xl uppercase leading-[0.9]">{evento.nombre}</h1>
      <p className="mt-2 text-zinc-300">{pase.nombre}</p>

      {/* Fondo blanco y margen ancho: el lector de la puerta necesita
          contraste y una zona limpia alrededor, también en modo oscuro. */}
      <div className="mx-auto mt-7 w-fit bg-white p-5">
        <QRCodeSVG value={urlPase(pase.codigo)} size={248} level="M" marginSize={1} />
      </div>
      <p className="mt-4 font-mono text-2xl font-bold tracking-[0.14em]">{pase.codigo}</p>

      {pase.ingreso_at ? (
        <p className="mt-4 border border-white/20 px-3 py-2 text-sm text-zinc-300">
          Ya entraste a las{" "}
          {new Date(pase.ingreso_at).toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit", timeZone: "America/Bogota" })}
        </p>
      ) : (
        <p className="mt-3 text-sm text-zinc-500">Súbele el brillo a la pantalla en la puerta.</p>
      )}

      <dl className="mt-8 border-t border-white/10 pt-5 text-left text-sm">
        <div className="flex justify-between gap-4 py-1.5"><dt className="text-zinc-500">Cuándo</dt><dd>{fechaEvento(evento.fecha)}</dd></div>
        <div className="flex justify-between gap-4 py-1.5"><dt className="text-zinc-500">Puertas</dt><dd>{horaEvento(evento.hora_puertas)}</dd></div>
        <div className="flex justify-between gap-4 py-1.5"><dt className="text-zinc-500">Dónde</dt><dd className="text-right">{[evento.lugar, evento.direccion, evento.ciudad].filter(Boolean).join(" · ")}</dd></div>
      </dl>
      {evento.mapa_url ? (
        <a href={evento.mapa_url} target="_blank" rel="noopener noreferrer"
          className="mt-4 inline-block font-mono text-xs uppercase tracking-[0.2em] text-mg-red-bright underline underline-offset-4">
          Ver en el mapa →
        </a>
      ) : null}
    </Marco>
  )
}

function Marco({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh items-center justify-center border-t-8 border-mg-red bg-mg-black px-5 py-12 text-center text-white">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}
