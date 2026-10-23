"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { edadEn } from "@/lib/contacto"
import {
  EDAD_MINIMA,
  registroEventoSchema,
  type Genero,
  type RegistroEventoInput,
  type RespuestaRegistroEvento,
} from "@/lib/eventos"

/* El registro a una fiesta.

   Pensado primero para el celular, porque casi todo el mundo llega desde una
   historia o un chat de WhatsApp:
   - campos de 16px reales (menos y iOS hace zoom al enfocar) y 48px de alto;
   - la fecha de nacimiento como tres casillas numéricas y no como calendario:
     el selector nativo de Android abre en el año actual y obliga a retroceder
     veinte años de a uno;
   - los géneros como fichas y no como lista desplegable, en el orden barajado
     que manda el servidor. */

const inputClass =
  "w-full border-2 border-white/15 bg-white/[0.03] px-4 py-3.5 text-base text-white " +
  "placeholder:text-zinc-500 transition-colors focus:border-mg-red focus:outline-none " +
  "focus:ring-1 focus:ring-mg-red disabled:opacity-60"
const labelClass = "mb-2 block font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-400"
const errorClass = "mt-1.5 text-sm text-mg-red-bright"
const ayudaClass = "mt-1.5 text-xs text-zinc-500"

function Bloque({ index, titulo, children }: { index: string; titulo: string; children: React.ReactNode }) {
  return (
    <fieldset className="mt-10 first:mt-0">
      <legend className="mb-5 flex w-full items-center gap-3">
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.25em] text-mg-red-bright">
          [ {index} / {titulo} ]
        </span>
        <span className="h-px flex-1 bg-white/10" />
      </legend>
      {children}
    </fieldset>
  )
}

export default function RegistroEvento({
  evento, fechaEvento, generos, refInicial, utm, textoCompartir,
}: {
  evento: string
  /** Lo que acompaña al link cuando se comparte. Sale de CONTENIDO_EVENTOS. */
  textoCompartir: string
  fechaEvento: string
  /** Ya barajados por el servidor. */
  generos: { valor: Genero; label: string }[]
  refInicial: string
  utm: { utm_source: string; utm_medium: string; utm_campaign: string }
}) {
  const [errorServidor, setErrorServidor] = useState<string | null>(null)
  const [hecho, setHecho] = useState<(RespuestaRegistroEvento & { email: string }) | null>(null)
  const [dia, setDia] = useState("")
  const [mes, setMes] = useState("")
  const [anio, setAnio] = useState("")

  const {
    register, handleSubmit, setValue, setError, watch,
    formState: { errors, isSubmitting },
  } = useForm<RegistroEventoInput>({
    resolver: zodResolver(registroEventoSchema),
    defaultValues: {
      // acepta_invitaciones arranca en false a propósito: una casilla premarcada
      // no es consentimiento (Ley 1581), y esa casilla es la que habilita la pauta.
      evento, generos: [], acepta_invitaciones: false, ref: refInicial, website: "",
      fecha_nacimiento: "", ...utm,
    },
  })

  const marcados = watch("generos") ?? []
  const alternar = (g: Genero) =>
    setValue("generos", marcados.includes(g) ? marcados.filter((x) => x !== g) : [...marcados, g], { shouldDirty: true })
  const todos = marcados.length === generos.length
  const alternarTodos = () => setValue("generos", todos ? [] : generos.map((g) => g.valor), { shouldDirty: true })

  /** Las tres casillas componen el campo real. Una fecha imposible (31 de
   *  febrero) se queda vacía y la validación pide revisarla. */
  const componerFecha = (d: string, m: string, a: string) => {
    if (d.length < 1 || m.length < 1 || a.length !== 4) return setValue("fecha_nacimiento", "")
    const iso = `${a}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`
    const fecha = new Date(`${iso}T12:00:00`)
    const valida = !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === iso
    setValue("fecha_nacimiento", valida ? iso : "", { shouldValidate: Boolean(errors.fecha_nacimiento) })
  }

  async function enviar(datos: RegistroEventoInput) {
    setErrorServidor(null)

    // Lo mismo que hará el servidor, pero antes de esperar la red.
    if (edadEn(datos.fecha_nacimiento, fechaEvento) < EDAD_MINIMA) {
      setError("fecha_nacimiento", { message: `Tienes que tener ${EDAD_MINIMA} años cumplidos el día de la fiesta` })
      return
    }

    try {
      const res = await fetch("/api/eventos/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        const campos = (json.fields ?? {}) as Record<string, string[]>
        for (const [campo, msgs] of Object.entries(campos)) {
          setError(campo as keyof RegistroEventoInput, { message: msgs[0] })
        }
        setErrorServidor(json.error ?? "No pudimos registrarte. Intenta de nuevo.")
        return
      }
      setHecho({ ...(json as RespuestaRegistroEvento), email: datos.email })
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch {
      setErrorServidor("Sin conexión. Revisa tus datos móviles e intenta de nuevo.")
    }
  }

  if (hecho) return <Listo evento={evento} datos={hecho} textoCompartir={textoCompartir} />

  return (
    <form onSubmit={handleSubmit(enviar)} noValidate className="max-w-2xl">
      <input type="hidden" {...register("evento")} />
      <input type="hidden" {...register("ref")} />
      <input type="hidden" {...register("utm_source")} />
      <input type="hidden" {...register("utm_medium")} />
      <input type="hidden" {...register("utm_campaign")} />
      {/* Honeypot: invisible para personas, irresistible para bots. */}
      <div aria-hidden className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
        <label>No llenes este campo<input tabIndex={-1} autoComplete="off" {...register("website")} /></label>
      </div>

      <Bloque index="01" titulo="Tus datos">
        <div className="grid gap-5">
          <div>
            <label htmlFor="ev-nombre" className={labelClass}>Nombre y apellido</label>
            <input id="ev-nombre" autoComplete="name" className={inputClass} placeholder="Ej: Laura Gómez"
              aria-invalid={!!errors.nombre} {...register("nombre")} />
            {errors.nombre && <p className={errorClass}>{errors.nombre.message}</p>}
          </div>

          <div>
            <label htmlFor="ev-email" className={labelClass}>Correo</label>
            <input id="ev-email" type="email" inputMode="email" autoCapitalize="off" autoCorrect="off" spellCheck={false}
              autoComplete="email" className={inputClass} placeholder="tu@correo.com"
              aria-invalid={!!errors.email} aria-describedby="ev-email-ayuda" {...register("email")} />
            <p id="ev-email-ayuda" className={ayudaClass}>Aquí llega tu QR. Sin él no se entra, así que revísalo bien.</p>
            {errors.email && <p className={errorClass}>{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="ev-whatsapp" className={labelClass}>WhatsApp</label>
            <input id="ev-whatsapp" type="tel" inputMode="tel" autoComplete="tel" className={inputClass}
              placeholder="300 123 4567" aria-invalid={!!errors.whatsapp} {...register("whatsapp")} />
            {errors.whatsapp && <p className={errorClass}>{errors.whatsapp.message}</p>}
          </div>

          <div>
            <span className={labelClass}>Fecha de nacimiento</span>
            <input type="hidden" {...register("fecha_nacimiento")} />
            <div className="grid grid-cols-[1fr_1fr_1.5fr] gap-3" role="group" aria-label="Fecha de nacimiento">
              <input inputMode="numeric" maxLength={2} placeholder="DD" aria-label="Día" className={inputClass}
                autoComplete="bday-day" value={dia}
                onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); setDia(v); componerFecha(v, mes, anio) }} />
              <input inputMode="numeric" maxLength={2} placeholder="MM" aria-label="Mes" className={inputClass}
                autoComplete="bday-month" value={mes}
                onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); setMes(v); componerFecha(dia, v, anio) }} />
              <input inputMode="numeric" maxLength={4} placeholder="AAAA" aria-label="Año" className={inputClass}
                autoComplete="bday-year" value={anio}
                onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); setAnio(v); componerFecha(dia, mes, v) }} />
            </div>
            <p className={ayudaClass}>Es una fiesta para mayores de {EDAD_MINIMA}.</p>
            {errors.fecha_nacimiento && <p className={errorClass}>{errors.fecha_nacimiento.message}</p>}
          </div>
        </div>
      </Bloque>

      <Bloque index="02" titulo="Tus redes">
        <p className="-mt-1 mb-5 text-sm text-zinc-400">Déjanos al menos una. Es la que vamos a mirar para la botella.</p>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="ev-ig" className={labelClass}>Instagram</label>
            <input id="ev-ig" autoCapitalize="off" autoCorrect="off" spellCheck={false} className={inputClass}
              placeholder="@tucuenta" aria-invalid={!!errors.instagram} {...register("instagram")} />
            {errors.instagram && <p className={errorClass}>{errors.instagram.message}</p>}
          </div>
          <div>
            <label htmlFor="ev-tt" className={labelClass}>TikTok</label>
            <input id="ev-tt" autoCapitalize="off" autoCorrect="off" spellCheck={false} className={inputClass}
              placeholder="@tucuenta" aria-invalid={!!errors.tiktok} {...register("tiktok")} />
            {errors.tiktok && <p className={errorClass}>{errors.tiktok.message}</p>}
          </div>
        </div>
      </Bloque>

      <Bloque index="03" titulo="Música en vivo">
        <div className="-mt-1 mb-5 flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm text-zinc-400">¿Qué te gusta escuchar en vivo? Marca todas las que quieras.</p>
          <button type="button" onClick={alternarTodos}
            className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-400 underline underline-offset-4 hover:text-white">
            {todos ? "Quitar todas" : "Marcar todas"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {generos.map((g) => {
            const on = marcados.includes(g.valor)
            return (
              <button key={g.valor} type="button" onClick={() => alternar(g.valor)} aria-pressed={on}
                className={`min-h-[44px] border-2 px-4 py-2 text-sm transition-colors ${
                  on ? "border-mg-red bg-mg-red text-white" : "border-white/15 text-zinc-300 hover:border-white/40"
                }`}>
                {on ? "✓ " : ""}{g.label}
              </button>
            )
          })}
        </div>
      </Bloque>

      <Bloque index="04" titulo="Autorizaciones">
        <label className="flex cursor-pointer gap-3 text-sm leading-relaxed text-zinc-300">
          <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-[#E8200C]" {...register("acepta_datos")} />
          <span>
            Acepto los{" "}
            <a href={`/fiesta/${evento}/terminos`} target="_blank" rel="noopener noreferrer"
              className="text-white underline underline-offset-4">términos y condiciones</a>
            {" "}del evento y autorizo a MG Company a tratar mis datos para gestionar mi registro y mi entrada (Ley 1581 de 2012).
          </span>
        </label>
        {errors.acepta_datos && <p className={errorClass}>{errors.acepta_datos.message}</p>}
        <label className="mt-4 flex cursor-pointer gap-3 text-sm leading-relaxed text-zinc-300">
          <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-[#E8200C]" {...register("acepta_invitaciones")} />
          <span>Quiero que me inviten a las próximas fiestas y eventos de MG.</span>
        </label>
      </Bloque>

      {errorServidor && (
        <div role="alert" className="mt-8 border-2 border-mg-red/60 bg-mg-red/10 px-4 py-3 text-sm text-white">{errorServidor}</div>
      )}

      <button type="submit" disabled={isSubmitting}
        className="mt-8 w-full bg-mg-red px-6 py-4 font-mono text-sm font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-mg-red/90 disabled:opacity-60 sm:w-auto">
        {/* "Confirmar mi lugar" y no "Quiero mi QR": quien llega con una
            invitación confirma algo que ya es suyo, no pide un favor. */}
        {isSubmitting ? "Confirmando…" : "Confirmar mi lugar"}
      </button>
    </form>
  )
}

/* ---------- después de registrarse ---------- */

function Listo({ evento, datos, textoCompartir }: {
  evento: string
  datos: RespuestaRegistroEvento & { email: string }
  textoCompartir: string
}) {
  const [copiado, setCopiado] = useState(false)
  const link = typeof window !== "undefined" ? `${window.location.origin}/fiesta/${evento}?ref=${datos.ref}` : ""
  const mensaje = `${textoCompartir} ${link}`

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      /* Sin permiso de portapapeles: el link sigue a la vista para copiarlo a mano. */
    }
  }

  return (
    <div className="max-w-2xl" role="status">
      <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-mg-red-bright">
        [ {datos.nuevo ? "Estás en la lista" : "Ya estabas en la lista"} ]
      </p>
      <h2 className="mt-4 font-heading text-5xl uppercase leading-[0.9] text-white md:text-6xl">Revisa tu correo</h2>
      <p className="mt-5 text-base leading-relaxed text-zinc-300">
        {datos.nuevo ? "Te mandamos tu QR a " : "Te volvimos a mandar tu QR a "}
        <b className="text-white">{datos.email}</b>. Si no lo ves en unos minutos, búscalo en Promociones o en Spam.
      </p>
      <p className="mt-3 text-sm text-zinc-500">Tómale captura al QR: en la puerta puede no haber señal.</p>

      <div className="mt-10 border-2 border-white/15 p-5 md:p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-mg-red-bright">🍾 Tu link para invitar</p>
        <p className="mt-3 text-sm leading-relaxed text-zinc-300">
          Compártelo con tu parche. La gente que llegue a la fiesta con este link te suma para la botella.
        </p>
        <p className="mt-4 break-all border border-white/10 bg-white/[0.03] px-3 py-3 font-mono text-sm text-white">{link}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <a href={`https://wa.me/?text=${encodeURIComponent(mensaje)}`} target="_blank" rel="noopener noreferrer"
            className="flex min-h-[48px] items-center justify-center bg-[#25D366] px-4 font-mono text-xs font-bold uppercase tracking-[0.18em] text-black">
            Mandar por WhatsApp
          </a>
          <button type="button" onClick={copiar}
            className="min-h-[48px] border-2 border-white/25 px-4 font-mono text-xs font-bold uppercase tracking-[0.18em] text-white hover:border-white/60">
            {copiado ? "✓ Copiado" : "Copiar link"}
          </button>
        </div>
      </div>
    </div>
  )
}
