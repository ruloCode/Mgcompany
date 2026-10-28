"use client"

import { useId } from "react"

import { cn } from "@/lib/utils"

/* El Disco Ruby de cada finalista: el premio, con su nombre en la etiqueta y
   su canción grabada en el surco.

   Gira solo mientras suena. Se pausa con `animation-play-state` y no
   quitando la animación: así el disco se detiene donde iba, como uno de
   verdad, en vez de saltar a la posición inicial. El brazo del tocadiscos
   baja sobre el disco al sonar y vuelve a su sitio al pausar. */

interface Props {
  nombre: string
  cancion: string
  girando: boolean
  className?: string
}

/** El nombre en una o dos líneas, con un tamaño que quepa en la etiqueta. */
function lineasDe(nombre: string): { lineas: string[]; tam: number } {
  const n = nombre.toUpperCase()
  const partes = n.split(" ")
  const lineas =
    n.length > 11 && partes.length > 1
      ? [partes.slice(0, Math.ceil(partes.length / 2)).join(" "), partes.slice(Math.ceil(partes.length / 2)).join(" ")]
      : [n]
  const larga = Math.max(...lineas.map((l) => l.length))
  // Bebas ocupa ~0,42 em por letra; la etiqueta deja ~58 unidades de ancho.
  const tam = Math.max(8, Math.min(lineas.length > 1 ? 13 : 19, 58 / (larga * 0.42)))
  return { lineas, tam }
}

export default function DiscoFinalista({ nombre, cancion, girando, className }: Props) {
  const id = useId().replace(/:/g, "")
  const { lineas, tam } = lineasDe(nombre)

  // El surco repite la canción y el nombre hasta dar la vuelta completa.
  const frase = `«${cancion}» · ${nombre} · Final MG1 · `.toUpperCase()
  const surco = frase.length < 34 ? frase.repeat(2) : frase

  return (
    <svg
      viewBox="0 0 220 220"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("block h-auto w-full overflow-visible", className)}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`${id}-ruby`} cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#ff6b52" />
          <stop offset="45%" stopColor="#E8200C" />
          <stop offset="80%" stopColor="#5e0d04" />
          <stop offset="100%" stopColor="#1c0300" />
        </radialGradient>
        <radialGradient id={`${id}-oro`} cx="35%" cy="28%" r="95%">
          <stop offset="0%" stopColor="#f9e79b" />
          <stop offset="55%" stopColor="#d4af37" />
          <stop offset="100%" stopColor="#8a6a1c" />
        </radialGradient>
        <linearGradient id={`${id}-brillo`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.32" />
          <stop offset="40%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="60%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.14" />
        </linearGradient>
        <path id={`${id}-arco`} d="M 110 47 a 63 63 0 1 1 -0.1 0" fill="none" />
      </defs>

      {/* El plato */}
      <circle cx="110" cy="110" r="100" fill="#0b0b0b" stroke="#ffffff14" strokeWidth="1" />

      <g
        className="mg1-anim"
        style={{
          transformOrigin: "110px 110px",
          animation: "mg1-spin 2.4s linear infinite",
          animationPlayState: girando ? "running" : "paused",
        }}
      >
        <circle cx="110" cy="110" r="92" fill={`url(#${id}-ruby)`} />
        <circle cx="110" cy="110" r="92" fill="none" stroke="#d4af37" strokeWidth="1.4" />
        {[82, 74, 54, 46].map((r) => (
          <circle key={r} cx="110" cy="110" r={r} fill="none" stroke="#00000066" strokeWidth="1" />
        ))}
        <text fontFamily="var(--font-mono), monospace" fontSize="6.2" fontWeight="500" fill="#f2d27a" letterSpacing="1.6">
          <textPath href={`#${id}-arco`} textLength="388" lengthAdjust="spacingAndGlyphs">
            {surco}
          </textPath>
        </text>

        <circle cx="110" cy="110" r="36" fill={`url(#${id}-oro)`} />
        <circle cx="110" cy="110" r="36" fill="none" stroke="#7a5c15" strokeWidth="1.1" />
        <circle cx="110" cy="110" r="32.5" fill="none" stroke="#7a5c15" strokeWidth="0.6" />
        {/* El nombre va ENCIMA del eje y la marca debajo: el agujero del
            centro no puede caer sobre una letra. */}
        <text
          x="110"
          y={lineas.length > 1 ? 104 - tam * 0.92 : 104}
          textAnchor="middle"
          fontFamily="var(--font-bebas), sans-serif"
          fontSize={tam}
          fill="#5a1206"
        >
          {lineas.map((l, i) => (
            <tspan key={i} x="110" dy={i === 0 ? 0 : tam * 0.92}>
              {l}
            </tspan>
          ))}
        </text>
        <text
          x="110"
          y="125"
          textAnchor="middle"
          fontFamily="var(--font-mono), monospace"
          fontSize="4.6"
          fontWeight="500"
          fill="#5a1206"
          letterSpacing="1.2"
        >
          DISCO RUBY · MG1
        </text>
        <circle cx="110" cy="110" r="2.6" fill="#1c0300" />
      </g>

      {/* El brillo no gira: la luz viene de la sala, no del disco. */}
      <circle cx="110" cy="110" r="92" fill={`url(#${id}-brillo)`} pointerEvents="none" />

      {/* El brazo */}
      <g
        style={{
          transformOrigin: "200px 20px",
          transform: girando ? "rotate(0deg)" : "rotate(-24deg)",
          transition: "transform 0.7s cubic-bezier(.34,1.3,.5,1)",
        }}
      >
        <circle cx="200" cy="20" r="11" fill="#1d1d1d" stroke="#3a3a3a" strokeWidth="1.5" />
        <circle cx="200" cy="20" r="4.5" fill="#d4af37" />
        <path d="M200 20 L190 92 L163 122" fill="none" stroke="#c9c9c9" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="152" y="117" width="16" height="10" rx="1.5" fill="#E8200C" transform="rotate(42 160 122)" />
      </g>
    </svg>
  )
}
