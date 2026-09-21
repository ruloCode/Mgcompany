"use client"

import { useId, useState } from "react"

/* ============================================================
   Un campo de contraseña que se puede mirar
   ============================================================
   Escribir a ciegas una contraseña que vas a necesitar para siempre es pedir
   un error, y quien se equivoca no se entera hasta que ya no puede entrar. El
   botón alterna el `type` del input, que es lo único que de verdad oculta el
   texto; no hay truco más allá.

   El estado de "ver" vive en CADA campo y no en el formulario: destapar la
   contraseña nueva no tiene por qué destapar también la vieja.

   Y avisa de Bloq Mayús. Es el fallo silencioso clásico: el campo va tapado,
   la contraseña sale en mayúsculas, el servidor dice "incorrecta" y nadie
   entiende por qué. */
export default function CampoContrasena({
  nombre, etiqueta, requerido = true, minimo, autoComplete, placeholder, oculto, ayuda,
}: {
  nombre: string
  etiqueta: string
  requerido?: boolean
  minimo?: number
  autoComplete?: string
  placeholder?: string
  /** Para modos del formulario donde el campo no aplica (p. ej. "olvidé"). */
  oculto?: boolean
  ayuda?: string
}) {
  const [visible, setVisible] = useState(false)
  const [mayus, setMayus] = useState(false)
  const id = useId()

  const mirarMayus = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // getModifierState es lo único fiable: no hay evento de "se activó Bloq
    // Mayús", solo se puede consultar mientras se teclea.
    setMayus(e.getModifierState?.("CapsLock") ?? false)
  }

  return (
    <div className="acceso-campo" style={oculto ? { display: "none" } : undefined}>
      <div className="acceso-campo-cabeza">
        <label htmlFor={id} className="small muted">{etiqueta}</label>
        <button
          type="button"
          className="acceso-ver"
          onClick={() => setVisible((v) => !v)}
          // aria-pressed y no solo el texto: quien usa lector de pantalla
          // necesita saber en qué estado está, no solo qué hace el botón.
          aria-pressed={visible}
          aria-label={visible ? `Ocultar ${etiqueta.toLowerCase()}` : `Mostrar ${etiqueta.toLowerCase()}`}
          tabIndex={oculto ? -1 : 0}
        >
          {visible ? "ocultar" : "ver"}
        </button>
      </div>

      <input
        id={id}
        name={nombre}
        type={visible ? "text" : "password"}
        required={requerido && !oculto}
        minLength={minimo}
        autoComplete={autoComplete}
        placeholder={placeholder}
        onKeyUp={mirarMayus}
        onKeyDown={mirarMayus}
        onBlur={() => setMayus(false)}
      />

      {mayus && !visible ? (
        <p className="acceso-mayus" role="status">
          <span aria-hidden>⇪</span> Tienes Bloq Mayús activado
        </p>
      ) : null}

      {ayuda ? <p className="small muted" style={{ margin: "6px 0 0" }}>{ayuda}</p> : null}
    </div>
  )
}
