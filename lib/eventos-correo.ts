import "server-only"

import QRCode from "qrcode"

import { CORREO_RESPONDER_A, getResend } from "./correo"
import { LEYENDA_ALCOHOL, CONTENIDO_EVENTOS, fechaEvento, horaEvento } from "./eventos"
import { urlImagenQr, urlInvitacion, urlPase, type Evento } from "./eventos-datos"

/* ============================================================
   El correo del pase
   ============================================================
   Es la única forma de entrar a la fiesta, así que tiene que funcionar en la
   peor condición posible: la puerta de una discoteca en Soacha, con el celular
   al 5 % y sin señal.

   Por eso el QR va TRES veces:
   1. Como imagen dentro del correo. Gmail la guarda en caché al abrirlo, así
      que se sigue viendo sin datos.
   2. Como archivo adjunto, para quien lo quiera guardar en la galería.
   3. Como enlace al pase en la web, que además marca el correo como
      verificado (lib/eventos-datos.ts → abrirPase).
   Y debajo del QR, el código en texto: si todo lo demás falla, en la puerta
   se teclea. */

const REMITE = process.env.EVENTOS_CORREO_DE ?? "MG Company <panel@mgcompany.co>"
const SITIO = process.env.NEXT_PUBLIC_SITIO ?? "https://mgcompany.co"

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

interface DatosCorreo {
  evento: Evento
  nombre: string
  email: string
  codigo: string
  ref: string
}

export function asuntoPase(evento: Evento) {
  return `Tu QR para ${evento.nombre} · estás en la lista`
}

function html({ evento, nombre, codigo, ref }: DatosCorreo): string {
  const contenido = CONTENIDO_EVENTOS[evento.slug]
  const primerNombre = esc(nombre.split(" ")[0])
  const lugar = [evento.lugar, evento.direccion, evento.ciudad].filter(Boolean).map((x) => esc(x!)).join(" · ")
  const invitacion = urlInvitacion(evento.slug, ref)

  const concurso = contenido?.concurso
    ? `<tr><td style="padding:30px 32px 0 32px;">
        <div style="border:1px solid #2a2a2a;padding:20px 22px;">
          <p style="margin:0 0 8px;font-family:'Courier New',Courier,monospace;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#E8200C;">🍾 ${esc(contenido.concurso.titulo)}</p>
          ${contenido.concurso.reglas.map((r) => `<p style="margin:0 0 8px;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.55;color:#b8b8b8;">${esc(r)}</p>`).join("")}
          <p style="margin:14px 0 6px;font-family:Helvetica,Arial,sans-serif;font-size:13px;color:#8a8a8a;">Tu link personal:</p>
          <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:13px;word-break:break-all;"><a href="${invitacion}" style="color:#ffffff;">${invitacion}</a></p>
        </div>
      </td></tr>`
    : ""

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark">
<title>${esc(evento.nombre)}</title></head>
<body style="margin:0;padding:0;background-color:#111111;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#111111;">Tu QR para ${esc(evento.nombre)}. Tómale captura: en la puerta puede no haber señal.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#111111;">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
    <tr><td style="height:8px;background-color:#E8200C;line-height:8px;font-size:8px;">&nbsp;</td></tr>
  </table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background-color:#111111;">
    <tr><td style="padding:34px 32px 0 32px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="padding-right:12px;" valign="middle"><img src="${SITIO}/logo-mg.png" width="34" height="34" alt="MG" style="display:block;width:34px;height:34px;border:0;"></td>
        <td valign="middle"><span style="font-family:'Courier New',Courier,monospace;font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:#E8200C;">[ ${esc(contenido?.etiqueta ?? "MG Company")} ]</span></td>
      </tr></table>
    </td></tr>

    <tr><td style="padding:26px 32px 0 32px;">
      <h1 style="margin:0;font-family:'Arial Black','Helvetica Neue',Helvetica,Arial,sans-serif;font-weight:900;font-size:34px;line-height:0.95;letter-spacing:-0.5px;text-transform:uppercase;color:#ffffff;">Estás en la lista,<br>${primerNombre}</h1>
      <div style="margin-top:14px;width:48px;height:2px;background-color:#E8200C;line-height:2px;font-size:2px;">&nbsp;</div>
    </td></tr>

    <tr><td style="padding:22px 32px 0 32px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#b8b8b8;">
      <p style="margin:0;">Este es tu pase para <b style="color:#ffffff;">${esc(evento.nombre)}</b>. Es personal y es la única forma de entrar: muéstralo en la puerta.</p>
    </td></tr>

    <!-- El QR. Fondo blanco SIEMPRE: un lector necesita contraste, y en modo
         oscuro algunos clientes invierten los colores de lo que no lo tiene. -->
    <tr><td align="center" style="padding:28px 32px 0 32px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td bgcolor="#ffffff" style="background-color:#ffffff;padding:16px;">
          <img src="${urlImagenQr(codigo)}" width="240" height="240" alt="QR de tu pase ${codigo}" style="display:block;width:240px;height:240px;border:0;">
        </td>
      </tr></table>
      <p style="margin:14px 0 0;font-family:'Courier New',Courier,monospace;font-size:20px;font-weight:bold;letter-spacing:.14em;color:#ffffff;">${codigo}</p>
      <p style="margin:6px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#8a8a8a;">📸 Tómale captura de pantalla: en la puerta puede no haber señal.</p>
    </td></tr>

    <tr><td style="padding:28px 32px 0 32px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #2a2a2a;border-bottom:1px solid #2a2a2a;">
        <tr><td style="padding:16px 0;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.7;color:#b8b8b8;">
          <b style="color:#ffffff;">${esc(fechaEvento(evento.fecha))}</b> · desde las ${esc(horaEvento(evento.hora_puertas))}<br>
          ${lugar}${evento.mapa_url ? `<br><a href="${esc(evento.mapa_url)}" style="color:#E8200C;">Ver en el mapa →</a>` : ""}
        </td></tr>
      </table>
    </td></tr>

    <tr><td style="padding:28px 32px 0 32px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="#E8200C" style="background-color:#E8200C;">
        <a href="${urlPase(codigo)}" style="display:inline-block;padding:15px 30px;font-family:'Courier New',Courier,monospace;font-size:12px;font-weight:bold;letter-spacing:.18em;text-transform:uppercase;color:#ffffff;text-decoration:none;">Abrir mi pase</a>
      </td></tr></table>
    </td></tr>

    ${concurso}

    <tr><td style="padding:30px 32px 36px 32px;">
      <div style="height:1px;background-color:#2a2a2a;line-height:1px;font-size:1px;margin-bottom:18px;">&nbsp;</div>
      <p style="margin:0 0 10px;font-family:Helvetica,Arial,sans-serif;font-size:11px;line-height:1.55;color:#6e6e6e;">${esc(LEYENDA_ALCOHOL)}</p>
      <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#4a4a4a;">MG Company Group &middot; Bogot&aacute;, Colombia</p>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`
}

function texto({ evento, nombre, codigo, ref }: DatosCorreo): string {
  const contenido = CONTENIDO_EVENTOS[evento.slug]
  return [
    `Estás en la lista, ${nombre.split(" ")[0]}.`,
    ``,
    `Tu pase para ${evento.nombre}: ${codigo}`,
    `Ábrelo aquí: ${urlPase(codigo)}`,
    `Tómale captura al QR: en la puerta puede no haber señal.`,
    ``,
    `${fechaEvento(evento.fecha)} · desde las ${horaEvento(evento.hora_puertas)}`,
    [evento.lugar, evento.direccion, evento.ciudad].filter(Boolean).join(" · "),
    evento.mapa_url ?? "",
    ...(contenido?.concurso
      ? ["", contenido.concurso.titulo.toUpperCase(), ...contenido.concurso.reglas, `Tu link: ${urlInvitacion(evento.slug, ref)}`]
      : []),
    ``,
    LEYENDA_ALCOHOL,
  ].join("\n")
}

export type ResultadoEnvio = { ok: true } | { ok: false; error: string }

export async function enviarPase(datos: DatosCorreo): Promise<ResultadoEnvio> {
  const resend = getResend()
  if (!resend) return { ok: false, error: "Correo sin configurar (RESEND_API_KEY)" }

  // El QR en PNG para el adjunto: el MISMO contenido que la imagen del correo
  // y que el pase en la web, para que cualquiera de los tres abra la puerta.
  const png = await QRCode.toBuffer(urlPase(datos.codigo), {
    type: "png", width: 600, margin: 2, errorCorrectionLevel: "M",
  })

  const { error } = await resend.emails.send({
    from: REMITE,
    to: datos.email,
    replyTo: CORREO_RESPONDER_A,
    subject: asuntoPase(datos.evento),
    html: html(datos),
    text: texto(datos),
    attachments: [{ filename: `pase-${datos.codigo}.png`, content: png }],
  })
  return error ? { ok: false, error: error.message } : { ok: true }
}
