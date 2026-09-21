import "server-only"

import { CORREO_DE, CORREO_RESPONDER_A, getResend } from "./correo"

/* ============================================================
   Los dos correos del alta
   ============================================================
   El panel ya no deja entrar a nadie sin que un admin lo apruebe, y eso abre
   dos silencios que hay que tapar: el admin no sabe que alguien está
   esperando, y quien espera no sabe cuándo le abrieron.

   Los dos envíos son "de mejor esfuerzo": si Resend no está configurado o
   falla, se registra y se sigue. Que no salga un correo no puede tumbar un
   alta ni una activación — la cuenta ya está creada y el aviso del panel
   sigue ahí. */

const SITIO = process.env.NEXT_PUBLIC_SITIO ?? "https://mgcompany.co"

interface Envio {
  para: string[]
  asunto: string
  html: string
  texto: string
}

async function enviar({ para, asunto, html, texto }: Envio): Promise<void> {
  const resend = getResend()
  if (!resend) {
    console.warn("[correos-panel] Sin RESEND_API_KEY: no se envió", asunto)
    return
  }
  if (para.length === 0) return

  const { error } = await resend.emails.send({
    from: CORREO_DE,
    to: para,
    replyTo: CORREO_RESPONDER_A,
    subject: asunto,
    html,
    text: texto,
  })
  if (error) console.error("[correos-panel]", asunto, error.message)
}

/* El mismo lenguaje visual que las plantillas de Supabase
   (supabase/templates/): negro, franja roja arriba, logo, etiqueta en
   mayúsculas espaciadas y botón rojo. Se escribe con tablas y estilos en
   línea porque el correo no entiende flexbox ni hojas de estilo, y con
   'Arial Black' porque Gmail elimina las fuentes web: Bebas Neue no llegaría
   nunca. Mayúsculas y peso hacen el resto. */
function plantilla(titulo: string, cuerpo: string, boton?: { texto: string; url: string }) {
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark">
</head>
<body style="margin:0;padding:0;background-color:#111111;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#111111;">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
    <tr><td style="height:8px;background-color:#E8200C;line-height:8px;font-size:8px;">&nbsp;</td></tr>
  </table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background-color:#111111;">
    <tr><td style="padding:34px 32px 0 32px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="padding-right:12px;" valign="middle">
          <img src="${SITIO}/logo-mg.png" width="34" height="34" alt="MG" style="display:block;width:34px;height:34px;border:0;">
        </td>
        <td valign="middle"><span style="font-family:'Courier New',Courier,monospace;font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:#E8200C;">[ MG / Centro de operaciones ]</span></td>
      </tr></table>
    </td></tr>
    <tr><td style="padding:26px 32px 0 32px;">
      <h1 style="margin:0;font-family:'Arial Black','Helvetica Neue',Helvetica,Arial,sans-serif;font-weight:900;font-size:34px;line-height:0.95;letter-spacing:-0.5px;text-transform:uppercase;color:#ffffff;">${titulo}</h1>
      <div style="margin-top:14px;width:48px;height:2px;background-color:#E8200C;line-height:2px;font-size:2px;">&nbsp;</div>
    </td></tr>
    <tr><td style="padding:22px 32px 0 32px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:#b8b8b8;">${cuerpo}</td></tr>
    ${boton ? `<tr><td style="padding:30px 32px 0 32px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="#E8200C" style="background-color:#E8200C;">
        <a href="${boton.url}" style="display:inline-block;padding:15px 30px;font-family:'Courier New',Courier,monospace;font-size:12px;font-weight:bold;letter-spacing:.18em;text-transform:uppercase;color:#ffffff;text-decoration:none;">${boton.texto}</a>
      </td></tr></table>
    </td></tr>` : ""}
    <tr><td style="padding:30px 32px 36px 32px;">
      <div style="height:1px;background-color:#2a2a2a;line-height:1px;font-size:1px;margin-bottom:18px;">&nbsp;</div>
      <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#4a4a4a;">MG Company Group &middot; Bogot&aacute;, Colombia</p>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`
}

/** A quien puede aprobar: alguien pidió entrar. */
export async function avisarAltaPendiente(
  adminEmails: string[],
  quien: { nombre: string; email: string; rol: string },
) {
  if (adminEmails.length === 0) return
  const url = `${SITIO}/admin/equipo`
  await enviar({
    para: adminEmails,
    asunto: `${quien.nombre} pidió acceso al panel`,
    html: plantilla(
      `${quien.nombre} pidió acceso al panel`,
      `<p style="margin:0 0 14px 0;"><b style="color:#ffffff;">${quien.email}</b> creó una cuenta y quedó como <b>${quien.rol}</b>, inactiva.</p>
       <p style="margin:0;">No puede entrar hasta que alguien del equipo la active. Si no la reconoces, no hagas nada: sin activar, no ve nada.</p>`,
      { texto: "Revisar en Equipo y accesos", url },
    ),
    texto: `${quien.nombre} (${quien.email}) creó una cuenta en el panel y quedó como ${quien.rol}, inactiva.\n\nActívala —o ignórala si no la reconoces— en ${url}`,
  })
}

/** A quien esperaba: ya puede entrar. */
export async function avisarCuentaActivada(
  email: string,
  datos: { nombre: string; rol: string; porQuien: string },
) {
  const url = `${SITIO}/admin`
  await enviar({
    para: [email],
    asunto: "Ya puedes entrar al panel de MG",
    html: plantilla(
      `Listo, ${datos.nombre}`,
      `<p style="margin:0 0 14px 0;">${datos.porQuien} activó tu cuenta. Ya puedes entrar al centro de operaciones con el correo y la contraseña que registraste.</p>
       <p style="margin:0 0 14px 0;">Entras como <b>${datos.rol}</b>, así que verás las secciones de tu área.</p>
       <p style="margin:0;color:#6e6e6e;font-size:13px;">¿Olvidaste la contraseña? En la pantalla de acceso hay un enlace para cambiarla.</p>`,
      { texto: "Entrar al panel", url },
    ),
    texto: `${datos.porQuien} activó tu cuenta en el panel de MG. Entras como ${datos.rol}.\n\n${url}\n\nSi olvidaste la contraseña, en la pantalla de acceso puedes pedir una nueva.`,
  })
}
