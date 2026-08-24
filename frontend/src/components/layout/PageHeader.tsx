import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  /** Ruta de imagen de fondo (public/images/...). Sin ella cae al fondo sólido de siempre. */
  image?: string;
}

export function PageHeader({ title, subtitle, children, image }: PageHeaderProps) {
  return (
    <section className="relative isolate overflow-hidden bg-primary text-white">
      {image && (
        <>
          <img
            src={image}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 -z-10 h-full w-full object-cover"
          />
          <div className="absolute inset-0 -z-10 bg-primary/55" />
        </>
      )}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <h1 className="text-4xl font-bold sm:text-5xl">{title}</h1>
        {subtitle && (
          <p className="mt-4 max-w-2xl text-lg text-white/70">{subtitle}</p>
        )}
        {children}
      </div>
    </section>
  );
}
