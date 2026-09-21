import { Suspense } from "react"
import FormularioAcceso from "@/components/admin/formulario-acceso"

export const dynamic = "force-dynamic"

export default function LoginPage() {
  return (
    <main className="acceso">
      <div className="acceso-caja">
        <div className="acceso-marca">
          {/* El logo de verdad, no las iniciales: es el mismo archivo que la
              portada y el que va en los correos. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mg.png" alt="MG Company Group" width={40} height={40} />
          <div>
            <span className="acceso-etiqueta">MG Company</span>
            <h1 className="acceso-titulo">Centro de<br />operaciones</h1>
          </div>
        </div>

        <Suspense fallback={null}>
          <FormularioAcceso />
        </Suspense>
      </div>
    </main>
  )
}
