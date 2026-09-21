import { Suspense } from "react"

import FormularioNuevaPassword from "@/components/admin/formulario-nueva-password"
import SesionDesdeFragmento from "@/components/admin/sesion-desde-fragmento"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

export default async function RecuperarPage({ searchParams }: Props) {
  const params = await searchParams
  const supabase = await createClient()

  // El enlace del correo llega de una de dos formas segun como este
  // configurada la plantilla en Supabase. Se aceptan las dos: si solo
  // atendieramos una, el enlace funcionaria o no segun un ajuste del panel de
  // Supabase que nadie recuerda haber tocado.
  const code = uno(params.code)
  const tokenHash = uno(params.token_hash)

  if (code) {
    await supabase.auth.exchangeCodeForSession(code)
  } else if (tokenHash) {
    await supabase.auth.verifyOtp({ type: "recovery", token_hash: tokenHash })
  }

  const { data: { user } } = await supabase.auth.getUser()

  // El error viaja en la URL cuando el enlace ya caduco (Supabase redirige con
  // error_description). Se prefiere ese texto al generico porque distingue
  // "caducado" de "ya usado".
  const motivo = uno(params.error_description) ?? uno(params.error)

  return (
    <main className="acceso">
      <div className="acceso-caja">
        <div className="acceso-marca">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mg.png" alt="MG Company Group" width={40} height={40} />
          <div>
            <span className="acceso-etiqueta">MG Company</span>
            <h1 className="acceso-titulo">Centro de<br />operaciones</h1>
          </div>
        </div>

        {user ? (
          <Suspense fallback={null}>
            <FormularioNuevaPassword correo={user.email ?? ""} />
          </Suspense>
        ) : (
          <SesionDesdeFragmento>
          <div className="card" style={{ marginBottom: 0 }}>
            <h2 style={{ marginTop: 0 }}>Este enlace ya no sirve</h2>
            <p className="small muted">
              {motivo
                ? `Supabase dice: ${motivo}.`
                : "Los enlaces de recuperación caducan y solo se pueden usar una vez."}
            </p>
            <p className="small muted">
              Pide uno nuevo desde la pantalla de acceso; llega al correo en un par de minutos.
            </p>
            <a className="btn brand" href="/admin/login">
              Volver al acceso
            </a>
          </div>
          </SesionDesdeFragmento>
        )}
      </div>
    </main>
  )
}
