"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import jsQR from "jsqr"
import { acreditarPorCodigo, type ResultadoPuerta } from "@/app/admin/acciones"
import { codigoDeLoEscaneado, etiquetaTipo } from "@/lib/gala"

/* Modo puerta.
 *
 * Se decodifica con jsQR sobre un canvas y no con BarcodeDetector, que sería
 * más rápido: BarcodeDetector no existe en Safari de iOS, y en una puerta la
 * mitad de los teléfonos del equipo van a ser iPhone. Un solo camino que
 * funciona en todos vale más que dos caminos y una sorpresa a las 6 p.m.
 *
 * Tres decisiones que vienen de que esto se usa de pie y con prisa:
 *
 *   - La cámara arranca con un botón, no sola. iOS exige un gesto para
 *     getUserMedia, y además nadie quiere que se encienda la cámara al abrir
 *     una pantalla por error.
 *   - Tras cada lectura el escaneo se detiene y hay que tocar "Siguiente".
 *     Si siguiera leyendo, el mismo QR se dispararía cinco veces mientras la
 *     persona guarda el celular, y el veredicto de la anterior desaparecería
 *     antes de que nadie lo lea.
 *   - Hay campo para teclear el código. Las cámaras fallan: pantalla rota,
 *     brillo al mínimo, captura de pantalla borrosa. Sin plan B se forma fila.
 */

type Estado = "apagada" | "pidiendo" | "escaneando" | "resultado" | "error"

const COLOR: Record<string, string> = {
  entra: "var(--good)",
  repetido: "var(--c-release)",
  no_confirmado: "var(--bad)",
  desconocido: "var(--bad)",
  sin_permiso: "var(--bad)",
  error: "var(--bad)",
}

const TITULO: Record<string, string> = {
  entra: "ADELANTE",
  repetido: "YA HABÍA ENTRADO",
  no_confirmado: "PASE NO VÁLIDO",
  desconocido: "PASE NO ENCONTRADO",
  sin_permiso: "SIN PERMISO",
  error: "ALGO FALLÓ",
}

export default function EscanerPuerta({ entraron, confirmados }: { entraron: number; confirmados: number }) {
  const [estado, setEstado] = useState<Estado>("apagada")
  const [fallo, setFallo] = useState<string | null>(null)
  const [res, setRes] = useState<ResultadoPuerta | null>(null)
  const [manual, setManual] = useState("")
  const [linterna, setLinterna] = useState(false)
  const [puedeLinterna, setPuedeLinterna] = useState(false)
  const [contador, setContador] = useState(entraron)

  const video = useRef<HTMLVideoElement>(null)
  const lienzo = useRef<HTMLCanvasElement>(null)
  const flujo = useRef<MediaStream | null>(null)
  const lazo = useRef<number | null>(null)
  const ocupado = useRef(false)
  /* El último pase leído y cuándo. Al reanudar, el QR de quien acaba de pasar
     sigue delante de la cámara y se volvería a disparar en el mismo cuadro:
     el veredicto anterior desaparecería y el campo manual sería inusable. Se
     ignora el mismo código durante unos segundos; otro distinto entra ya. */
  const ultimo = useRef<{ codigo: string; cuando: number } | null>(null)
  const ESPERA_MISMO_CODIGO = 5000

  const apagar = useCallback(() => {
    if (lazo.current) cancelAnimationFrame(lazo.current)
    lazo.current = null
    flujo.current?.getTracks().forEach((t) => t.stop())
    flujo.current = null
  }, [])

  // La cámara no puede quedarse encendida si alguien sale de la pantalla.
  useEffect(() => apagar, [apagar])

  const resolver = useCallback(async (bruto: string) => {
    if (ocupado.current) return
    ocupado.current = true
    if (lazo.current) cancelAnimationFrame(lazo.current)

    const codigo = codigoDeLoEscaneado(bruto)
    if (codigo) ultimo.current = { codigo, cuando: Date.now() }

    const r = await acreditarPorCodigo(bruto)
    setRes(r)
    setEstado("resultado")
    setManual("")
    if (r.veredicto === "entra") setContador((n) => n + 1)

    // Vibrar: en una puerta ruidosa el aviso llega por la mano, no por la vista.
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(r.veredicto === "entra" ? 60 : [50, 60, 50])
    }
    ocupado.current = false
  }, [])

  const mirar = useCallback(() => {
    const v = video.current
    const c = lienzo.current
    if (!v || !c || v.readyState !== v.HAVE_ENOUGH_DATA) {
      lazo.current = requestAnimationFrame(mirar)
      return
    }

    // Se decodifica a 480 px de ancho: a resolución completa un teléfono de
    // gama media baja del 30 % de los cuadros y el escaneo se siente pegajoso.
    const ancho = 480
    const alto = Math.round((v.videoHeight / v.videoWidth) * ancho) || 640
    c.width = ancho
    c.height = alto

    const ctx = c.getContext("2d", { willReadFrequently: true })
    if (!ctx) return
    ctx.drawImage(v, 0, 0, ancho, alto)

    const img = ctx.getImageData(0, 0, ancho, alto)
    const hallado = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" })

    if (hallado?.data) {
      const codigo = codigoDeLoEscaneado(hallado.data)
      const repetidoReciente =
        codigo &&
        ultimo.current?.codigo === codigo &&
        Date.now() - ultimo.current.cuando < ESPERA_MISMO_CODIGO

      if (!repetidoReciente) {
        void resolver(hallado.data)
        return
      }
    }
    lazo.current = requestAnimationFrame(mirar)
  }, [resolver])

  const encender = useCallback(async () => {
    setFallo(null)
    setEstado("pidiendo")
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
        audio: false,
      })
      flujo.current = s
      if (video.current) {
        video.current.srcObject = s
        await video.current.play()
      }

      const pista = s.getVideoTracks()[0]
      const caps = pista?.getCapabilities?.() as (MediaTrackCapabilities & { torch?: boolean }) | undefined
      setPuedeLinterna(Boolean(caps?.torch))

      setEstado("escaneando")
      lazo.current = requestAnimationFrame(mirar)
    } catch (e) {
      apagar()
      setEstado("error")
      const nombre = e instanceof DOMException ? e.name : ""
      setFallo(
        nombre === "NotAllowedError"
          ? "No diste permiso de cámara. Ábrelo desde el candado de la barra de direcciones y vuelve a intentar."
          : nombre === "NotFoundError"
            ? "Este dispositivo no tiene cámara disponible."
            : "No se pudo abrir la cámara. Usa el código escrito mientras tanto.",
      )
    }
  }, [mirar, apagar])

  const alternarLinterna = useCallback(async () => {
    const pista = flujo.current?.getVideoTracks()[0]
    if (!pista) return
    try {
      // `torch` no está en los tipos del DOM todavía, pero Android sí lo aplica.
      await pista.applyConstraints({ advanced: [{ torch: !linterna }] } as unknown as MediaTrackConstraints)
      setLinterna((v) => !v)
    } catch {
      setPuedeLinterna(false)
    }
  }, [linterna])

  const siguiente = useCallback(() => {
    setRes(null)
    if (flujo.current) {
      setEstado("escaneando")
      lazo.current = requestAnimationFrame(mirar)
    } else {
      setEstado("apagada")
    }
  }, [mirar])

  const enviarManual = (e: React.FormEvent) => {
    e.preventDefault()
    if (manual.trim()) void resolver(manual)
  }

  /** Teclear y escanear a la vez no se puede: el visor se dispararía encima de
   *  lo que la persona está escribiendo. Enfocar el campo pausa la lectura. */
  const pausarPorTeclado = () => {
    if (lazo.current) cancelAnimationFrame(lazo.current)
    lazo.current = null
  }

  const reanudarTrasTeclado = () => {
    if (flujo.current && estado === "escaneando" && lazo.current === null) {
      lazo.current = requestAnimationFrame(mirar)
    }
  }

  return (
    <div className="puerta">
      <div className="puerta-barra">
        <Link className="btn sm ghost" href="/admin/gala">← Lista</Link>
        <span className="puerta-cuenta mono">
          <b>{contador}</b> / {confirmados} adentro
        </span>
      </div>

      <div className="puerta-visor">
        <video ref={video} playsInline muted autoPlay
          className={estado === "escaneando" ? "vivo" : undefined} />
        <canvas ref={lienzo} hidden />

        {estado === "escaneando" ? <div className="puerta-mira" aria-hidden /> : null}

        {estado === "apagada" || estado === "error" ? (
          <div className="puerta-encima">
            <p className="small muted">Apunta al QR del pase. La cámara solo se enciende aquí.</p>
            <button className="btn primary" onClick={encender}>Encender cámara</button>
            {fallo ? <p className="small" style={{ color: "var(--bad)", marginTop: 10 }}>{fallo}</p> : null}
          </div>
        ) : null}

        {estado === "pidiendo" ? (
          <div className="puerta-encima"><p className="small muted">Pidiendo permiso de cámara…</p></div>
        ) : null}

        {estado === "resultado" && res ? (
          <div className="puerta-veredicto" style={{ "--c": COLOR[res.veredicto] } as React.CSSProperties}>
            <p className="titulo">{TITULO[res.veredicto]}</p>
            {res.registro ? (
              <>
                <p className="quien">{res.registro.nombre_artistico || res.registro.nombre_completo}</p>
                {res.registro.nombre_artistico ? (
                  <p className="small muted">{res.registro.nombre_completo}</p>
                ) : null}
                <p className="small mono">
                  {etiquetaTipo(res.registro.tipo_asistente)} · {res.registro.codigo}
                </p>
              </>
            ) : null}
            <p className="small" style={{ marginTop: 8 }}>{res.mensaje}</p>
            <button className="btn primary" onClick={siguiente} autoFocus>Siguiente</button>
          </div>
        ) : null}
      </div>

      <div className="puerta-pie">
        {puedeLinterna && estado === "escaneando" ? (
          <button className="btn" onClick={alternarLinterna}>
            {linterna ? "Apagar luz" : "Encender luz"}
          </button>
        ) : null}

        <form onSubmit={enviarManual} className="puerta-manual">
          <input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            onFocus={pausarPorTeclado}
            onBlur={reanudarTrasTeclado}
            placeholder="MG-XXXXXXXX"
            aria-label="Código del pase escrito a mano"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
          />
          <button className="btn" type="submit" disabled={!manual.trim()}>Buscar</button>
        </form>
      </div>
    </div>
  )
}
