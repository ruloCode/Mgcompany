"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { createClient } from "@/lib/supabase/client"

/* ============================================================
   Convertir el fragmento en sesión
   ============================================================
   Un enlace de recuperación salido del dashboard de Supabase trae los tokens
   en el fragmento (#access_token=…&refresh_token=…). El servidor no lo ve
   nunca, así que la sesión hay que sembrarla desde el navegador: setSession
   escribe la cookie, y router.refresh() hace que el Server Component vuelva a
   preguntar quién es y esta vez encuentre a alguien.

   Mientras tanto se pinta un "un momento…", porque el salto es real: sin él
   la persona ve "este enlace ya no sirve" durante un instante justo cuando sí
   sirve, y cierra la pestaña. */

export default function SesionDesdeFragmento({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  // Arranca SIEMPRE en "comprobando", igual en el servidor que en el cliente.
  // Mirar window.location aquí para decidir el estado inicial parece más
  // listo, pero el servidor no tiene window: el primer pintado saldría
  // distinto en cada lado y React rompe la hidratación.
  const [canjeando, setCanjeando] = useState(true)

  useEffect(() => {
    const p = new URLSearchParams(window.location.hash.slice(1))
    const access_token = p.get("access_token")
    const refresh_token = p.get("refresh_token")
    if (!access_token || !refresh_token) {
      setCanjeando(false)
      return
    }

    const supabase = createClient()
    supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
      // El fragmento se borra pase lo que pase: son credenciales vivas y no
      // tienen por qué quedarse en la barra ni en el historial.
      window.history.replaceState(null, "", window.location.pathname)
      if (error) {
        setCanjeando(false)
        return
      }
      router.refresh()
      setCanjeando(false)
    })
  }, [router])

  if (canjeando) {
    return (
      <div className="card" style={{ marginBottom: 0 }}>
        <p className="small muted" style={{ margin: 0 }} role="status">
          Comprobando tu enlace…
        </p>
      </div>
    )
  }

  return <>{children}</>
}
