import { useEffect, useState } from 'react';

interface ImageCrossfadeProps {
  /** URLs a rotar. La primera se ve de inmediato (sin esperar red/CMS). */
  images: string[];
  alt?: string;
  className?: string;
  /** Opacidad de la imagen activa (para blendear con un scrim/overlay). */
  activeOpacity?: number;
  /** ms entre cada cambio. */
  interval?: number;
}

/**
 * Rota entre varias imágenes con crossfade suave. Con un solo elemento no
 * anima nada (evita trabajo/parpadeo innecesario). Pensado para el hero: la
 * imagen local por defecto entra primero al instante, y si el admin configuró
 * una o más desde el CMS se suman a la rotación sin reemplazar de golpe lo que
 * ya se está viendo — así no hay el salto brusco de "carga una y a los 500ms
 * cambia por otra".
 */
export function ImageCrossfade({
  images,
  alt = '',
  className,
  activeOpacity = 1,
  interval = 7000,
}: ImageCrossfadeProps) {
  const [index, setIndex] = useState(0);

  // Si la lista de imágenes cambia (p.ej. llega la del CMS) y el índice activo
  // quedó fuera de rango, no reiniciar la rotación de golpe.
  useEffect(() => {
    if (index >= images.length) setIndex(0);
  }, [images.length, index]);

  useEffect(() => {
    if (images.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, interval);
    return () => clearInterval(id);
  }, [images.length, interval]);

  const nextIndex = images.length > 1 ? (index + 1) % images.length : index;

  // Solo se montan la imagen activa y la siguiente (para que el fade no
  // parpadee al llegarle el turno) — NUNCA las N de golpe. Con 6-7 fotos de
  // hero eso son varios MB descargándose desde el primer render aunque el
  // usuario solo vea una; así el resto se pide justo antes de necesitarse.
  const toRender =
    images.length <= 2
      ? images.map((src, i) => ({ src, i }))
      : Array.from(new Set([index, nextIndex])).map((i) => ({ src: images[i], i }));

  return (
    <>
      {toRender.map(({ src, i }) => (
        <img
          key={src}
          src={src}
          alt={i === 0 ? alt : ''}
          aria-hidden={i === 0 ? undefined : true}
          className={className}
          loading={i === 0 ? 'eager' : 'lazy'}
          style={{
            opacity: i === index ? activeOpacity : 0,
            transition: 'opacity 1.8s ease-in-out',
          }}
        />
      ))}
    </>
  );
}
