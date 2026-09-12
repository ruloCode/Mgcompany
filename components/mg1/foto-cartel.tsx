import Image from "next/image"
import { cn } from "@/lib/utils"

interface FotoCartelProps {
  src: string
  alt: string
  /** Nombre en Bebas bajo la foto */
  nombre?: string
  /** Línea de apoyo en mono */
  rol?: string
  /** Clase de aspect-ratio; por defecto retrato 4:5 */
  ratio?: string
  /** Clase de object-position: dónde se ancla el recorte (por defecto, al centro) */
  encuadre?: string
  sizes?: string
  /** El titular del cartel: nombre en rojo y más grande */
  destacado?: boolean
  priority?: boolean
  className?: string
}

/**
 * Foto con marco duro y filo rojo abajo, como una pieza de cartel. El degradado
 * la amarra al fondo negro de la página: las fotos vienen de una sesión con luz
 * roja y sin él quedan flotando sobre el negro.
 */
export default function FotoCartel({
  src,
  alt,
  nombre,
  rol,
  ratio = "aspect-[4/5]",
  encuadre,
  sizes = "(max-width: 768px) 100vw, 33vw",
  destacado,
  priority,
  className,
}: FotoCartelProps) {
  return (
    <figure className={cn("group", className)}>
      <div className={cn("relative overflow-hidden bg-white/[0.03]", ratio)}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={cn(
            "object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]",
            encuadre,
          )}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-mg-black/80 via-mg-black/5 to-transparent"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-mg-red md:h-1.5"
        />
      </div>

      {(nombre || rol) && (
        <figcaption className="mt-4">
          {nombre && (
            <p
              className={cn(
                "font-heading uppercase leading-none tracking-tight",
                destacado
                  ? "text-mg-red text-[clamp(2rem,7vw,3.75rem)]"
                  : "text-[clamp(1.35rem,4vw,2.1rem)]",
              )}
            >
              {nombre}
            </p>
          )}
          {rol && (
            <p className="mt-2 font-mono text-[10px] uppercase leading-relaxed tracking-[0.18em] text-zinc-400 md:text-[11px]">
              {rol}
            </p>
          )}
        </figcaption>
      )}
    </figure>
  )
}
