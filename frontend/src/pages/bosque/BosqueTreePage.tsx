import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { CalendarDays, MapPin, TreeDeciduous } from 'lucide-react';
import { BOSQUE_NAME, bosqueGet, bosquePath, CATEGORY_LABEL, fechaLarga, type MapTree, type PublicTree } from '@/lib/bosque';
import { cld } from '@/lib/cloudinary';
import { BosqueMap } from './BosqueMap';

/** Página pública de un árbol: a donde lleva el QR del certificado. */
export default function BosqueTreePage() {
  const { code = '' } = useParams();
  const [tree, setTree] = useState<PublicTree | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    bosqueGet<PublicTree>(`/tree/${encodeURIComponent(code)}`)
      .then(setTree)
      .catch((e: Error) => setError(e.message));
  }, [code]);

  if (error)
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <p className="font-bosque text-3xl font-semibold text-bosque">No encontramos ese árbol</p>
        <p className="mt-3 text-bosque-dark/70">Revisa el código {code.toUpperCase()} en tu certificado.</p>
        <Link to={bosquePath()} className="mt-6 inline-block font-semibold text-bosque underline">
          Volver al bosque
        </Link>
      </div>
    );
  if (!tree) return <div className="min-h-[60vh]" />;

  const point: MapTree[] =
    tree.lat != null && tree.lng != null
      ? [{ code: tree.code, status: tree.status as MapTree['status'], lat: tree.lat, lng: tree.lng, planted: !!tree.plantedAt, species: tree.species.name, category: tree.species.category, padrino: tree.padrino }]
      : [];
  const cover = tree.photos[0] ?? tree.species.image;

  return (
    <>
      <Helmet>
        <title>{`${tree.code} · ${tree.species.name} · ${BOSQUE_NAME}`}</title>
      </Helmet>

      <section className="bg-bosque-dark text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <p className="font-mono text-sm tracking-widest text-guayacan">{tree.code}</p>
            <h1 className="mt-2 font-bosque text-5xl font-semibold">{tree.species.name}</h1>
            {tree.species.scientificName && <p className="mt-1 italic text-white/70">{tree.species.scientificName}</p>}
            <p className="mt-6 text-lg">
              {tree.padrino ? (
                <>
                  Padrino: <strong className="text-guayacan">{tree.padrino}</strong>
                </>
              ) : (
                'Este árbol espera padrino.'
              )}
            </p>
            <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/80">
              <span className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-guayacan" />
                {tree.plantedAt ? `Sembrado el ${fechaLarga(tree.plantedAt)}` : 'Creciendo en el vivero'}
              </span>
              {tree.zone && (
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-guayacan" />
                  {tree.zone}
                </span>
              )}
              <span className="flex items-center gap-2">
                <TreeDeciduous className="h-4 w-4 text-guayacan" />
                {CATEGORY_LABEL[tree.species.category]}
              </span>
            </div>
            {!tree.padrino && (
              <Link to={bosquePath('#especies')} className="mt-8 inline-block rounded-full bg-guayacan px-6 py-3 text-sm font-semibold text-bosque-dark">
                Adopta un árbol
              </Link>
            )}
          </div>
          {cover ? (
            <img src={cld(cover, { width: 900 })} alt={tree.species.name} className="aspect-[4/3] w-full rounded-2xl object-cover" />
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-bosque">
              <TreeDeciduous className="h-24 w-24 text-guayacan" strokeWidth={1} />
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <p className="max-w-3xl leading-relaxed text-bosque-dark/80">{tree.species.description}</p>

        {point.length > 0 && (
          <>
            <h2 className="mt-12 font-bosque text-3xl font-semibold text-bosque">Dónde está</h2>
            <BosqueMap trees={point} focus={tree.code} className="mt-6 h-[360px]" />
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${tree.lat},${tree.lng}`}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-block text-sm font-semibold text-bosque underline underline-offset-4"
            >
              Cómo llegar a mi árbol
            </a>
          </>
        )}

        {tree.photos.length > 1 && (
          <>
            <h2 className="mt-12 font-bosque text-3xl font-semibold text-bosque">Fotos</h2>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {tree.photos.map((p) => (
                <img key={p} src={cld(p, { width: 500 })} alt="" className="aspect-square w-full rounded-xl object-cover" />
              ))}
            </div>
          </>
        )}

        {tree.updates.length > 0 && (
          <>
            <h2 className="mt-12 font-bosque text-3xl font-semibold text-bosque">Novedades</h2>
            <ol className="mt-6 space-y-6 border-l-2 border-guayacan/60 pl-6">
              {tree.updates.map((u) => (
                <li key={u.id}>
                  <p className="text-xs text-bosque-dark/60">{fechaLarga(u.createdAt)}</p>
                  <h3 className="mt-1 font-semibold">{u.title}</h3>
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-bosque-dark/80">{u.body}</p>
                  {u.photos[0] && <img src={cld(u.photos[0], { width: 700 })} alt="" className="mt-3 max-w-md rounded-xl" />}
                </li>
              ))}
            </ol>
          </>
        )}
      </section>
    </>
  );
}
