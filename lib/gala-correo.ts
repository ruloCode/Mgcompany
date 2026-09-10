import {
  GALA_CIUDAD,
  GALA_HORARIO,
  GALA_HORA_INICIO_TXT,
  fechaLarga,
} from "./gala"

/**
 * El correo del pase.
 *
 * Escrito con tablas y estilos en línea, no con el sistema de la landing: los
 * clientes de correo no cargan hojas de estilo externas ni fuentes web, así que
 * Bebas Neue no existe aquí. Se sustituye por una pila de palo seco pesada, que
 * es lo más cerca que se puede estar de la marca sin adjuntar una imagen —y una
 * imagen de texto no se lee cuando el cliente bloquea imágenes, que es la mitad
 * de las veces.
 *
 * Fondo claro por la misma razón que la tarjeta de confirmación de la landing:
 * el rojo sobre negro es el lenguaje de las alertas de MG, y un pase de entrada
 * no es una alarma. Además, varios clientes invierten los fondos oscuros por su
 * cuenta y el resultado es impredecible.
 */

export interface DatosPase {
  nombre_completo: string
  nombre_artistico: string | null
  codigo: string
}

const primerNombre = (r: DatosPase) =>
  (r.nombre_artistico || r.nombre_completo).trim().split(/\s+/)[0]

/* Sin género en la copy: no preguntamos el género en el formulario, así que
   "confirmado" sería una suposición sobre cada persona. Se le atribuye al
   registro, que no tiene género, en vez de a quien lee. */
export const asuntoPase = () => "Tu pase para la Gala MG · estás dentro"

const ROJO = "#E8200C"
const TINTA = "#111111"
const PAPEL = "#F5F2ED"

export function htmlPase(r: DatosPase, urlPase: string): string {
  const nombre = primerNombre(r)
  const display = "Arial Black, Arial Bold, Helvetica, sans-serif"
  const mono = "'SF Mono', Consolas, 'Courier New', monospace"

  const fila = (etiqueta: string, valor: string) => `
    <tr>
      <td style="padding:6px 0;font:11px ${mono};letter-spacing:1.5px;text-transform:uppercase;color:#8a8378;width:92px;vertical-align:top;">${etiqueta}</td>
      <td style="padding:6px 0;font:14px Helvetica,Arial,sans-serif;color:${TINTA};">${valor}</td>
    </tr>`

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>${asuntoPase()}</title></head>
<body style="margin:0;padding:0;background:#0a0a0a;">
  <span style="display:none;font-size:1px;color:#0a0a0a;">Tu pase para la Gala MG — ${fechaLarga()}, puertas ${GALA_HORA_INICIO_TXT}</span>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:${PAPEL};border-top:6px solid ${ROJO};">

        <tr><td style="padding:34px 36px 0;">
          <p style="margin:0;font:11px ${mono};letter-spacing:3px;text-transform:uppercase;color:${ROJO};">[ Estás dentro ]</p>
          <h1 style="margin:14px 0 0;font:44px/0.92 ${display};letter-spacing:-0.5px;text-transform:uppercase;color:${TINTA};">
            Gala <span style="color:${ROJO};">MG</span>
          </h1>
          <p style="margin:18px 0 0;font:16px/1.6 Helvetica,Arial,sans-serif;color:#3d3a35;">
            Hola ${nombre}: tu registro quedó <b style="color:${TINTA};">confirmado</b> para la
            Gala MG, el primer encuentro presencial de la comunidad. Abajo está tu pase.
          </p>
        </td></tr>

        <tr><td style="padding:26px 36px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                 style="border-top:1px solid #ddd6ca;border-bottom:1px solid #ddd6ca;">
            <tr><td style="padding:14px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${fila("Cuándo", `${fechaLarga()}`)}
                ${fila("Puertas", `${GALA_HORARIO}`)}
                ${fila("Dónde", `${GALA_CIUDAD} · te enviamos la dirección exacta por este medio`)}
                ${fila("Cover", "Sin costo")}
              </table>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:28px 36px 0;" align="center">
          <a href="${urlPase}" style="display:block;background:${ROJO};color:#ffffff;text-decoration:none;padding:20px 28px;font:13px ${mono};letter-spacing:3px;text-transform:uppercase;font-weight:bold;">
            Abrir mi pase de entrada
          </a>
          <p style="margin:14px 0 0;font:12px/1.6 Helvetica,Arial,sans-serif;color:#8a8378;">
            Si el botón no abre, copia este enlace:<br>
            <span style="color:#3d3a35;word-break:break-all;">${urlPase}</span>
          </p>
        </td></tr>

        <tr><td style="padding:24px 36px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px dashed #c9c1b4;">
            <tr><td align="center" style="padding:18px;">
              <p style="margin:0;font:10px ${mono};letter-spacing:3px;text-transform:uppercase;color:#8a8378;">Tu código</p>
              <p style="margin:8px 0 0;font:24px ${mono};letter-spacing:2px;color:${TINTA};font-weight:bold;">${r.codigo}</p>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:24px 36px 34px;">
          <p style="margin:0;font:13px/1.7 Helvetica,Arial,sans-serif;color:#6b665e;">
            El pase es <b style="color:${TINTA};">único e intransferible</b>: se muestra en la
            puerta desde el celular y sirve una sola vez. Llega con tiempo — la acreditación
            toma unos minutos y el showcase empieza puntual.
          </p>
          <p style="margin:18px 0 0;font:13px/1.7 Helvetica,Arial,sans-serif;color:#6b665e;">
            Si ya no puedes venir, respóndenos este correo: hay gente en lista de espera
            esperando ese lugar.
          </p>
        </td></tr>

        <tr><td style="padding:20px 36px;background:${TINTA};">
          <p style="margin:0;font:11px ${mono};letter-spacing:2px;text-transform:uppercase;color:#8a8378;">
            MG Company Group · mgcompany.co
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`
}

export function textoPase(r: DatosPase, urlPase: string): string {
  return [
    `Hola ${primerNombre(r)}:`,
    ``,
    `Tu registro quedó confirmado para la Gala MG, el primer encuentro presencial de la comunidad.`,
    ``,
    `Cuándo: ${fechaLarga()}`,
    `Puertas: ${GALA_HORARIO}`,
    `Dónde: ${GALA_CIUDAD} — te enviamos la dirección exacta por este medio`,
    `Cover: sin costo`,
    ``,
    `Tu pase de entrada:`,
    urlPase,
    ``,
    `Código: ${r.codigo}`,
    ``,
    `Es único e intransferible: se muestra en la puerta desde el celular. Llega con tiempo,`,
    `la acreditación toma unos minutos.`,
    ``,
    `Si ya no puedes venir, responde este correo: hay gente en lista de espera.`,
    ``,
    `Equipo MG Company`,
  ].join("\n")
}
