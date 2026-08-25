import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

interface CTASectionProps {
  title: string;
  subtitle?: string;
  ctaText: string;
  ctaTo: string;
  /** Ruta de imagen de fondo (public/images/...). Sin ella cae al fondo claro de siempre. */
  image?: string;
}

export function CTASection({ title, subtitle, ctaText, ctaTo, image }: CTASectionProps) {
  if (image) {
    return (
      <section className="relative overflow-hidden bg-primary text-white">
        <img src={image} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-primary/70" />
        <div className="relative mx-auto max-w-4xl px-4 py-24 text-center sm:px-6">
          <h2 className="text-3xl font-bold sm:text-4xl">{title}</h2>
          {subtitle && <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">{subtitle}</p>}
          <Link to={ctaTo} className="mt-8 inline-block">
            <Button size="lg">{ctaText}</Button>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-light">
      <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
        <h2 className="text-3xl font-bold text-primary sm:text-4xl">{title}</h2>
        {subtitle && (
          <p className="mx-auto mt-4 max-w-2xl text-lg text-brand-gray">{subtitle}</p>
        )}
        <Link to={ctaTo} className="mt-8 inline-block">
          <Button size="lg">{ctaText}</Button>
        </Link>
      </div>
    </section>
  );
}
