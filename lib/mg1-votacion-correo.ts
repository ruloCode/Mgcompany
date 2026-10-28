import "server-only"

import { CORREO_RESPONDER_A, getResend } from "./correo"
import { MG1_FIESTA, MG1_VOTACION_CIERRA, fechaLargaVotacion, horaVotacion, type Finalista } from "./mg1-votacion"

/* ============================================================
   El correo que convierte un voto en un voto que cuenta
   ============================================================
   Es corto a propósito: llega a un celular, se abre con prisa y tiene UN
   trabajo — que la persona toque el botón. Todo lo demás (la fiesta, la
   explicación) va debajo y es opcional.

   No dice cómo va la votación. Ni aquí ni en ningún otro sitio público. */

const REMITE = process.env.MG1_CORREO_DE ?? process.env.EVENTOS_CORREO_DE ?? "MG Company <panel@mgcompany.co>"
const SITIO = process.env.NEXT_PUBLIC_SITIO ?? "https://mgcompany.co"

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

/** Tres correos, y la página no sabe cuál salió (ver route.ts):
 *  - `nuevo`: primer voto, o uno que nunca se confirmó. Lleva el enlace.
 *  - `cambio`: ya tenía un voto confirmado y pide otro. Lleva el enlace.
 *  - `ya_cuenta`: pidió el finalista que ya era su voto. Sin enlace: no hay
 *    nada que confirmar, solo avisarle que no tiene que hacer nada. */
type DatosCorreo = {
  nombre: string
  email: string
  finalista: Finalista
} & ({ tipo: "nuevo" | "cambio"; enlace: string } | { tipo: "ya_cuenta" })

export function asuntoVoto({ finalista, tipo }: Pick<DatosCorreo, "finalista" | "tipo">) {
  if (tipo === "ya_cuenta") return `Tu voto por ${finalista.nombre} ya cuenta · MG1`
  return tipo === "cambio"
    ? `Confirma el cambio de tu voto a ${finalista.nombre} · MG1`
    : `Confirma tu voto por ${finalista.nombre} · MG1`
}

const cierre = () => `${fechaLargaVotacion(MG1_VOTACION_CIERRA)}, ${horaVotacion(MG1_VOTACION_CIERRA)}`

function html(datos: DatosCorreo): string {
  const { nombre, finalista, tipo } = datos
  const enlace = datos.tipo === "ya_cuenta" ? null : datos.enlace
  const primerNombre = esc(nombre.split(" ")[0])
  const titular =
    tipo === "ya_cuenta"
      ? `Tu voto ya cuenta,<br>${primerNombre}`
      : tipo === "cambio"
        ? `¿Cambias tu voto,<br>${primerNombre}?`
        : `Un toque y tu voto<br>cuenta, ${primerNombre}`
  const bajada =
    tipo === "ya_cuenta"
      ? `Tu voto por <b style="color:#ffffff;">${esc(finalista.nombre)}</b> ya estaba confirmado. No tienes que hacer nada más.`
      : tipo === "cambio"
        ? `Pediste cambiar tu voto a <b style="color:#ffffff;">${esc(finalista.nombre)}</b>. Tu voto anterior sigue contando hasta que confirmes este.`
        : `Votaste por <b style="color:#ffffff;">${esc(finalista.nombre)}</b> en la final de MG1. Para que cuente, confirma que este correo es tuyo.`
  // Con enlace, el botón. Sin enlace (ya_cuenta), cómo cambiarlo si quiere.
  const accion = enlace
    ? `<tr><td style="padding:26px 32px 0 32px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="#E8200C" style="background-color:#E8200C;">
        <a href="${enlace}" style="display:inline-block;padding:16px 32px;font-family:'Courier New',Courier,monospace;font-size:13px;font-weight:bold;letter-spacing:.18em;text-transform:uppercase;color:#ffffff;text-decoration:none;">${tipo === "cambio" ? "Confirmar el cambio" : "Confirmar mi voto"}</a>
      </td></tr></table>
      <p style="margin:14px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.55;color:#8a8a8a;">La votación cierra el ${esc(cierre())}. Si el botón no abre, copia este enlace en tu navegador:<br><a href="${enlace}" style="color:#b8b8b8;word-break:break-all;">${enlace}</a></p>
    </td></tr>`
    : `<tr><td style="padding:22px 32px 0 32px;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.55;color:#8a8a8a;">La votación cierra el ${esc(cierre())}. Si quieres cambiar tu voto, vota por otro finalista antes del cierre: te llegará un enlace para confirmarlo.</td></tr>`
  const preheader =
    tipo === "ya_cuenta"
      ? `Tu voto por ${esc(finalista.nombre)} ya está confirmado.`
      : `Sin este clic tu voto por ${esc(finalista.nombre)} no se cuenta.`

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark">
<title>${tipo === "ya_cuenta" ? "Tu voto ya cuenta" : "Confirma tu voto"} · MG1</title></head>
<body style="margin:0;padding:0;background-color:#111111;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#111111;">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#111111;">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
    <tr><td style="height:8px;background-color:#E8200C;line-height:8px;font-size:8px;">&nbsp;</td></tr>
  </table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background-color:#111111;">
    <tr><td style="padding:34px 32px 0 32px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="padding-right:12px;" valign="middle"><img src="${SITIO}/logo-mg.png" width="34" height="34" alt="MG" style="display:block;width:34px;height:34px;border:0;"></td>
        <td valign="middle"><span style="font-family:'Courier New',Courier,monospace;font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:#E8200C;">[ MG1 / La final ]</span></td>
      </tr></table>
    </td></tr>

    <tr><td style="padding:26px 32px 0 32px;">
      <h1 style="margin:0;font-family:'Arial Black','Helvetica Neue',Helvetica,Arial,sans-serif;font-weight:900;font-size:32px;line-height:0.98;letter-spacing:-0.5px;text-transform:uppercase;color:#ffffff;">${titular}</h1>
      <div style="margin-top:14px;width:48px;height:2px;background-color:#E8200C;line-height:2px;font-size:2px;">&nbsp;</div>
    </td></tr>

    <tr><td style="padding:22px 32px 0 32px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#b8b8b8;">
      <p style="margin:0;">${bajada}</p>
    </td></tr>

    <tr><td style="padding:26px 32px 0 32px;">
      <div style="border:2px solid #E8200C;padding:16px 20px;">
        <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#E8200C;">Tu voto</p>
        <p style="margin:6px 0 0;font-family:'Arial Black','Helvetica Neue',Helvetica,Arial,sans-serif;font-weight:900;font-size:24px;line-height:1;text-transform:uppercase;color:#ffffff;">${esc(finalista.nombre)}</p>
        <p style="margin:6px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:13px;color:#8a8a8a;">«${esc(finalista.cancion)}»</p>
      </div>
    </td></tr>

    ${accion}

    <tr><td style="padding:28px 32px 0 32px;">
      <div style="border:1px solid #2a2a2a;padding:20px 22px;">
        <p style="margin:0 0 8px;font-family:'Courier New',Courier,monospace;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#E8200C;">👑 ${esc(MG1_FIESTA.nombre)}</p>
        <p style="margin:0 0 8px;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.55;color:#b8b8b8;">El campeón se corona en vivo, la misma noche en que cierra la votación. ${esc(MG1_FIESTA.cuando)} · ${esc(MG1_FIESTA.donde)}. Entrada gratis con registro.</p>
        <p style="margin:12px 0 0;"><a href="${SITIO}${MG1_FIESTA.url}" style="font-family:'Courier New',Courier,monospace;font-size:12px;font-weight:bold;letter-spacing:.16em;text-transform:uppercase;color:#ffffff;">Quiero estar en la lista →</a></p>
      </div>
    </td></tr>

    <tr><td style="padding:30px 32px 36px 32px;">
      <div style="height:1px;background-color:#2a2a2a;line-height:1px;font-size:1px;margin-bottom:18px;">&nbsp;</div>
      <p style="margin:0 0 10px;font-family:Helvetica,Arial,sans-serif;font-size:11px;line-height:1.55;color:#6e6e6e;">${tipo === "ya_cuenta" ? "¿No fuiste tú? Alguien escribió tu correo en la votación. Tu voto no cambió." : "¿No votaste tú? Ignora este correo: sin el clic no se registra nada."}</p>
      <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#4a4a4a;">MG Company Group &middot; Bogot&aacute;, Colombia</p>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`
}

function texto(datos: DatosCorreo): string {
  const { nombre, finalista, tipo } = datos
  const primerNombre = nombre.split(" ")[0]
  const cuerpo =
    datos.tipo === "ya_cuenta"
      ? [
          `${primerNombre}, tu voto por ${finalista.nombre} ya estaba confirmado. No tienes que hacer nada más.`,
          ``,
          `Si quieres cambiarlo, vota por otro finalista antes del cierre: te llegará un enlace para confirmarlo.`,
        ]
      : [
          datos.tipo === "cambio"
            ? `${primerNombre}, pediste cambiar tu voto a ${finalista.nombre}. Tu voto anterior sigue contando hasta que confirmes este.`
            : `${primerNombre}, votaste por ${finalista.nombre} en la final de MG1. Para que cuente, confirma que este correo es tuyo.`,
          ``,
          `${datos.tipo === "cambio" ? "Confirmar el cambio" : "Confirmar mi voto"}: ${datos.enlace}`,
        ]
  return [
    ...cuerpo,
    ``,
    `La votación cierra el ${cierre()}.`,
    ``,
    `${MG1_FIESTA.nombre.toUpperCase()}`,
    `${MG1_FIESTA.cuando} · ${MG1_FIESTA.donde}. Entrada gratis con registro:`,
    `${SITIO}${MG1_FIESTA.url}`,
    ``,
    tipo === "ya_cuenta"
      ? `¿No fuiste tú? Alguien escribió tu correo en la votación. Tu voto no cambió.`
      : `¿No votaste tú? Ignora este correo: sin el clic no se registra nada.`,
  ].join("\n")
}

export type ResultadoEnvio = { ok: true } | { ok: false; error: string }

export async function enviarConfirmacionVoto(datos: DatosCorreo): Promise<ResultadoEnvio> {
  const resend = getResend()
  if (!resend) return { ok: false, error: "Correo sin configurar (RESEND_API_KEY)" }

  const { error } = await resend.emails.send({
    from: REMITE,
    to: datos.email,
    replyTo: CORREO_RESPONDER_A,
    subject: asuntoVoto(datos),
    html: html(datos),
    text: texto(datos),
  })
  return error ? { ok: false, error: error.message } : { ok: true }
}
