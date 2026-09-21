"use client"

import { useActionState, useState } from "react"
import { useSearchParams } from "next/navigation"
import { iniciarSesion, pedirRecuperacion, registrarse, type Resultado } from "@/app/admin/acciones"

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

  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <div className="seg" style={{ marginBottom: 16, width: "100%" }}>
        <button type="button" className={modo === "entrar" ? "on" : ""} onClick={() => setModo("entrar")} style={{ flex: 1 }}>
          Entrar
        </button>
        <button type="button" className={modo === "crear" ? "on" : ""} onClick={() => setModo("crear")} style={{ flex: 1 }}>
          Crear cuenta
        </button>
      </div>

      {modo === "olvide" ? (
        <p className="small muted" style={{ marginTop: -4, marginBottom: 14 }}>
          Escribe tu correo y te mandamos un enlace para poner una contraseña nueva.
        </p>
      ) : null}

      <form action={modo === "entrar" ? accionEntrar : modo === "crear" ? accionCrear : accionOlvide}>
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

        <label style={{ display: modo === "olvide" ? "none" : "block", marginBottom: 14 }}>
          <span className="small muted" style={{ display: "block", marginBottom: 4 }}>Contraseña</span>
          <input
            name="password"
            type="password"
            required={modo !== "olvide"}
            disabled={modo === "olvide"}
            minLength={modo === "crear" ? 8 : undefined}
            autoComplete={modo === "crear" ? "new-password" : "current-password"}
            style={{ width: "100%" }}
          />
        </label>

        {estado?.error ? (
          <div className={esAviso ? "alert good" : "alert critical"} style={{ marginBottom: 12 }} role="status">
            <span aria-hidden>{esAviso ? "✓" : "⚠"}</span>
            <span>{estado.error}</span>
          </div>
        ) : null}

        <button className="btn brand" disabled={cargando} style={{ width: "100%", justifyContent: "center" }}>
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
          onClick={() => setModo(modo === "olvide" ? "entrar" : "olvide")}
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
            ? "La primera cuenta que se cree queda como owner. Las siguientes necesitan que un admin las active."
            : "El enlace caduca en una hora y solo se puede usar una vez."}
      </p>
    </div>
  )
}
