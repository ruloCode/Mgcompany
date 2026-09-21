import type { Metadata } from "next"
import "../panel.css"
import "../acceso.css"

export const metadata: Metadata = {
  title: "Recuperar contraseña · Centro de operaciones MG",
  robots: { index: false, follow: false },
}

// Igual que el login, y por el mismo motivo: el layout del panel exige perfil
// activo y aquí todavía no hay sesión.
export default function RecuperarLayout({ children }: { children: React.ReactNode }) {
  return <div className="panel" data-tema="dark">{children}</div>
}
