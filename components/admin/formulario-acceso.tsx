"use client"

import { useActionState, useState } from "react"
import { useSearchParams } from "next/navigation"
import { iniciarSesion, pedirRecuperacion, registrarse, type Resultado } from "@/app/admin/acciones"
import CampoContrasena from "./campo-contrasena"

export default function FormularioAcceso() {
  const params = useSearchParams()
  const volver = params.get("volver") ?? "/admin"
  const [modo, setModo] = useState<"entrar" | "crear" | "olvide">("entrar")

  const [entrarEstado, accionEntrar, entrando] = useActionState<Resultado | null, FormData>(iniciarSesion, null)
  const [crearEstado, accionCrear, creando] = useActionState<Resultado | null, FormData>(registrarse, null)
  const [olvideEstado, accionOlvide, pidiendo] = useActionState<Resultado | null, FormData>(pedirRecuperacion, null)

  const estado = modo === "entrar" ? entrarEstado : modo === "crear" ? crearEstado : olvideEstado
  const cargando = modo === "entrar" ? entrando : modo === "crear" ? creando : pidiendo
  // registrarse() y pedirRecuperacion() devuelven ok:true con un mensaje
  // informativo (no es un error).
  const esAviso = estado?.ok === true && !!estado.error

  const cambiar = (nuevo: typeof modo) => setModo(nuevo)

  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <div className="seg" style={{ marginBottom: 16, width: "100%" }}>
        <button type="button" className={modo === "entrar" ? "on" : ""} onClick={() => cambiar("entrar")} style={{ flex: 1 }}>
          Entrar
        </button>
        <button type="button" className={modo === "crear" ? "on" : ""} onClick={() => cambiar("crear")} style={{ flex: 1 }}>
          Crear cuenta
        </button>
      </div>

      {modo === "olvide" ? (
        <p className="small muted" style={{ marginTop: -4, marginBottom: 14 }}>
          Escribe tu correo y te mandamos un enlace para poner una contraseña nueva.
        </p>
      ) : null}

      {/* key por modo: al cambiar de pestaña el formulario se rehace desde
          cero. Sin esto, la contraseña escrita para entrar sobreviviría al
          salto a "crear cuenta" y se enviaría sin que nadie la mirase. */}
      <form
        key={modo}
        action={modo === "entrar" ? accionEntrar : modo === "crear" ? accionCrear : accionOlvide}
      >
        <input type="hidden" name="volver" value={volver} />

        {modo === "crear" ? (
          <label style={{ display: "block", marginBottom: 12 }}>
            <span className="small muted" style={{ display: "block", marginBottom: 4 }}>Nombre</span>
            <input name="nombre" required autoComplete="name" style={{ width: "100%" }} placeholder="Cómo te ve el equipo" />
          </label>
        ) : null}

        <label style={{ display: "block", marginBottom: 12 }}>
          <span className="small muted" style={{ display: "block", marginBottom: 4 }}>Correo</span>
          <input name="email" type="email" required autoComplete="email" style={{ width: "100%" }} placeholder="tu@mgcompany.co" />
        </label>

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
          <div className={esAviso ? "alert good" : "alert critical"} style={{ marginBottom: 12, marginTop: 2 }} role="status">
            <span aria-hidden>{esAviso ? "✓" : "⚠"}</span>
            <span>{estado.error}</span>
          </div>
        ) : null}

        <button className="btn brand" disabled={cargando} style={{ width: "100%", justifyContent: "center", marginTop: 2 }}>
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
          className="btn"
          onClick={() => cambiar(modo === "olvide" ? "entrar" : "olvide")}
          style={{ width: "100%", justifyContent: "center", marginTop: 10, background: "transparent", border: "none" }}
        >
          <span className="small muted">
            {modo === "olvide" ? "← Volver a entrar" : "¿Olvidaste tu contraseña?"}
          </span>
        </button>
      )}

      <p className="small muted" style={{ marginTop: 14, marginBottom: 0 }}>
        {modo === "entrar"
          ? "Acceso restringido al equipo de MG Company."
          : modo === "crear"
            ? "Tu cuenta queda inactiva hasta que un admin la active. Le avisamos en cuanto la crees."
            : "El enlace caduca en una hora y solo se puede usar una vez."}
      </p>
    </div>
  )
}
