"use client"

import { useEffect } from "react"

/* ============================================================
   El enlace de recuperación que aterriza donde no debe
   ============================================================
   Cuando el enlace se manda desde el DASHBOARD de Supabase (Authentication →
   Users → Send password recovery), Supabase ignora cualquier `redirectTo` y
   usa el Site URL del proyecto: la persona acaba en la portada de
   mgcompany.co, sin nada que la recoja, creyendo que el enlace está roto.

   Además los tokens vuelven en el FRAGMENTO de la URL (#access_token=…), que
   el navegador nunca manda al servidor. Por eso esto tiene que ser código de
   cliente y no un redirect del middleware: en el servidor ese fragmento no
   existe.

   Se monta en el layout raíz, así que da igual en qué página caiga el enlace.
   Cuando reconoce una recuperación, la lleva a /admin/recuperar con el
   fragmento intacto. */

const RUTA = "/admin/recuperar"

export default function RescateRecuperacion() {
  useEffect(() => {
    const hash = window.location.hash
    if (!hash || window.location.pathname.startsWith(RUTA)) return

    const p = new URLSearchParams(hash.slice(1))
    // `type=recovery` es lo que distingue este enlace de una invitación o de
    // una confirmación de correo, que no deben acabar cambiando contraseñas.
    const esRecuperacion = p.get("type") === "recovery" && p.get("access_token")
    const esError = p.get("error") && p.get("error_code")?.includes("otp_expired")

    if (esRecuperacion || esError) {
      window.location.replace(`${RUTA}${hash}`)
    }
  }, [])

  return null
}
