import { NextResponse } from "next/server"

import { buscarJurado, comentarioSchema } from "@/lib/mg1-seleccion"
import { guardarComentario } from "@/lib/mg1-seleccion-datos"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }

  const parsed = comentarioSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors.texto?.[0] ?? "Datos inválidos" },
      { status: 400 },
    )
  }

  const jurado = buscarJurado(parsed.data.jurado)
  if (!jurado) {
    return NextResponse.json({ error: "Ese enlace ya no es válido" }, { status: 403 })
  }

  const res = await guardarComentario(jurado.slug, parsed.data.inscripcion_id, parsed.data.texto)
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 500 })

  return NextResponse.json({ ok: true })
}
