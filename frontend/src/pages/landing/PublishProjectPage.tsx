import { useState, type FormEvent } from 'react';
import { PrivacyNote } from '@/components/shared/PrivacyNote';
import { BadgeCheck, Box, HandCoins, Map, Users, BarChart3 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Seo } from '@/components/shared/Seo';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PhoneField } from '@/components/shared/PhoneField';
import { Link, useLang } from '@/hooks/useLang';
import { api } from '@/lib/api';
import { PROPERTY_TYPES } from '@/lib/propertyTypes';
import { ServicesGrid } from '@/components/shared/ServicesGrid';

// «Publica tu proyecto»: vitrina de proyectos seleccionados y verificados de desarrolladoras externas. El
// formulario crea un desarrollador en estado «En alta» (admin → Desarrolladores).

const BENEFITS = [
  { icon: HandCoins, title: 'Ganamos cuando tú vendes', body: 'Una comisión sobre las ventas, que pagas a medida que tu cliente te paga. Las condiciones se acuerdan en privado, según tu proyecto y los servicios que necesites.' },
  { icon: Users, title: 'Una red que vende por ti', body: 'Los socios de Refiere y gana recomiendan tu proyecto a sus contactos, en español e inglés, y ganan solo si vendes.' },
  { icon: Map, title: 'Inventario en vivo', body: 'Cada unidad con su precio, medidas y disponibilidad al día. En lotizaciones y proyectos de casas, el cliente elige la suya en un mapa interactivo desde el celular.' },
  { icon: Box, title: 'Recorridos 360°', body: 'Lotizaciones, terrenos independientes, suites y departamentos: el cliente los recorre antes de visitarlos.' },
  { icon: BadgeCheck, title: 'Sello «Verificado por Grupo 3i»', body: 'Revisamos escrituras, gravámenes y aprobaciones. Es lo que más pesa en la decisión de quien compra una propiedad en la costa.' },
  { icon: BarChart3, title: 'Tu portal y tus métricas', body: 'Contactos, ventas, pagos y el embudo de tu proyecto en un solo lugar.' },
];

const COMPARE: [string, string, string][] = [
  ['Cómo pagas', 'Por anuncio, vendas o no', 'Comisión por venta; servicios a convenir'],
  ['Quién lo promociona', 'Solo el buscador del portal', 'Nuestra web y una red de referidores'],
  ['Inventario', 'Un anuncio por propiedad', 'Todo el proyecto con disponibilidad en vivo'],
  ['Confianza', 'Nadie revisa los papeles', 'Sello de verificación legal'],
  ['Compradores extranjeros', 'Poco o nada en inglés', 'Todo en español e inglés'],
];

export default function PublishProjectPage() {
  const { t, lang } = useLang();
  const [phone, setPhone] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await api.post('/developer/apply', { ...Object.fromEntries(fd.entries()), types: fd.getAll('types').join(', '), whatsapp: phone, lang });
      setSent(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Seo
        title={t('Publica tu proyecto inmobiliario')}
        description={t('Vende tus proyectos inmobiliarios con la red de Grupo 3i: lotes, terrenos, casas, departamentos, suites, locales y oficinas. Ganamos cuando tú vendes.')}
      />
      <PageHeader
        title={t('Publica tu proyecto')}
        subtitle={t('Vende tus proyectos inmobiliarios con la red de Grupo 3i. Ganamos cuando tú vendes.')}
        image="/images/secciones/header-nosotros.jpg"
      />

      <div className="mx-auto mt-8 flex max-w-6xl flex-wrap justify-center gap-3 px-4">
        <Link to="/publica-tu-proyecto/propuesta" className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-black">
          {t('Ver la propuesta comercial')}
        </Link>
        <Link to="/publica-tu-proyecto/manual" className="rounded-lg border border-black/15 px-6 py-3 text-sm font-semibold text-primary hover:bg-light">
          {t('Manual de herramientas')}
        </Link>
        <Link to="/publica-tu-proyecto/galeria" className="rounded-lg border border-black/15 px-6 py-3 text-sm font-semibold text-primary hover:bg-light">
          {t('Galería del sistema')}
        </Link>
        <a href="#solicitud" className="rounded-lg border border-secondary px-6 py-3 text-sm font-semibold text-primary hover:bg-secondary">
          {t('Solicitar el alta')}
        </a>
      </div>

      <section className="mx-auto max-w-6xl px-4 pt-12 sm:px-6">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-brand-gray">{t('Publicamos proyectos de')}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {PROPERTY_TYPES.map((p) => (
            <span key={p.id} className="rounded-full bg-white px-4 py-1.5 text-sm font-medium text-primary shadow-sm ring-1 ring-black/5">{t(p.label)}</span>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
              <Icon className="h-7 w-7 text-secondary" strokeWidth={1.6} />
              <h3 className="mt-4 font-serif text-lg font-bold text-primary">{t(title)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-gray">{t(body)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{t('Servicios integrales')}</p>
        <h2 className="mt-2 font-serif text-3xl font-bold text-primary">{t('Mucho más que publicar: te acompañamos de principio a fin')}</h2>
        <p className="mt-2 max-w-3xl text-brand-gray">{t('Topografía, planos, fraccionamientos, trámites, marketing y desarrollo de proyectos, con el seguimiento de cada trámite en línea. Cada servicio se cotiza en privado.')}</p>
        <div className="mt-8">
          <ServicesGrid lang={lang} compact />
        </div>
        <Link to="/servicios" className="mt-6 inline-block font-semibold text-accent underline-offset-4 hover:underline">{t('Ver todos los servicios')} →</Link>
      </section>

      <section className="bg-light">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <h2 className="text-center font-serif text-3xl font-bold text-primary">{t('Portal de anuncios vs. Grupo 3i')}</h2>
          <div className="mt-8 overflow-x-auto rounded-2xl bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-black/5 text-xs uppercase tracking-wide text-brand-gray">
                <tr>
                  <th className="px-4 py-3" />
                  <th className="px-4 py-3">{t('Portal de anuncios')}</th>
                  <th className="px-4 py-3 text-primary">Grupo 3i</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map(([k, a, b]) => (
                  <tr key={k} className="border-b border-black/5 last:border-0">
                    <td className="px-4 py-3 font-medium text-primary">{t(k)}</td>
                    <td className="px-4 py-3 text-brand-gray">{t(a)}</td>
                    <td className="px-4 py-3 font-medium text-primary">✓ {t(b)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-8 rounded-2xl bg-white p-5 text-center text-sm text-brand-gray shadow-sm">
            {t('Las condiciones económicas se acuerdan en privado y dependen del tipo de proyecto y de los servicios que necesites.')}
          </p>
        </div>
      </section>

      <section id="solicitud" className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <h2 className="text-center font-serif text-3xl font-bold text-primary">{t('Solicita el alta de tu proyecto')}</h2>
        <p className="mt-2 text-center text-brand-gray">{t('Te escribimos por WhatsApp en menos de 24 horas.')}</p>
        {sent ? (
          <div className="mt-8 rounded-2xl bg-green-50 p-6 text-center text-green-800">
            {t('¡Gracias! Recibimos tu solicitud y te contactaremos pronto.')}
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 grid gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:grid-cols-2">
            <Input name="company" label={t('Empresa o desarrollador *')} required />
            <Input name="name" label={t('Tu nombre *')} required />
            <PhoneField label="WhatsApp *" required defaultValue={lang === 'en' ? '+1 ' : '+593 '} onChange={setPhone} />
            <Input name="email" type="email" label={t('Correo')} />
            <Input name="project" label={t('Nombre del proyecto')} />
            <Input name="location" label={t('Ubicación')} />
            <Input name="units" label={t('Número de unidades')} />
            <fieldset className="sm:col-span-2">
              <legend className="mb-2 text-sm font-medium text-primary">{t('Tipo de proyecto')}</legend>
              <div className="flex flex-wrap gap-2">
                {PROPERTY_TYPES.map((p) => (
                  <label key={p.id} className="flex cursor-pointer items-center gap-2 rounded-full border border-black/10 px-3 py-1.5 text-sm text-primary has-[:checked]:border-secondary has-[:checked]:bg-secondary/15">
                    <input type="checkbox" name="types" value={p.label} className="accent-secondary" />
                    {t(p.label)}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="hidden" aria-hidden>
              <input name="website" tabIndex={-1} autoComplete="off" />
            </div>
            <div className="sm:col-span-2">
              <Textarea name="message" rows={3} label={t('Cuéntanos de tu proyecto')} />
            </div>
            {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
            <Button type="submit" size="lg" disabled={busy} className="sm:col-span-2">
              {busy ? t('Enviando…') : t('Enviar solicitud')}
            </Button>
            <PrivacyNote className="sm:col-span-2" />
          </form>
        )}
      </section>
    </>
  );
}
