"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import DiagonalArrow from "@/components/diagonal-arrow"
import {
  GALA_BARRIO,
  GALA_CIUDAD,
  GALA_CUPO,
  GALA_DIRECCION,
  GALA_MAPS,
  GALA_FECHA,
  GALA_HORA_FIN_TXT,
  GALA_HORA_INICIO_TXT,
  RANGOS_EDAD,
  TIPOS_ASISTENTE,
  fechaLarga,
  registroGalaSchema,
  type RegistroGalaInput,
  type RespuestaRegistro,
} from "@/lib/gala"

/* Formulario de registro a la Gala.
   Pensado primero para el celular: el 90% llega desde una historia de
   Instagram. De ahí las decisiones que se ven raras en desktop —
   - inputs de 16px reales (menos de eso y iOS hace zoom al enfocar),
   - alturas de 48px (el mínimo táctil de Apple y de las WCAG),
   - el tipo de asistente y la edad como fichas y no como <select>, porque un
     desplegable nativo en móvil tapa la pantalla y esconde el resto. */

const inputClass =
  "w-full border-2 border-white/15 bg-white/[0.03] px-4 py-3.5 text-base text-white " +
  "placeholder:text-zinc-500 transition-colors focus:border-mg-red focus:outline-none " +
  "focus:ring-1 focus:ring-mg-red disabled:opacity-60"

const labelClass =
  "mb-2 block font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-400"

const errorClass = "mt-1.5 text-sm text-mg-red-bright"

function Bloque({ index, titulo, children }: { index: string; titulo: string; children: React.ReactNode }) {
  return (
    <fieldset className="mt-9 first:mt-0">
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

export default function RegistroGalaForm() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [resultado, setResultado] = useState<RespuestaRegistro | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegistroGalaInput>({
    resolver: zodResolver(registroGalaSchema),
    defaultValues: { acepta_terminos: true, tipo_asistente: undefined, rango_edad: undefined },
  })

  const tipo = watch("tipo_asistente")
  const edad = watch("rango_edad")

  const onSubmit = async (data: RegistroGalaInput) => {
    setServerError(null)
    try {
      const res = await fetch("/api/gala/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const payload = await res.json().catch(() => ({}))

      if (!res.ok) {
        setServerError(payload.error ?? "No pudimos enviar tu registro. Intenta de nuevo.")
        return
      }
      setResultado(payload as RespuestaRegistro)
    } catch {
      setServerError("Revisa tu conexión e intenta de nuevo.")
    }
  }

  if (resultado) return <Confirmacion resultado={resultado} />

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-2xl">
      <Bloque index="01" titulo="Quién eres">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className={labelClass} htmlFor="nombre_completo">
              Nombre completo *
            </label>
            <input
              id="nombre_completo"
              type="text"
              autoComplete="name"
              placeholder="Como aparece en tu cédula"
              className={inputClass}
              disabled={isSubmitting}
              aria-invalid={errors.nombre_completo ? true : undefined}
              aria-describedby={errors.nombre_completo ? "nombre_completo-error" : undefined}
              {...register("nombre_completo")}
            />
            {errors.nombre_completo && (
              <p id="nombre_completo-error" className={errorClass}>
                {errors.nombre_completo.message}
              </p>
            )}
          </div>

          <div>
            <label className={labelClass} htmlFor="email">
              Correo *
            </label>
            <input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="tu@correo.com"
              className={inputClass}
              disabled={isSubmitting}
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? "email-error" : "email-ayuda"}
              {...register("email")}
            />
            {errors.email ? (
              <p id="email-error" className={errorClass}>
                {errors.email.message}
              </p>
            ) : (
              <p id="email-ayuda" className="mt-1.5 text-xs text-zinc-500">
                Aquí te llega la confirmación y el QR.
              </p>
            )}
          </div>

          <div>
            <label className={labelClass} htmlFor="celular">
              Celular / WhatsApp *
            </label>
            <input
              id="celular"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+57 300 123 4567"
              className={inputClass}
              disabled={isSubmitting}
              aria-invalid={errors.celular ? true : undefined}
              aria-describedby={errors.celular ? "celular-error" : "celular-ayuda"}
              {...register("celular")}
            />
            {errors.celular ? (
              <p id="celular-error" className={errorClass}>
                {errors.celular.message}
              </p>
            ) : (
              <p id="celular-ayuda" className="mt-1.5 text-xs text-zinc-500">
                Solo para avisos de último momento.
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className={labelClass} htmlFor="nombre_artistico">
              Nombre artístico <span className="text-zinc-600">(opcional)</span>
            </label>
            <input
              id="nombre_artistico"
              type="text"
              autoComplete="nickname"
              placeholder="¿Cómo te conocen en la escena?"
              className={inputClass}
              disabled={isSubmitting}
              {...register("nombre_artistico")}
            />
            {errors.nombre_artistico && (
              <p className={errorClass}>{errors.nombre_artistico.message}</p>
            )}
          </div>
        </div>
      </Bloque>

      <Bloque index="02" titulo="Cómo llegas">
        <fieldset>
          <legend className={labelClass}>Tipo de asistente *</legend>
          <div className="grid grid-cols-2 gap-3">
            {TIPOS_ASISTENTE.map((t) => {
              const activo = tipo === t.valor
              return (
                <label
                  key={t.valor}
                  className={`relative flex min-h-[56px] cursor-pointer items-center border-2 px-4 py-3 text-sm transition-colors ${
                    activo
                      ? "border-mg-red bg-mg-red/15 text-white"
                      : "border-white/15 bg-white/[0.03] text-zinc-300 hover:border-white/30"
                  }`}
                >
                  <input
                    type="radio"
                    value={t.valor}
                    className="sr-only"
                    disabled={isSubmitting}
                    {...register("tipo_asistente")}
                  />
                  <span className="font-medium leading-tight">{t.label}</span>
                  {activo && (
                    <motion.span
                      layoutId="tipo-activo"
                      className="absolute -left-[2px] top-0 h-full w-1 bg-mg-red"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </label>
              )
            })}
          </div>
          {errors.tipo_asistente && <p className={errorClass}>{errors.tipo_asistente.message}</p>}
        </fieldset>

        <fieldset className="mt-6">
          <legend className={labelClass}>Rango de edad *</legend>
          <div className="flex flex-wrap gap-2.5">
            {RANGOS_EDAD.map((r) => {
              const activo = edad === r
              return (
                <label
                  key={r}
                  className={`min-h-[44px] cursor-pointer border-2 px-4 py-2.5 font-mono text-sm tracking-wide transition-colors ${
                    activo
                      ? "border-mg-red bg-mg-red text-white"
                      : "border-white/15 bg-white/[0.03] text-zinc-300 hover:border-white/30"
                  }`}
                >
                  <input
                    type="radio"
                    value={r}
                    className="sr-only"
                    disabled={isSubmitting}
                    {...register("rango_edad")}
                  />
                  {r}
                </label>
              )
            })}
          </div>
          {errors.rango_edad && <p className={errorClass}>{errors.rango_edad.message}</p>}
        </fieldset>
      </Bloque>

      <Bloque index="03" titulo="Dónde te seguimos">
        <p className="-mt-2 mb-4 text-sm text-zinc-400">
          Opcional, pero ayuda: así el equipo sabe a quién está recibiendo.
        </p>
        <div className="grid gap-5 md:grid-cols-2">
          {(
            [
              { name: "instagram", label: "Instagram", placeholder: "tuusuario" },
              { name: "tiktok", label: "TikTok", placeholder: "tuusuario" },
            ] as const
          ).map((red) => (
            <div key={red.name}>
              <label className={labelClass} htmlFor={red.name}>
                {red.label}
              </label>
              <div className="flex items-stretch border-2 border-white/15 bg-white/[0.03] transition-colors focus-within:border-mg-red">
                <span className="flex items-center border-r border-white/10 px-3.5 font-mono text-base text-zinc-500">
                  @
                </span>
                <input
                  id={red.name}
                  type="text"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder={red.placeholder}
                  className="w-full bg-transparent px-3.5 py-3.5 text-base text-white placeholder:text-zinc-500 focus:outline-none disabled:opacity-60"
                  disabled={isSubmitting}
                  {...register(red.name)}
                />
              </div>
              {errors[red.name] && <p className={errorClass}>{errors[red.name]?.message}</p>}
            </div>
          ))}
        </div>
      </Bloque>

      {/* Honeypot anti-bots: oculto para personas, invisible para lectores de pantalla */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">No llenar</label>
        <input id="website" type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>

      <label className="mt-9 flex cursor-pointer items-start gap-3 text-[13px] leading-relaxed text-zinc-400">
        <input
          type="checkbox"
          className="mt-0.5 h-5 w-5 shrink-0 accent-mg-red"
          disabled={isSubmitting}
          {...register("acepta_terminos")}
        />
        <span>
          Autorizo el tratamiento de mis datos por MG Company para la gestión de la Gala
          MG (Ley 1581 de 2012) y entiendo que el ingreso está sujeto a confirmación.
        </span>
      </label>
      {errors.acepta_terminos && <p className={errorClass}>{errors.acepta_terminos.message}</p>}

      <AnimatePresence>
        {serverError && (
          <motion.p
            role="alert"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6 border-l-4 border-mg-red bg-mg-red/10 px-4 py-3 text-sm text-mg-red-bright"
          >
            {serverError}
          </motion.p>
        )}
      </AnimatePresence>

      <motion.button
        type="submit"
        disabled={isSubmitting}
        whileTap={{ scale: 0.985 }}
        className="group mt-8 inline-flex min-h-[60px] w-full items-center justify-center gap-4 border-2 border-mg-red bg-mg-red px-8 py-5 transition-colors duration-300 hover:bg-transparent hover:text-mg-red-bright disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="font-mono text-xs font-medium uppercase tracking-[0.3em] md:text-sm">
          {isSubmitting ? "Enviando…" : "Confirmar mi registro"}
        </span>
        {!isSubmitting && (
          <DiagonalArrow
            size={22}
            strokeWidth={1.75}
            className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        )}
      </motion.button>

      <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">
        Entrada libre · {GALA_CUPO} lugares · Sujeto a confirmación
      </p>
    </form>
  )
}

/* --- Estados de salida ---------------------------------------------------
   Dos desenlaces, y la diferencia importa: quedar dentro del aforo no es
   estar en lista de espera, y quedar en lista de espera no
   es un rechazo. Cada uno con su copy y lo que la persona tiene que hacer
   después — que en los dos casos es lo mismo: mirar el correo.

   Los dos salen como un TALÓN CLARO sobre el fondo negro, con el mismo
   troquel del pase. El motivo es que en esta marca el rojo sobre negro es el
   lenguaje de los errores —así se pintan las alertas del formulario— y un
   registro correcto pintado igual se lee como una falla. Invertir a claro
   resuelve eso sin inventar un verde que aquí sería un color extranjero: lo
   que confirma no es un color nuevo, es que algo se imprimió.

   Éxito y espera se separan por el acento (rojo MG contra grafito) y por el
   icono, no por el fondo. */

/** El talón lleva la fecha de GALA_FECHA, no escrita a mano: ya se movió una
 *  vez de octubre a septiembre y no tiene por qué haber dos fuentes. */
const [, mesGala, diaGala] = GALA_FECHA.split("-")
const diaDeLaGala = String(Number(diaGala))
const mesDeLaGala = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"][
  Number(mesGala) - 1
]

function Confirmacion({ resultado }: { resultado: RespuestaRegistro }) {
  const espera = resultado.estado === "waitlist"

  return (
    <motion.div
      role="status"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`relative max-w-2xl overflow-hidden border-t-4 bg-[#F5F2ED] p-7 text-mg-black md:p-10 ${
        espera ? "border-mg-black" : "border-mg-red"
      }`}
    >
      {/* Troquel: el mismo motivo del pase de entrada */}
      <span aria-hidden className="pointer-events-none absolute inset-y-0 right-[86px] hidden border-l-2 border-dashed border-black/15 sm:block" />
      <span aria-hidden className="absolute -right-3 -top-3 hidden h-6 w-6 rounded-full bg-mg-black sm:block" style={{ right: 73 }} />
      <span aria-hidden className="absolute -bottom-3 hidden h-6 w-6 rounded-full bg-mg-black sm:block" style={{ right: 73 }} />

      <div className="sm:pr-[86px]">
        <motion.span
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 16, delay: 0.15 }}
          className={`flex h-14 w-14 items-center justify-center rounded-full text-white ${
            espera ? "bg-mg-black" : "bg-mg-red"
          }`}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
            {espera ? (
              <>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                <path d="M12 7v5.2l3.4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </>
            ) : (
              <motion.path
                d="M5 12.5l4.5 4.5L19 7.5"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.45, delay: 0.35, ease: "easeOut" }}
              />
            )}
          </svg>
        </motion.span>

        <h3 className="mt-6 font-heading text-3xl uppercase leading-none tracking-wide md:text-4xl">
          {espera ? "Quedaste en lista de espera" : "Estás dentro"}
        </h3>

        <p className="mt-4 text-[15px] leading-relaxed text-zinc-700">
          {espera ? (
            <>
              El cupo ya se llenó — la Gala es de <b className="text-mg-black">{GALA_CUPO} personas</b> y
              no hay una silla más. Estate pendiente de tu correo: si se abre un espacio,
              el equipo escribe en orden de llegada.
            </>
          ) : (
            <>
              Tu lugar está confirmado y{" "}
              <b className="text-mg-black">tu pase con el código QR va en camino a tu correo</b>{" "}
              — revisa también la carpeta de promociones. Ese QR es lo único que abre
              la puerta: es único e intransferible.
            </>
          )}
        </p>

        <dl className="mt-7 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 border-t border-black/15 pt-6 font-mono text-[11px] uppercase tracking-wider">
          <dt className="text-black/45">Cuándo:</dt>
          <dd className="text-mg-black">
            {fechaLarga()} · {GALA_HORA_INICIO_TXT} – {GALA_HORA_FIN_TXT}
          </dd>
          <dt className="text-black/45">Dónde:</dt>
          <dd className="text-mg-black">
            {espera ? (
              <>{GALA_CIUDAD} · dirección en el correo</>
            ) : (
              <>
                {GALA_DIRECCION} · {GALA_BARRIO}
                <a
                  href={GALA_MAPS}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 underline decoration-mg-red underline-offset-2 hover:text-mg-red"
                >
                  Cómo llegar
                </a>
              </>
            )}
          </dd>
          <dt className="text-black/45">Estado:</dt>
          <dd className={espera ? "text-black/70" : "text-mg-red"}>
            {espera ? "En lista de espera" : "Confirmado"}
          </dd>
        </dl>

        <p className="mt-6 text-xs leading-relaxed text-black/45">
          MG Company se reserva el derecho de admisión y permanencia.
        </p>
      </div>

      {/* Talón: el número que la persona se lleva de esta pantalla */}
      <div aria-hidden className="absolute inset-y-0 right-0 hidden w-[86px] flex-col items-center justify-center gap-2 sm:flex">
        <span className={`font-heading text-4xl leading-none ${espera ? "text-mg-black" : "text-mg-red"}`}>
          {espera ? GALA_CUPO : diaDeLaGala}
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-black/50">
          {espera ? "Lleno" : mesDeLaGala}
        </span>
      </div>
    </motion.div>
  )
}
