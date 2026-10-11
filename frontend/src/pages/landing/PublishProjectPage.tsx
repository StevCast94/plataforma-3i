import { useState, type FormEvent } from 'react';
import { BadgeCheck, Box, HandCoins, Map, Users, BarChart3 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Seo } from '@/components/shared/Seo';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PhoneField } from '@/components/shared/PhoneField';
import { useLang } from '@/hooks/useLang';
import { api } from '@/lib/api';
import { Link } from 'react-router-dom';

// «Publica tu proyecto»: vitrina curada para desarrolladores externos. El
// formulario crea un desarrollador en estado «En alta» (admin → Desarrolladores).

const BENEFITS = [
  { icon: HandCoins, title: 'Pagas solo cuando vendes', body: '8 % sobre ventas que llegan por la plataforma, cobrado a medida que tú cobras. Sin mensualidades ni planes por aviso.' },
  { icon: Users, title: 'Una red que vende por ti', body: 'Los socios de Refiere y gana comparten tu proyecto con su gente, en español e inglés, y ganan solo si vendes.' },
  { icon: Map, title: 'Mapa interactivo de lotes', body: 'Cada lote con su precio, medidas y disponibilidad en vivo. El cliente elige su lote desde el celular.' },
  { icon: Box, title: 'Recorridos 360°', body: 'Tus panorámicas ubicadas sobre el mapa: el cliente camina el terreno antes de visitarlo.' },
  { icon: BadgeCheck, title: 'Sello «Verificado por Grupo 3i»', body: 'Revisamos escrituras, gravámenes y aprobaciones. La confianza que más pesa al comprar tierra en la costa.' },
  { icon: BarChart3, title: 'Tu portal y tus métricas', body: 'Contactos, ventas, pagos y el embudo de tu proyecto en un solo lugar.' },
];

const COMPARE: [string, string, string][] = [
  ['Cómo pagas', 'Por aviso, vendas o no', 'Solo por venta concretada'],
  ['Quién promociona', 'Solo el buscador del portal', 'Portal + red de referidores'],
  ['Lotes', 'Un aviso por inmueble', 'Mapa interactivo con disponibilidad en vivo'],
  ['Confianza', 'Sin revisión legal', 'Sello de verificación legal'],
  ['Público extranjero', 'Limitado', 'Todo en español e inglés'],
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
      await api.post('/developer/apply', { ...Object.fromEntries(fd.entries()), whatsapp: phone, lang });
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
        description={t('Vende tus lotes con la red de Grupo 3i: mapa interactivo, recorridos 360°, verificación legal y pago solo por venta.')}
      />
      <PageHeader
        title={t('Publica tu proyecto')}
        subtitle={t('Vende tus lotes con la red de Grupo 3i. Pagas solo cuando vendes.')}
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

      <section className="bg-light">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <h2 className="text-center font-serif text-3xl font-bold text-primary">{t('Portal de clasificados vs. Grupo 3i')}</h2>
          <div className="mt-8 overflow-x-auto rounded-2xl bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-black/5 text-xs uppercase tracking-wide text-brand-gray">
                <tr>
                  <th className="px-4 py-3" />
                  <th className="px-4 py-3">{t('Portal de clasificados')}</th>
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
          <div className="mt-8 grid gap-4 text-center sm:grid-cols-3">
            {[
              ['8 %', 'por venta de la plataforma'],
              ['2 %', 'por venta a tus propios contactos, usando nuestras herramientas'],
              ['$300', 'alta única por proyecto'],
            ].map(([n, l]) => (
              <div key={n} className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="font-serif text-3xl font-bold text-primary">{n}</p>
                <p className="mt-1 text-sm text-brand-gray">{t(l)}</p>
              </div>
            ))}
          </div>
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
            <Input name="units" label={t('Número de lotes o unidades')} />
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
          </form>
        )}
      </section>
    </>
  );
}
