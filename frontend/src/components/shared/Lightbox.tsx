import { useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cld } from '@/lib/cloudinary';

interface LightboxProps {
  images: string[];
  index: number | null;
  alt: string;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function Lightbox({
  images,
  index,
  alt,
  onClose,
  onNavigate,
}: LightboxProps) {
  const open = index !== null;

  const prev = useCallback(() => {
    if (index === null) return;
    onNavigate((index - 1 + images.length) % images.length);
  }, [index, images.length, onNavigate]);

  const next = useCallback(() => {
    if (index === null) return;
    onNavigate((index + 1) % images.length);
  }, [index, images.length, onNavigate]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose, prev, next]);

  return (
    <AnimatePresence>
      {open && index !== null && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <button
            aria-label="Cerrar"
            onClick={onClose}
            className="absolute right-5 top-5 cursor-pointer text-3xl leading-none text-white/80 hover:text-white"
          >
            &times;
          </button>

          {images.length > 1 && (
            <button
              aria-label="Anterior"
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              className="absolute left-4 cursor-pointer rounded-full bg-white/10 px-4 py-3 text-2xl text-white hover:bg-white/20 sm:left-8"
            >
              ‹
            </button>
          )}

          <motion.img
            key={index}
            src={cld(images[index], { width: 1600, crop: 'limit' })}
            alt={`${alt} ${index + 1}`}
            className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
          />

          {images.length > 1 && (
            <button
              aria-label="Siguiente"
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              className="absolute right-4 cursor-pointer rounded-full bg-white/10 px-4 py-3 text-2xl text-white hover:bg-white/20 sm:right-8"
            >
              ›
            </button>
          )}

          <span className="absolute bottom-6 text-sm text-white/70">
            {index + 1} / {images.length}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
