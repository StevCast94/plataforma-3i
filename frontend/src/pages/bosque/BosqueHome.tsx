import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Apple, Droplets, Leaf, MapPin, Sprout, TreeDeciduous, Trees } from 'lucide-react';
import {
  BOSQUE_NAME,
  BOSQUE_TAGLINE,
  bosqueGet,
  CATEGORY_LABEL,
  fechaLarga,
  money,
  type BosqueStats,
  type MapTree,
  type SpeciesCategory,
  type TreeSpecies,
  type TreeUpdateItem,
} from '@/lib/bosque';
import { cld } from '@/lib/cloudinary';
import { BosqueMap } from './BosqueMap';
import { AdoptModal } from './AdoptModal';

const HERO = 'https://res.cloudinary.com/db3t73yas/image/upload/v1787623457/grupo3i/szzat1etcxe280jdtabj.jpg';

const CAT_ICON: Record<SpeciesCategory, typeof Leaf> = {
  NATIVE: Leaf,
  FRUIT: Apple,
  MONUMENTAL: Trees,
};

const STEPS = [
  { icon: Sprout, title: 'Elige tu árbol', body: 'Nativos del bosque seco, frutales o un árbol monumental con placa.' },
  { icon: MapPin, title: 'Lo sembramos con tu nombre', body: 'Tu árbol recibe un código, una ubicación GPS y un certificado con QR.' },
  { icon: Droplets, title: 'Lo cuidamos 3 años', body: 'Riego desde el río, reposición si no prospera y fotos para que lo veas crecer.' },
  { icon: TreeDeciduous, title: 'Nunca se tala', body: 'Es un bosque de conservación permanente. Puedes visitarlo cuando quieras.' },
];

const FAQ = [
  {
    q: '¿Dónde está el bosque?',
    a: 'En Manglaralto, Santa Elena, a 5 minutos de Montañita. Son 16 hectáreas junto a un río, colindantes con la lotización Montañita View. La primera etapa siembra 2 hectáreas.',
  },
  {
    q: '¿Cuándo se siembra mi árbol?',
    a: 'Sembramos con las lluvias, de enero a abril, cuando el árbol tiene más probabilidad de prosperar. Si adoptas antes, tu árbol crece en nuestro vivero y se asigna al sembrarse.',
  },
  {
    q: '¿Qué recibo?',
    a: 'Un certificado con código QR, la ubicación de tu árbol en el mapa, su página propia con fotos y novedades, y la posibilidad de visitarlo.',
  },
  {
    q: '¿Qué pasa si el árbol no prospera?',
    a: 'Lo reponemos sin costo durante los 3 años de cuidado incluidos.',
  },
  {
    q: '¿Puedo regalar un árbol?',
    a: 'Sí. Al adoptar marca que es un regalo y escribe el nombre que irá en el certificado.',
  },
  {
    q: 'Compré un solar en Montañita View, ¿tengo árbol?',
    a: 'Sí: cada solar incluye un árbol a nombre de su propietario. Si quieres sumar más, puedes adoptarlos aquí.',
  },
];

export default function BosqueHome() {
  const [species, setSpecies] = useState<TreeSpecies[]>([]);
  const [stats, setStats] = useState<BosqueStats | null>(null);
  const [trees, setTrees] = useState<MapTree[]>([]);
  const [updates, setUpdates] = useState<TreeUpdateItem[]>([]);
  const [adopt, setAdopt] = useState<TreeSpecies | null | undefined>(undefined);

  useEffect(() => {
    bosqueGet<TreeSpecies[]>('/species').then(setSpecies).catch(() => {});
    bosqueGet<BosqueStats>('/stats').then(setStats).catch(() => {});
    bosqueGet<MapTree[]>('/trees').then(setTrees).catch(() => {});
    bosqueGet<TreeUpdateItem[]>('/updates').then(setUpdates).catch(() => {});
  }, []);

  const committed = stats ? Math.max(stats.committed, stats.adopted) : 0;
  const goal = stats?.goalPilot ?? 520;
  const pct = Math.min(100, Math.round((committed / goal) * 100));

  return (
    <>
      <Helmet>
        <title>{`${BOSQUE_NAME} · Adopta un árbol`}</title>
        <meta
          name="description"
          content="Adopta un árbol nativo o frutal en un bosque de conservación en Manglaralto, Santa Elena. Certificado con QR, ubicación GPS y fotos de tu árbol."
        />
        <meta property="og:title" content={`${BOSQUE_NAME} · Adopta un árbol`} />
        <meta property="og:image" content={cld(HERO, { width: 1200 })} />
      </Helmet>

      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-bosque-dark text-white">
        <img src={cld(HERO, { width: 1800 })} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-45" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-bosque-dark via-bosque-dark/70 to-transparent" />
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:py-32">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-guayacan">{BOSQUE_TAGLINE}</p>
          <h1 className="mt-4 max-w-2xl font-bosque text-5xl font-semibold leading-[1.02] sm:text-7xl">
            Siembra un árbol que nunca se va a talar.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-white/85">
            Guayacanes, ceibos, palo santo y frutales en 16 hectáreas junto a un río en Manglaralto. Tu árbol lleva tu
            nombre, tiene su lugar en el mapa y lo cuidamos por ti.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <button
              onClick={() => setAdopt(null)}
              className="rounded-full bg-guayacan px-7 py-3.5 text-sm font-semibold text-bosque-dark transition hover:brightness-110"
            >
              Adopta un árbol desde {money(Math.min(...(species.length ? species.map((s) => s.price) : [25])))}
            </button>
            <a href="#como-funciona" className="rounded-full border border-white/40 px-7 py-3.5 text-sm font-semibold transition hover:bg-white hover:text-bosque-dark">
              Cómo funciona
            </a>
          </div>
        </div>
      </section>

      {/* META DEL PILOTO */}
      <section className="border-b border-bosque/10 bg-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:grid-cols-[1fr_auto] sm:items-center sm:px-6">
          <div>
            <p className="text-sm font-medium">
              Primera etapa: <strong>{goal} árboles</strong> en 2 hectáreas · siembra enero a abril de 2027
            </p>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-savia" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-guayacan transition-all" style={{ width: `${Math.max(pct, 1.5)}%` }} />
            </div>
          </div>
          <p className="font-bosque text-3xl font-semibold text-bosque tabular-nums">
            {committed}
            <span className="text-base font-normal text-bosque-dark/60"> / {goal} adoptados</span>
          </p>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section id="como-funciona" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
        <h2 className="max-w-xl font-bosque text-4xl font-semibold text-bosque">Así funciona tu adopción</h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.title}>
              <s.icon className="h-8 w-8 text-guayacan" strokeWidth={1.6} />
              <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-bosque-dark/75">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ESPECIES */}
      <section id="especies" className="scroll-mt-20 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="font-bosque text-4xl font-semibold text-bosque">Elige tu especie</h2>
          <p className="mt-3 max-w-2xl text-bosque-dark/75">
            Especies adaptadas al bosque seco de la costa. Los frutales abastecen al restaurante de Montañita View Lobby y a
            la comunidad.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {species.map((s) => {
              const Icon = CAT_ICON[s.category];
              return (
                <article key={s.id} className="flex flex-col overflow-hidden rounded-2xl border border-bosque/10 bg-savia">
                  {s.image ? (
                    <img src={cld(s.image, { width: 600, height: 400, crop: 'fill' })} alt={s.name} className="aspect-[3/2] w-full object-cover" />
                  ) : (
                    <div className="flex aspect-[3/2] items-center justify-center bg-bosque/90">
                      <Icon className="h-14 w-14 text-guayacan" strokeWidth={1.2} />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-bosque/70">{CATEGORY_LABEL[s.category]}</p>
                    <h3 className="mt-1 font-bosque text-xl font-semibold">{s.name}</h3>
                    {s.scientificName && <p className="text-xs italic text-bosque-dark/60">{s.scientificName}</p>}
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-bosque-dark/80">{s.description}</p>
                    <div className="mt-5 flex items-center justify-between">
                      <span className="font-bosque text-2xl font-semibold text-bosque">{money(s.price)}</span>
                      <button
                        onClick={() => setAdopt(s)}
                        className="rounded-full bg-bosque px-4 py-2 text-sm font-semibold text-white transition hover:bg-bosque-dark"
                      >
                        Adoptar
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* MAPA */}
      <section id="mapa" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
        <h2 className="font-bosque text-4xl font-semibold text-bosque">El bosque, árbol por árbol</h2>
        {trees.length > 0 ? (
          <>
            <p className="mt-3 text-bosque-dark/75">
              Cada punto es un árbol. <span className="font-semibold text-[#b07e0c]">Amarillo</span>: ya tiene padrino.{' '}
              <span className="font-semibold text-bosque">Verde</span>: espera el suyo.
            </p>
            <BosqueMap trees={trees} className="mt-8 h-[460px]" />
          </>
        ) : (
          <div className="mt-8 grid gap-6 rounded-2xl bg-bosque p-8 text-white sm:grid-cols-[auto_1fr] sm:items-center">
            <MapPin className="h-10 w-10 text-guayacan" strokeWidth={1.5} />
            <p className="max-w-2xl leading-relaxed text-white/85">
              El plano de siembra se publica al iniciar la siembra, en enero de 2027. Desde ese momento cada árbol aparece
              aquí con su código y su padrino, y tú puedes ubicar el tuyo.
            </p>
          </div>
        )}
      </section>

      {/* VÍNCULO MONTAÑITA VIEW */}
      <section className="bg-bosque-dark text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-guayacan">Junto a Montañita View</p>
            <h2 className="mt-3 font-bosque text-4xl font-semibold">Un bosque vivo al lado de tu solar</h2>
          </div>
          <ul className="space-y-4 text-white/85">
            <li>Cada solar vendido en Montañita View incluye un árbol a nombre de su propietario.</li>
            <li>Los senderos del bosque son parte de la experiencia de propietarios, huéspedes y socios del Club 3i.</li>
            <li>La cosecha de los frutales llega al restaurante de Montañita View Lobby.</li>
            <li>
              <a href="https://grupo3i.com/proyectos/montanita-view" className="font-semibold text-guayacan underline underline-offset-4">
                Conoce Montañita View
              </a>
            </li>
          </ul>
        </div>
      </section>

      {/* NOVEDADES */}
      {updates.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="font-bosque text-4xl font-semibold text-bosque">Desde el bosque</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {updates.map((u) => (
              <article key={u.id} className="overflow-hidden rounded-2xl bg-white">
                {u.photos[0] && <img src={cld(u.photos[0], { width: 600 })} alt="" className="aspect-[4/3] w-full object-cover" />}
                <div className="p-5">
                  <p className="text-xs text-bosque-dark/60">{fechaLarga(u.createdAt)}</p>
                  <h3 className="mt-1 font-semibold">{u.title}</h3>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-bosque-dark/80">{u.body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
          <h2 className="font-bosque text-4xl font-semibold text-bosque">Preguntas frecuentes</h2>
          <div className="mt-8 divide-y divide-bosque/10">
            {FAQ.map((f) => (
              <details key={f.q} className="group py-4">
                <summary className="cursor-pointer list-none font-semibold marker:hidden">
                  <span className="mr-2 inline-block text-guayacan transition group-open:rotate-45">+</span>
                  {f.q}
                </summary>
                <p className="mt-2 pl-5 text-sm leading-relaxed text-bosque-dark/80">{f.a}</p>
              </details>
            ))}
          </div>
          <div className="mt-12 rounded-2xl bg-savia p-6 text-center">
            <p className="font-bosque text-2xl font-semibold text-bosque">¿Listo para sembrar?</p>
            <button
              onClick={() => setAdopt(null)}
              className="mt-4 rounded-full bg-bosque px-7 py-3 text-sm font-semibold text-white transition hover:bg-bosque-dark"
            >
              Adopta un árbol
            </button>
          </div>
        </div>
      </section>

      {adopt !== undefined && species.length > 0 && (
        <AdoptModal species={species} initial={adopt} onClose={() => setAdopt(undefined)} />
      )}
    </>
  );
}
