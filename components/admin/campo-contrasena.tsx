"use client"

import { useId, useState } from "react"

/* ============================================================
   Un campo de contraseña que se puede mirar
   ============================================================
   Escribir a ciegas una contraseña que vas a necesitar para siempre es pedir
   un error, y el que se equivoca no se entera hasta que ya no puede entrar.
   El botón alterna el `type` del input, que es lo único que de verdad oculta
   el texto; no hay truco más allá.

   El estado vive en cada campo y no en el formulario: mostrar la nueva
   contraseña no tiene por qué destapar también la vieja. */
export default function CampoContrasena({
  nombre, etiqueta, requerido = true, minimo, autoComplete, placeholder, deshabilitado, oculto,
}: {
  nombre: string
  etiqueta: string
  requerido?: boolean
  minimo?: number
  autoComplete?: string
  placeholder?: string
  deshabilitado?: boolean
  /** Para modos del formulario donde el campo no aplica (p. ej. "olvidé"). */
  oculto?: boolean
}) {
  const [visible, setVisible] = useState(false)
  const id = useId()

  return (
    <label htmlFor={id} style={{ display: oculto ? "none" : "block", marginBottom: 12 }}>
      <span style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
        <span className="small muted">{etiqueta}</span>
        <span className="spacer" style={{ flex: 1 }} />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          // aria-pressed y no un simple texto: quien usa lector de pantalla
          // necesita saber en qué estado está, no solo qué hace el botón.
          aria-pressed={visible}
          aria-label={visible ? `Ocultar ${etiqueta.toLowerCase()}` : `Mostrar ${etiqueta.toLowerCase()}`}
          style={{
            background: "none", border: "none", padding: 0, cursor: "pointer",
            font: "inherit", color: "var(--muted)", textDecoration: "underline",
          }}
          className="small"
          tabIndex={oculto ? -1 : 0}
        >
          {visible ? "ocultar" : "ver"}
        </button>
      </span>
      <input
        id={id}
        name={nombre}
        type={visible ? "text" : "password"}
        required={requerido && !oculto}
        disabled={deshabilitado}
        minLength={minimo}
        autoComplete={autoComplete}
        placeholder={placeholder}
        style={{ width: "100%" }}
      />
    </label>
  )
}
