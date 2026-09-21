"use client"

import { useActionState } from "react"

import { establecerPassword, type Resultado } from "@/app/admin/acciones"

export default function FormularioNuevaPassword({ correo }: { correo: string }) {
  const [estado, accion, guardando] = useActionState<Resultado | null, FormData>(establecerPassword, null)

  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <h2 style={{ marginTop: 0 }}>Nueva contraseña</h2>
      <p className="small muted" style={{ marginTop: -6 }}>
        Para <b>{correo}</b>. Al guardarla entras directo al panel.
      </p>

      <form action={accion}>
        <label style={{ display: "block", marginBottom: 12 }}>
          <span className="small muted" style={{ display: "block", marginBottom: 4 }}>Contraseña nueva</span>
          <input name="password" type="password" required minLength={8}
            autoComplete="new-password" style={{ width: "100%" }} placeholder="Mínimo 8 caracteres" />
        </label>

        <label style={{ display: "block", marginBottom: 14 }}>
          <span className="small muted" style={{ display: "block", marginBottom: 4 }}>Repítela</span>
          <input name="password2" type="password" required minLength={8}
            autoComplete="new-password" style={{ width: "100%" }} />
        </label>

        {estado?.error ? (
          <div className="alert critical" style={{ marginBottom: 12 }} role="alert">
            <span aria-hidden>⚠</span>
            <span>{estado.error}</span>
          </div>
        ) : null}

        <button className="btn brand" disabled={guardando} style={{ width: "100%", justifyContent: "center" }}>
          {guardando ? "Guardando…" : "Guardar y entrar"}
        </button>
      </form>
    </div>
  )
}
