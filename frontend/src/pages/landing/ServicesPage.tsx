import { useState, type FormEvent } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Seo } from '@/components/shared/Seo';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PhoneField } from '@/components/shared/PhoneField';
import { PrivacyNote } from '@/components/shared/PrivacyNote';
import { ServicesGrid } from '@/components/shared/ServicesGrid';
import { useLang } from '@/hooks/useLang';
import { api } from '@/lib/api';
import { adEvent, attribution } from '@/lib/ads';
import { SERVICE_AREAS, SERVICES_STEPS, type ServiceId } from '@/lib/services';

// /servicios — servicios integrales (territorio, trámites, comercialización, marketing y
// desarrollo de proyectos). Los valores se acuerdan en privado: el formulario pide una propuesta.

const TX = {
  es: {
    seo: 'Servicios integrales inmobiliarios',
    seoDesc: 'Topografía, levantamientos georreferenciados, planos, fraccionamientos, trámites notariales y municipales, marketing, audiovisual y desarrollo de proyectos en la costa de Ecuador.',
    title: 'Servicios integrales',
    sub: 'Del levantamiento del terreno a la venta de la última unidad: un solo equipo para todo tu proyecto.',
    areasKicker: 'Lo que hacemos',
    areasTitle: 'Todo lo que tu proyecto necesita, en un solo lugar',
    howKicker: 'Cómo trabajamos',
    howTitle: 'Sabes en qué va cada trámite',
    priceNote: 'Los valores se acuerdan en privado y dependen del tipo de proyecto y de los servicios que necesites.',
    formTitle: 'Solicita una propuesta',
    formSub: 'Elige los servicios que te interesan. Te escribimos por WhatsApp en menos de 24 horas.',
    services: 'Servicios que necesitas *',
    name: 'Tu nombre *',
    company: 'Empresa (opcional)',
    email: 'Correo',
    location: 'Ubicación del terreno o proyecto',
    message: 'Cuéntanos de tu proyecto',
    send: 'Enviar solicitud',
    sending: 'Enviando…',
    pick: 'Elige al menos un servicio.',
    thanks: '¡Gracias! Recibimos tu solicitud y te escribiremos pronto por WhatsApp.',
  },
  en: {
    seo: 'Full-service real estate support',
    seoDesc: 'Surveying, geo-referenced mapping, site plans, subdivisions, notary and municipal paperwork, marketing, video and project development on Ecuador’s coast.',
    title: 'Full-service support',
    sub: 'From surveying the land to selling the last unit: one team for your whole project.',
    areasKicker: 'What we do',
    areasTitle: 'Everything your project needs, under one roof',
    howKicker: 'How we work',
    howTitle: 'You always know where things stand',
    priceNote: 'Pricing is agreed in private and depends on the type of project and the services you need.',
    formTitle: 'Request a proposal',
    formSub: 'Pick the services you’re interested in. We’ll message you on WhatsApp within 24 hours.',
    services: 'Services you need *',
    name: 'Your name *',
    company: 'Company (optional)',
    email: 'Email',
    location: 'Where’s the land or project?',
    message: 'Tell us about your project',
    send: 'Send request',
    sending: 'Sending…',
    pick: 'Pick at least one service.',
    thanks: 'Thanks! We got your request and will message you on WhatsApp soon.',
  },
};

export default function ServicesPage() {
  const { lang } = useLang();
  const tx = TX[lang];
  const [picked, setPicked] = useState<ServiceId[]>([]);
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const toggle = (id: ServiceId) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    if (!picked.length) {
      setError(tx.pick);
      return;
    }
    const fd = Object.fromEntries(new FormData(e.currentTarget).entries());
    setBusy(true);
    try {
      await api.post('/services/request', { ...fd, phone, services: picked, lang, utm: attribution() });
      adEvent('lead', { project: 'servicios' });
      setSent(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Seo title={tx.seo} description={tx.seoDesc} />
      <PageHeader title={tx.title} subtitle={tx.sub} image="/images/secciones/hero-home.jpg" />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{tx.areasKicker}</p>
        <h2 className="mt-2 font-serif text-3xl font-bold text-primary sm:text-4xl">{tx.areasTitle}</h2>
        <div className="mt-8">
          <ServicesGrid lang={lang} />
        </div>
      </section>

      <section className="bg-light">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{tx.howKicker}</p>
          <h2 className="mt-2 font-serif text-3xl font-bold text-primary">{tx.howTitle}</h2>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES_STEPS.map(([t, d], i) => (
              <li key={i} className="rounded-2xl bg-white p-5 shadow-sm">
                <span className="font-serif text-3xl font-bold text-secondary">{i + 1}</span>
                <p className="mt-2 font-semibold text-primary">{t[lang]}</p>
                <p className="mt-1 text-sm text-brand-gray">{d[lang]}</p>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-sm text-brand-gray">{tx.priceNote}</p>
        </div>
      </section>

      <section id="solicitud" className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h2 className="text-center font-serif text-3xl font-bold text-primary">{tx.formTitle}</h2>
        <p className="mt-2 text-center text-brand-gray">{tx.formSub}</p>
        {sent ? (
          <div className="mt-8 rounded-2xl bg-green-50 p-6 text-center text-green-800">{tx.thanks}</div>
        ) : (
          <form onSubmit={submit} className="mt-8 grid gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:grid-cols-2">
            <fieldset className="sm:col-span-2">
              <legend className="mb-2 text-sm font-medium text-primary">{tx.services}</legend>
              <div className="space-y-3">
                {SERVICE_AREAS.map((a) => (
                  <div key={a.id}>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-brand-gray">{a.title[lang]}</p>
                    <div className="flex flex-wrap gap-2">
                      {a.items.map((s) => (
                        <label
                          key={s.id}
                          className="flex cursor-pointer items-center gap-2 rounded-full border border-black/10 px-3 py-1.5 text-sm text-primary has-[:checked]:border-secondary has-[:checked]:bg-secondary/15"
                        >
                          <input type="checkbox" checked={picked.includes(s.id)} onChange={() => toggle(s.id)} className="accent-secondary" />
                          {s.name[lang]}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </fieldset>
            <Input name="name" label={tx.name} required />
            <PhoneField label="WhatsApp *" required defaultValue={lang === 'en' ? '+1 ' : '+593 '} onChange={setPhone} />
            <Input name="company" label={tx.company} />
            <Input name="email" type="email" label={tx.email} />
            <div className="sm:col-span-2">
              <Input name="location" label={tx.location} />
            </div>
            <div className="hidden" aria-hidden>
              <input name="website" tabIndex={-1} autoComplete="off" />
            </div>
            <div className="sm:col-span-2">
              <Textarea name="message" rows={3} label={tx.message} />
            </div>
            {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
            <Button type="submit" size="lg" disabled={busy} className="sm:col-span-2">
              {busy ? tx.sending : tx.send}
            </Button>
            <PrivacyNote className="sm:col-span-2" />
          </form>
        )}
      </section>
    </>
  );
}
