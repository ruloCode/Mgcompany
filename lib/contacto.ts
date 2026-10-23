/* ============================================================
   Cómo se escribe un contacto, y cómo se reconoce a una persona
   ============================================================
   Toda la comunidad cuelga de una idea: una persona es un CORREO. No el
   nombre (se escribe distinto cada vez) ni el teléfono (llega con y sin +57,
   con espacios, con el 0 de larga distancia). Para que eso funcione, el mismo
   buzón tiene que producir siempre la misma clave, y eso es lo que hace este
   archivo.

   Va sin "server-only" a propósito: el formulario usa las mismas funciones
   para avisar en vivo ("ese no parece un usuario de Instagram") y el servidor
   las vuelve a correr, porque al navegador no se le cree. */

const GMAIL = new Set(["gmail.com", "googlemail.com"])

/** El correo tal como se le va a escribir: sin espacios y en minúsculas. */
export function correoDeEnvio(bruto: string): string {
  return bruto.trim().toLowerCase()
}

/** La IDENTIDAD de una persona: el buzón que hay detrás del correo.
 *
 *  - Sin `+etiqueta`: `rulo+fiesta@` y `rulo@` caen en el mismo buzón en
 *    Gmail, Outlook y casi todos. Es además el truco de duplicado más barato.
 *  - Sin puntos, PERO solo en Gmail: ahí `r.u.l.o@` y `rulo@` son el mismo
 *    buzón. En otros proveedores los puntos sí distinguen cuentas, y
 *    fusionarlos juntaría a dos personas distintas en una.
 *  - `googlemail.com` es Gmail con otro nombre.
 *
 *  Esta clave NO se usa para escribirle a nadie: el correo sale a lo que la
 *  persona escribió (correoDeEnvio). */
export function normalizarEmail(bruto: string): string {
  const limpio = correoDeEnvio(bruto)
  const arroba = limpio.lastIndexOf("@")
  if (arroba < 1) return limpio

  let local = limpio.slice(0, arroba).split("+")[0]
  let dominio = limpio.slice(arroba + 1)

  if (GMAIL.has(dominio)) {
    local = local.replaceAll(".", "")
    dominio = "gmail.com"
  }
  return `${local}@${dominio}`
}

/** WhatsApp en formato internacional (+573001234567), o null si no se puede
 *  saber cuál es.
 *
 *  Es el formato que piden Meta y TikTok para subir audiencias, y el único que
 *  permite comparar dos teléfonos escritos distinto. Lo que entra llega de mil
 *  formas: "300 123 4567", "+57 300-123-4567", "573001234567",
 *  "0057 3001234567". */
export function normalizarWhatsapp(bruto: string): string | null {
  const tieneMas = bruto.trim().startsWith("+")
  let digitos = bruto.replace(/\D/g, "")
  if (!digitos) return null

  // 00 es el prefijo internacional marcado a mano: "0057..." = "+57..."
  if (digitos.startsWith("00")) digitos = digitos.slice(2)

  // Colombia sin indicativo: celulares (3xx) y fijos del plan de 2021 (60x),
  // ambos de 10 dígitos.
  if (digitos.length === 10 && (digitos.startsWith("3") || digitos.startsWith("60"))) {
    return `+57${digitos}`
  }
  if (digitos.length === 12 && digitos.startsWith("57")) return `+${digitos}`

  // Otro país: solo si lo escribieron con + o con 00. Un número largo sin
  // indicativo explícito es más probable que sea un error que un extranjero.
  if ((tieneMas || bruto.trim().startsWith("00")) && digitos.length >= 8 && digitos.length <= 15) {
    return `+${digitos}`
  }
  return null
}

export type Red = "instagram" | "tiktok"

const PATRON_USUARIO: Record<Red, RegExp> = {
  // Instagram: letras, números, punto y guion bajo; hasta 30.
  instagram: /^[a-z0-9._]{1,30}$/,
  // TikTok: lo mismo, de 2 a 24.
  tiktok: /^[a-z0-9._]{2,24}$/,
}

/* Rutas de Instagram que NO son un usuario: si alguien pega el link de un
   post o un reel, de ahí no se puede sacar de quién es la cuenta. */
const RUTAS_IG = new Set(["p", "reel", "reels", "stories", "explore", "tv", "share"])

/** El usuario de Instagram o TikTok sin @ ni URL, o null si lo que llegó no
 *  permite saber cuál es.
 *
 *  Se aceptan las tres formas en que la gente lo pega: "@rulo",
 *  "rulo" e "https://instagram.com/rulo?igsh=…". */
export function usuarioDeRed(bruto: string, red: Red): string | null {
  let s = bruto.trim()
  if (!s) return null

  const esUrl = /^(https?:\/\/)?(www\.|m\.|vm\.)?(instagram\.com|instagr\.am|tiktok\.com)\//i.test(s)
  if (esUrl) {
    try {
      const url = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`)
      const partes = url.pathname.split("/").filter(Boolean)
      if (red === "instagram") {
        if (!partes[0] || RUTAS_IG.has(partes[0].toLowerCase())) return null
        s = partes[0]
      } else {
        // TikTok: /@usuario/video/…  — sin @ es un enlace corto (vm.tiktok)
        // que no dice de quién es.
        const conArroba = partes.find((p) => p.startsWith("@"))
        if (!conArroba) return null
        s = conArroba
      }
    } catch {
      return null
    }
  }

  s = s.replace(/^@+/, "").toLowerCase()
  return PATRON_USUARIO[red].test(s) ? s : null
}

export const urlPerfil = (red: Red, usuario: string) =>
  red === "instagram" ? `https://instagram.com/${usuario}` : `https://www.tiktok.com/@${usuario}`

/** Años cumplidos en una fecha dada, las dos como "YYYY-MM-DD".
 *  Se compara texto con texto a propósito: con objetos Date, la zona horaria
 *  puede mover un cumpleaños de día y dejar fuera a quien cumple justo ese día. */
export function edadEn(nacimiento: string, enFecha: string): number {
  const [an, mn, dn] = nacimiento.split("-").map(Number)
  const [af, mf, df] = enFecha.split("-").map(Number)
  let edad = af - an
  if (mf < mn || (mf === mn && df < dn)) edad--
  return edad
}
