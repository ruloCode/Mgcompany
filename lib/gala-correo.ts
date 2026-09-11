import {
  GALA_BARRIO,
  GALA_CIUDAD,
  GALA_DIRECCION,
  GALA_HORARIO,
  GALA_HORA_FIN_TXT,
  GALA_HORA_INICIO_TXT,
  GALA_MAPS,
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
                ${fila("Dónde", `<b>${GALA_DIRECCION}</b> — ${GALA_BARRIO}<br><a href="${GALA_MAPS}" style="color:${ROJO};">Abrir en Google Maps</a>`)}
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
    `Dónde: ${GALA_DIRECCION} — ${GALA_BARRIO}`,
    `Abrir en Google Maps: ${GALA_MAPS}`,
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

/* ============================================================
   El recordatorio del día del evento
   ============================================================
   La primera versión de este correo era una tarjeta con cabecera roja a sangre
   y dos botones de ancho completo. Se veía bien y cayó en la pestaña de
   Promociones de Gmail.

   No es casualidad: Gmail clasifica por señales de "campaña", y las más
   fuertes son justo esas — bloques de color a sangre, botones grandes con
   relleno, varias llamadas a la acción, mucho HTML de maquetación. Un correo
   que parece un boletín se archiva como boletín.

   Así que esta versión renuncia a la tarjeta. Es una carta: alineada a la
   izquierda, con enlaces de texto en vez de botones, un solo color de acento,
   poca maquetación y firma de una persona. Menos vistosa y con más
   probabilidad de que la lean, que es lo único que importa hoy.

   Honestidad sobre el alcance: nadie garantiza la bandeja principal. Gmail
   pesa también la reputación del remitente y el historial de cada
   destinatario, y el dominio empezó a enviar ayer. Esto mejora las
   probabilidades; no las compra.

   Qué se mantiene del aprendizaje de las apps de tiquetes: la dirección va
   arriba y con su enlace a Maps a un toque, porque nadie copia una dirección
   a mano. Solo que ahora es un enlace, no un botón. */

export function asuntoRecordatorio(): string {
  return `Hoy nos vemos · ${GALA_DIRECCION}, ${GALA_BARRIO} · puertas ${GALA_HORA_INICIO_TXT}`
}

export function htmlRecordatorio(r: DatosPase, urlPase: string): string {
  const nombre = primerNombre(r)
  const cuerpo = "font-family:Helvetica,Arial,sans-serif;font-size:16px;line-height:1.65;color:#1a1a1a;"
  const enlace = `color:${ROJO};text-decoration:underline;`

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>${asuntoRecordatorio()}</title></head>
<body style="margin:0;padding:0;background:#ffffff;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
    <tr><td align="left" style="padding:28px 20px;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:520px;">

        <tr><td style="${cuerpo}">
          <p style="margin:0 0 16px;">Hola ${nombre},</p>

          <p style="margin:0 0 16px;">
            Hoy es la Gala MG. Te paso la dirección, que por ser un evento
            privado no está publicada en ningún lado:
          </p>

          <p style="margin:0 0 16px;">
            <b>${GALA_DIRECCION}</b> — ${GALA_BARRIO}<br>
            <a href="${GALA_MAPS}" style="${enlace}">Abrir en Google Maps</a>
          </p>

          <p style="margin:0 0 16px;">
            Puertas a las <b>${GALA_HORA_INICIO_TXT}</b> y cerramos a las ${GALA_HORA_FIN_TXT}.
            Llega con tiempo: la acreditación toma unos minutos y el showcase
            empieza puntual.
          </p>

          <p style="margin:0 0 16px;">
            En la puerta te leemos el QR desde el celular. Tu pase es
            <b>${r.codigo}</b> y lo abres aquí:<br>
            <a href="${urlPase}" style="${enlace}">${urlPase}</a>
          </p>

          <p style="margin:0 0 16px;">
            Ábrelo antes de llegar, por si la señal falla. Es único e
            intransferible y sirve una sola vez.
          </p>

          <p style="margin:0 0 16px;">
            Si al final no puedes venir, respóndeme este correo — hay gente
            esperando ese lugar.
          </p>

          <p style="margin:0 0 4px;">Nos vemos esta tarde,</p>
          <p style="margin:0;">Rulo<br>
            <span style="color:#6b665e;font-size:14px;">MG Company Group</span>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`
}

export function textoRecordatorio(r: DatosPase, urlPase: string): string {
  return [
    `Hola ${primerNombre(r)},`,
    ``,
    `Hoy es la Gala MG. Te paso la dirección, que por ser un evento privado no`,
    `está publicada en ningún lado:`,
    ``,
    `${GALA_DIRECCION} — ${GALA_BARRIO}`,
    `Abrir en Google Maps: ${GALA_MAPS}`,
    ``,
    `Puertas a las ${GALA_HORA_INICIO_TXT} y cerramos a las ${GALA_HORA_FIN_TXT}. Llega con tiempo:`,
    `la acreditación toma unos minutos y el showcase empieza puntual.`,
    ``,
    `En la puerta te leemos el QR desde el celular. Tu pase es ${r.codigo} y lo`,
    `abres aquí: ${urlPase}`,
    ``,
    `Ábrelo antes de llegar, por si la señal falla. Es único e intransferible y`,
    `sirve una sola vez.`,
    ``,
    `Si al final no puedes venir, respóndeme este correo — hay gente esperando`,
    `ese lugar.`,
    ``,
    `Nos vemos esta tarde,`,
    `Rulo`,
    `MG Company Group`,
  ].join("\n")
}
