import { redirect } from "next/navigation"

/* /registro era un formulario de maqueta: no guardaba nada, simulaba el envío
   con un setTimeout y prometía un QR que nadie generaba. El registro de
   eventos vive ahora en /gala, con su tabla, su cupo y su pase de verdad.
   Se deja la ruta viva porque está impresa en piezas y enlaces antiguos. */
export default function RegistroPage() {
  redirect("/gala")
}
