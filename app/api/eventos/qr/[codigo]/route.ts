import QRCode from "qrcode"

import { codigoDeEvento } from "@/lib/eventos"
import { urlPase } from "@/lib/eventos-datos"

export const runtime = "nodejs"

/* La imagen del QR que va dentro del correo.

   No consulta la base a propósito. El QR solo codifica la URL del pase, que
   ya está escrita en el mismo correo: dibujarlo no revela nada que quien pide
   la imagen no tenga. Y así no hay consulta por cada vez que Gmail la pide.

   Como el contenido de un código no cambia nunca, la respuesta se cachea un
   año: Gmail la guarda la primera vez y la puede mostrar sin señal. */
export async function GET(_req: Request, { params }: { params: Promise<{ codigo: string }> }) {
  const { codigo: bruto } = await params
  const codigo = codigoDeEvento(bruto.replace(/\.png$/i, ""))
  if (!codigo) return new Response("Código inválido", { status: 400 })

  const png = await QRCode.toBuffer(urlPase(codigo), {
    type: "png",
    width: 480,
    margin: 1,
    errorCorrectionLevel: "M",
  })

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  })
}
