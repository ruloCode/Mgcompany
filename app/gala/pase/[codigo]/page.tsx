import type { Metadata } from "next"
import Link from "next/link"
import { getSupabaseAdmin } from "@/lib/supabase-admin"
import Pase, { type DatosPase } from "@/components/gala/pase"
import { GALA_EDICION } from "@/lib/gala"

export const dynamic = "force-dynamic"

// Un pase no se comparte ni se indexa: es de una persona y abre una puerta.
export const metadata: Metadata = {
  title: "Pase · Gala MG",
  robots: { index: false, follow: false },
}

/* La lectura va por service_role a propósito: `gala_registros` no tiene policy
   de SELECT para anon (ahí hay datos personales de todos los asistentes). El
   código del pase es la llave de UNA fila, y es el servidor quien la usa. */
async function buscarPase(codigo: string) {
  const supabase = getSupabaseAdmin()
  if (!supabase) return { estado: "sin_servicio" as const }

  const { data } = await supabase
    .from("gala_registros")
    .select("codigo, nombre_completo, nombre_artistico, tipo_asistente, estado, ingreso_at")
    .eq("codigo", codigo.toUpperCase())
    .eq("edicion", GALA_EDICION)
    .maybeSingle()

  if (!data) return { estado: "no_existe" as const }
  if (data.estado !== "confirmed") return { estado: "no_valido" as const }
  return { estado: "ok" as const, pase: data as DatosPase }
}

export default async function PaseGalaPage({
  params,
}: {
  params: Promise<{ codigo: string }>
}) {
  const { codigo } = await params
  const resultado = await buscarPase(codigo)
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mgcompany.co"

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      {resultado.estado === "ok" ? (
        <Pase pase={resultado.pase} url={`${base}/gala/pase/${resultado.pase.codigo}`} />
      ) : (
        <div className="mx-auto w-full max-w-sm border-l-4 border-white/25 bg-white/[0.03] p-7 text-center">
          <h1 className="font-heading text-3xl uppercase leading-none tracking-wide">
            Pase no válido
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-zinc-400">
            {resultado.estado === "no_valido"
              ? "Este pase existe pero no está confirmado. Si crees que es un error, escríbele al equipo MG."
              : resultado.estado === "sin_servicio"
                ? "No pudimos verificar el pase en este momento. Intenta de nuevo en un minuto."
                : "No encontramos ningún pase con este código. Revisa el enlace del correo de confirmación."}
          </p>
          <Link
            href="/gala"
            className="mt-7 inline-flex min-h-[48px] items-center border-2 border-mg-red px-6 font-mono text-[11px] font-medium uppercase tracking-[0.25em] text-mg-red-bright transition-colors hover:bg-mg-red hover:text-white"
          >
            Volver a la Gala
          </Link>
        </div>
      )}
    </div>
  )
}
