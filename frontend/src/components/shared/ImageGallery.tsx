import { useState } from 'react';
import { cld, cldBlur } from '@/lib/cloudinary';
import { Lightbox } from './Lightbox';

interface ImageGalleryProps {
  images: string[];
  alt: string;
}

/** Imagen con blur placeholder (LQIP) que se desvanece al cargar la real. */
function BlurImage({
  src,
  blurSrc,
  alt,
  className,
}: {
  src: string;
  blurSrc: string;
  alt: string;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative h-full w-full overflow-hidden bg-light">
      <img
        src={blurSrc}
        alt=""
        aria-hidden
        className={`absolute inset-0 h-full w-full scale-105 object-cover blur-lg transition-opacity duration-500 ${loaded ? 'opacity-0' : 'opacity-100'}`}
      />
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={`${className ?? ''} relative h-full w-full object-cover transition-[transform,opacity] duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}

export function ImageGallery({ images, alt }: ImageGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  if (images.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((img, i) => (
          <button
            key={img + i}
            onClick={() => setLightboxIndex(i)}
            className="group relative aspect-[4/3] cursor-zoom-in overflow-hidden rounded-xl ring-1 ring-black/5"
            aria-label={`Ampliar imagen ${i + 1}`}
          >
            <BlurImage
              src={cld(img, { width: 800 })}
              blurSrc={cldBlur(img)}
              alt={`${alt} ${i + 1}`}
              className="group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      <Lightbox
        images={images}
        index={lightboxIndex}
        alt={alt}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
      />
    </>
  );
}
