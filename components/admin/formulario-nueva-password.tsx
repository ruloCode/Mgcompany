"use client"

import { useActionState } from "react"

import { establecerPassword, type Resultado } from "@/app/admin/acciones"
import CampoContrasena from "./campo-contrasena"

export default function FormularioNuevaPassword({ correo }: { correo: string }) {
  const [estado, accion, guardando] = useActionState<Resultado | null, FormData>(establecerPassword, null)

  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <h2 style={{ marginTop: 0 }}>Nueva contraseña</h2>
      <p className="small muted" style={{ marginTop: -6, marginBottom: 18 }}>
        Para <b>{correo}</b>. Al guardarla entras directo al panel.
      </p>

      <form action={accion}>
        <CampoContrasena
          nombre="password"
          etiqueta="Contraseña nueva"
          minimo={8}
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
        />

        <CampoContrasena
          nombre="password2"
          etiqueta="Repítela"
          minimo={8}
          autoComplete="new-password"
        />

        {estado?.error ? (
          <div className="alert critical" style={{ marginBottom: 12 }} role="alert">
            <span aria-hidden>⚠</span>
            <span>{estado.error}</span>
          </div>
        ) : null}

        <button className="btn brand" disabled={guardando}>
          {guardando ? "Guardando…" : "Guardar y entrar"}
        </button>
      </form>
    </div>
  )
}
