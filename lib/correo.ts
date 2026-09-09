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

/* El remitente vive en un subdominio propio (send.mgcompany.co) a propósito:
   mgcompany.co ya tiene MX y SPF de Zoho para el correo humano del equipo, y
   verificar el dominio raíz en Resend obligaría a mezclar las dos cosas. Con un
   subdominio, el correo transaccional y el de las personas no se estorban. */
export const CORREO_DE = process.env.GALA_CORREO_DE ?? "Gala MG <gala@send.mgcompany.co>"
export const CORREO_RESPONDER_A = process.env.GALA_CORREO_RESPONDER_A ?? "admin@mgcompany.co"
