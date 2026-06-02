import { PageHeader } from '@/components/layout/PageHeader';
import { ContactForm } from '@/components/shared/ContactForm';
import { useSectionContent } from '@/hooks/useSiteContent';

export default function ContactPage() {
  const { data } = useSectionContent('contact');

  return (
    <>
      <PageHeader
        title={data?.title ?? 'Contacto'}
        subtitle={
          data?.subtitle ??
          'Déjanos tus datos y un asesor te contactará en menos de 24 horas.'
        }
      />

      <section className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl text-primary">Hablemos</h2>
          <p className="mt-3 text-brand-gray">
            Estamos para ayudarte a encontrar la inversión o el plan de viaje ideal.
          </p>
          <ul className="mt-6 space-y-3 text-primary">
            <li>
              <span className="font-semibold">Email:</span>{' '}
              {data?.email ?? 'info@grupo3i.com'}
            </li>
            <li>
              <span className="font-semibold">Teléfono:</span>{' '}
              {data?.phone ?? '+593 99 999 9999'}
            </li>
            <li>
              <span className="font-semibold">Web:</span> grupo3i.com · club3i.com
            </li>
          </ul>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
          <ContactForm source="landing" />
        </div>
      </section>
    </>
  );
}
