import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

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
 * Rota entre varias imágenes con un desplazamiento horizontal suave (no un
 * simple fundido): la entrante desliza desde la derecha mientras la saliente
 * se va por la izquierda. Con un solo elemento no anima nada. Pensado para el
 * hero: la imagen local por defecto entra primero al instante, y las que
 * configure el admin desde el CMS se suman a la rotación sin reemplazar de
 * golpe lo que ya se está viendo.
 *
 * Solo se mantiene UNA imagen realmente montada a la vez (más la que está
 * saliendo, mientras dura su animación de salida) — la siguiente se precarga
 * en silencio (oculta) justo antes de su turno para que el desplazamiento no
 * haga "pop", pero sin descargar de golpe las N imágenes del hero.
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

  return (
    <>
      <AnimatePresence initial={false}>
        <motion.img
          key={images[index]}
          src={images[index]}
          alt={index === 0 ? alt : ''}
          aria-hidden={index === 0 ? undefined : true}
          className={className}
          loading={index === 0 ? 'eager' : 'lazy'}
          initial={{ x: '8%', opacity: 0 }}
          animate={{ x: '0%', opacity: activeOpacity }}
          exit={{ x: '-8%', opacity: 0 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        />
      </AnimatePresence>

      {/* Precarga silenciosa de la siguiente imagen (nunca de todas a la vez). */}
      {images.length > 1 && (
        <img src={images[nextIndex]} alt="" aria-hidden className="hidden" />
      )}
    </>
  );
}
