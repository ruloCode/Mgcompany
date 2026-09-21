import type { Metadata } from "next"
import "../panel.css"
import "../acceso.css"

export const metadata: Metadata = {
  title: "Entrar · Centro de operaciones MG",
  robots: { index: false, follow: false },
}

// El login no puede heredar el layout del panel: ese exige perfil activo.
// El tema oscuro se fija aquí y no se hereda de la preferencia del usuario,
// porque todavía no sabemos quién es: la puerta es siempre la misma, negra y
// roja, como el resto del sitio.
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <div className="panel" data-tema="dark">{children}</div>
}
