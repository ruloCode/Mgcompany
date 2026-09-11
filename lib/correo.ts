import "server-only"

import { Resend } from "resend"

/**
 * Cliente de Resend.
 *
 * Devuelve null si no hay clave en vez de reventar: el panel tiene que poder
 * abrirse y curar registros aunque el correo no esté configurado todavía. Quien
 * llama decide qué decirle a la persona — un botón que no funciona con un
 * mensaje claro es mejor que una pantalla en blanco.
 */
let cliente: Resend | null = null

export function getResend(): Resend | null {
  if (cliente) return cliente
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  cliente = new Resend(key)
  return cliente
}

export const correoConfigurado = () => Boolean(process.env.RESEND_API_KEY)

/* Se envía desde el dominio raíz, que es el que está verificado en Resend.
   No estorba al correo humano del equipo: Zoho conserva el MX y el SPF de la
   raíz, y Resend firma con su propia DKIM (resend._domainkey) y usa
   send.mgcompany.co solo como remite de rebotes. Las dos cosas conviven
   porque viven en registros distintos.

   Ojo con RESPONDER_A: el correo invita a responder ("si ya no puedes venir,
   respóndenos"), así que tiene que ser un buzón que alguien lea de verdad en
   Zoho. Si no existe, esas respuestas rebotan. */
/* Nombre de persona, no de marca: "Gala MG" se lee como remitente de campaña
   y Gmail lo clasifica como tal. Un nombre propio con la empresa detrás es lo
   que hace la gente cuando escribe de verdad. */
export const CORREO_DE = process.env.GALA_CORREO_DE ?? "Rulo · MG Company <gala@mgcompany.co>"
export const CORREO_RESPONDER_A = process.env.GALA_CORREO_RESPONDER_A ?? "gala@mgcompany.co"
