import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

interface CTASectionProps {
  title: string;
  subtitle?: string;
  ctaText: string;
  ctaTo: string;
}

export function CTASection({ title, subtitle, ctaText, ctaTo }: CTASectionProps) {
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
