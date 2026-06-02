import { useState } from 'react';
import { cloudinaryOptimize, cn } from '@/lib/utils';

interface ImageGalleryProps {
  images: string[];
  alt: string;
}

export function ImageGallery({ images, alt }: ImageGalleryProps) {
  const [active, setActive] = useState(0);
  if (images.length === 0) return null;

  return (
    <div>
      <div className="overflow-hidden rounded-2xl bg-light">
        <img
          src={cloudinaryOptimize(images[active])}
          alt={`${alt} ${active + 1}`}
          className="h-[24rem] w-full object-cover sm:h-[30rem]"
          loading="lazy"
        />
      </div>

      {images.length > 1 && (
        <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img + i}
              onClick={() => setActive(i)}
              className={cn(
                'h-20 w-28 flex-none cursor-pointer overflow-hidden rounded-lg ring-2 transition',
                i === active ? 'ring-secondary' : 'ring-transparent opacity-70 hover:opacity-100',
              )}
            >
              <img
                src={cloudinaryOptimize(img)}
                alt={`${alt} miniatura ${i + 1}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
