"use client"

import { useActionState, useState } from "react"
import { useSearchParams } from "next/navigation"
import { iniciarSesion, pedirRecuperacion, registrarse, type Resultado } from "@/app/admin/acciones"
import CampoContrasena from "./campo-contrasena"

type Modo = "entrar" | "crear" | "olvide"

export default function FormularioAcceso() {
  const params = useSearchParams()
  const volver = params.get("volver") ?? "/admin"
  const [modo, setModo] = useState<Modo>("entrar")

  const [entrarEstado, accionEntrar, entrando] = useActionState<Resultado | null, FormData>(iniciarSesion, null)
  const [crearEstado, accionCrear, creando] = useActionState<Resultado | null, FormData>(registrarse, null)
  const [olvideEstado, accionOlvide, pidiendo] = useActionState<Resultado | null, FormData>(pedirRecuperacion, null)

  const estado = modo === "entrar" ? entrarEstado : modo === "crear" ? crearEstado : olvideEstado
  const cargando = modo === "entrar" ? entrando : modo === "crear" ? creando : pidiendo
  const accion = modo === "entrar" ? accionEntrar : modo === "crear" ? accionCrear : accionOlvide
  // registrarse() y pedirRecuperacion() devuelven ok:true con un mensaje
  // informativo (no es un error).
  const esAviso = estado?.ok === true && !!estado.error

  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <div className="seg" style={{ marginBottom: 18, width: "100%" }}>
        <button type="button" className={modo === "entrar" ? "on" : ""} onClick={() => setModo("entrar")} style={{ flex: 1 }}>
          Entrar
        </button>
        <button type="button" className={modo === "crear" ? "on" : ""} onClick={() => setModo("crear")} style={{ flex: 1 }}>
          Crear cuenta
        </button>
      </div>

      {modo === "olvide" ? (
        <p className="small muted" style={{ marginTop: -6, marginBottom: 16 }}>
          Escribe tu correo y te mandamos un enlace para poner una contraseña nueva.
        </p>
      ) : null}

      {/* key por modo: al cambiar de pestaña el formulario se rehace desde
          cero. Sin esto, lo escrito para entrar sobreviviría al salto a "crear
          cuenta" y se enviaría sin que nadie lo mirase. */}
      <form key={modo} action={accion}>
        <input type="hidden" name="volver" value={volver} />

        {modo === "crear" ? (
          <div className="acceso-campo">
            <div className="acceso-campo-cabeza">
              <label htmlFor="acc-nombre" className="small muted">Nombre</label>
            </div>
            <input id="acc-nombre" name="nombre" required autoComplete="name" placeholder="Cómo te ve el equipo" />
          </div>
        ) : null}

        <div className="acceso-campo">
          <div className="acceso-campo-cabeza">
            <label htmlFor="acc-email" className="small muted">Correo</label>
          </div>
          <input
            id="acc-email"
            name="email"
            type="email"
            required
            autoFocus
            // inputMode y autoCapitalize: en el celular abre el teclado con la
            // arroba a mano y no pone mayúscula inicial en el correo.
            inputMode="email"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            autoComplete="email"
            placeholder="tu@mgcompany.co"
          />
        </div>

        <CampoContrasena
          nombre="password"
          etiqueta="Contraseña"
          oculto={modo === "olvide"}
          minimo={modo === "crear" ? 8 : undefined}
          autoComplete={modo === "crear" ? "new-password" : "current-password"}
          placeholder={modo === "crear" ? "Mínimo 8 caracteres" : undefined}
        />

        {/* La confirmación solo al crear: al entrar no hay nada que confirmar,
            y en "olvidé" no se escribe contraseña. */}
        {modo === "crear" ? (
          <CampoContrasena
            nombre="password2"
            etiqueta="Repite la contraseña"
            minimo={8}
            autoComplete="new-password"
          />
        ) : null}

        {estado?.error ? (
          <div className={esAviso ? "alert good" : "alert critical"} style={{ margin: "4px 0 14px" }} role="status">
            <span aria-hidden>{esAviso ? "✓" : "⚠"}</span>
            <span>{estado.error}</span>
          </div>
        ) : null}

        <button className="btn brand" disabled={cargando}>
          {cargando
            ? "Un momento…"
            : modo === "entrar"
              ? "Entrar al panel"
              : modo === "crear"
                ? "Crear cuenta"
                : "Mandarme el enlace"}
        </button>
      </form>

      {modo === "crear" ? null : (
        <button
          type="button"
          className="acceso-secundario"
          onClick={() => setModo(modo === "olvide" ? "entrar" : "olvide")}
        >
          {modo === "olvide" ? "← Volver a entrar" : "¿Olvidaste tu contraseña?"}
        </button>
      )}

      <p className="acceso-pie">
        {modo === "entrar"
          ? "Acceso restringido al equipo de MG Company."
          : modo === "crear"
            ? "Tu cuenta queda inactiva hasta que un admin la active. Le avisamos en cuanto la crees."
            : "El enlace caduca en una hora y solo se puede usar una vez."}
      </p>
    </div>
  )
}
