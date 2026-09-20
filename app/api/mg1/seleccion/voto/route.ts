import { NextResponse } from "next/server"

import { buscarJurado, votoSchema } from "@/lib/mg1-seleccion"
import { alternarVoto } from "@/lib/mg1-seleccion-datos"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }

  const parsed = votoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  // El slug que manda el navegador no se cree: tiene que estar en la mesa.
  // Sin esto, cualquiera podria escribir votos a nombre de un jurado inventado
  // y ensuciar el consolidado.
  const jurado = buscarJurado(parsed.data.jurado)
  if (!jurado) {
    return NextResponse.json({ error: "Ese enlace ya no es válido" }, { status: 403 })
  }

  const res = await alternarVoto(jurado.slug, parsed.data.inscripcion_id, parsed.data.marcar)

  if (!res.ok) {
    // 409 y no 400: la petición era correcta, lo que no cabe es una ficha más.
    return NextResponse.json({ error: res.error, tope: res.tope ?? false }, { status: res.tope ? 409 : 500 })
  }

  return NextResponse.json({ ok: true, marcado: res.marcado })
}
