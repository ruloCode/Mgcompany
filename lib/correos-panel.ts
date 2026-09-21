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

/** Envoltorio mínimo y sobrio: esto es correo interno, no una campaña. */
function plantilla(titulo: string, cuerpo: string, boton?: { texto: string; url: string }) {
  return `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#111">
  <p style="font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#E8200C;margin:0 0 18px">MG Company · Centro de operaciones</p>
  <h1 style="font-size:22px;line-height:1.25;margin:0 0 14px">${titulo}</h1>
  <div style="font-size:15px;line-height:1.6;color:#333">${cuerpo}</div>
  ${boton ? `<p style="margin:26px 0 0"><a href="${boton.url}" style="display:inline-block;background:#E8200C;color:#fff;text-decoration:none;padding:12px 20px;font-weight:600;font-size:14px">${boton.texto}</a></p>` : ""}
</div>`
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
      `<p><b>${quien.email}</b> creó una cuenta y quedó como <b>${quien.rol}</b>, inactiva.</p>
       <p>No puede entrar hasta que alguien del equipo la active. Si no la reconoces, no hagas nada: sin activar, no ve nada.</p>`,
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
      `<p>${datos.porQuien} activó tu cuenta. Ya puedes entrar al centro de operaciones con el correo y la contraseña que registraste.</p>
       <p>Entras como <b>${datos.rol}</b>, así que verás las secciones de tu área.</p>
       <p style="color:#666;font-size:13px">¿Olvidaste la contraseña? En la pantalla de acceso hay un enlace para cambiarla.</p>`,
      { texto: "Entrar al panel", url },
    ),
    texto: `${datos.porQuien} activó tu cuenta en el panel de MG. Entras como ${datos.rol}.\n\n${url}\n\nSi olvidaste la contraseña, en la pantalla de acceso puedes pedir una nueva.`,
  })
}
