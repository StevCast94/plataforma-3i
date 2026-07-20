import { useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import { cld } from '@/lib/cloudinary';
import { Button } from '@/components/ui/Button';
import { AmenityIcon } from '@/lib/amenityIcons';
import { Lightbox } from './Lightbox';
import { resolveIcon, resolveBrochureContent } from '@/lib/brochureContent';
import type { Project } from '@shared/types';

// ============================================================
// BROCHURE DIGITAL — componente genérico, reutilizable por proyecto.
// El contenido (textos, cifras, testimonios...) viene de
// project.brochureContent (editable en Admin > Proyectos); si el
// proyecto no define un campo, se completa con el valor por defecto
// de Ibiza Condohotel (ver lib/brochureContent.ts).
// ============================================================

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US');
}

/** Wrapper de animación al hacer scroll. Acepta className para que participe bien en grids del padre. */
function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, delay }}
    >
      {children}
    </motion.div>
  );
}

function SectionTitle({ children, eyebrow }: { children: ReactNode; eyebrow?: string }) {
  return (
    <div className="mb-8 text-center">
      <span className="mx-auto block h-px w-12 bg-secondary" />
      {eyebrow && (
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
          {eyebrow}
        </p>
      )}
      <h3 className="mt-2 text-2xl font-bold text-primary sm:text-3xl">{children}</h3>
    </div>
  );
}

/** Mosaico asimétrico de fotos: 1 grande + 4 pequeñas = 8 celdas exactas de la grilla (sin huecos). */
function MosaicGallery({
  images,
  alt,
  onOpen,
}: {
  images: string[];
  alt: string;
  onOpen: (index: number) => void;
}) {
  if (images.length === 0) return null;
  const shown = images.slice(0, 5);
  const extra = images.length - shown.length;

  return (
    <div className="grid h-[560px] grid-cols-2 grid-rows-4 gap-3 sm:h-[480px] sm:grid-cols-4 sm:grid-rows-2">
      {shown.map((img, i) => (
        <button
          key={img + i}
          onClick={() => onOpen(i)}
          aria-label={`Ampliar foto ${i + 1}`}
          className={`group relative cursor-zoom-in overflow-hidden rounded-2xl ring-1 ring-black/5 ${
            i === 0 ? 'col-span-2 row-span-2' : 'col-span-1 row-span-1'
          }`}
        >
          <img
            src={cld(img, { width: i === 0 ? 1000 : 500 })}
            alt={`${alt} ${i + 1}`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {i === shown.length - 1 && extra > 0 && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-lg font-semibold text-white">
              +{extra}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/** Gráfico de área animado (SVG puro + framer-motion, sin librerías externas). */
function GrowthChart({ data, years }: { data: number[]; years: string[] }) {
  const w = 600;
  const h = 220;
  const padX = 16;
  const padY = 24;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const stepX = (w - padX * 2) / (data.length - 1);
  const points = data.map((v, i) => {
    const x = padX + i * stepX;
    const y = h - padY - ((v - min) / range) * (h - padY * 2);
    return [x, y] as const;
  });
  const linePath = points.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1][0]},${h - padY} L${points[0][0]},${h - padY} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-auto w-full overflow-visible">
      <defs>
        <linearGradient id="brochureGrowthFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-secondary)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--color-secondary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d={areaPath}
        fill="url(#brochureGrowthFill)"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      />
      <motion.path
        d={linePath}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={3}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.4, ease: 'easeOut' }}
      />
      {points.map((p, i) => (
        <motion.g
          key={i}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 + i * 0.15 }}
        >
          <circle cx={p[0]} cy={p[1]} r={4.5} fill="var(--color-primary)" stroke="white" strokeWidth={1.5} />
          <text x={p[0]} y={p[1] - 12} textAnchor="middle" fontSize="11" fill="var(--color-primary)" fontWeight={700}>
            {fmt(data[i])}
          </text>
          <text x={p[0]} y={h - 4} textAnchor="middle" fontSize="10" fill="var(--color-brand-gray, #8a8378)">
            {years[i]}
          </text>
        </motion.g>
      ))}
    </svg>
  );
}

/** Mapa satelital real (Google Maps embed, sin API key) + marcador con pulso sobre el proyecto. */
function LocationMap({
  lat,
  lng,
  label,
  routeStats,
}: {
  lat: number;
  lng: number;
  label: string;
  routeStats: { v: string; l: string }[];
}) {
  return (
    <div className="overflow-hidden rounded-2xl bg-primary p-4 sm:p-6">
      <div className="relative overflow-hidden rounded-xl">
        <iframe
          title={`Ubicación de ${label}`}
          src={`https://www.google.com/maps?q=${lat},${lng}&t=k&z=15&output=embed`}
          className="h-72 w-full border-0 sm:h-96"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <span className="relative flex h-4 w-4">
            <motion.span
              className="absolute inline-flex h-full w-full rounded-full bg-secondary"
              animate={{ scale: [1, 2.6], opacity: [0.8, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
            />
            <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-white bg-secondary" />
          </span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 text-center text-white sm:grid-cols-4">
        {routeStats.map((s) => (
          <div key={s.l}>
            <p className="font-serif text-xl font-bold text-secondary">{s.v}</p>
            <p className="text-xs text-white/70">{s.l}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Coordenadas de referencia (Manglaralto, Santa Elena) si el proyecto no define mapLat/mapLng. */
const DEFAULT_MAP_LAT = -1.7987;
const DEFAULT_MAP_LNG = -80.7398;

interface BrochureDigitalProps {
  project: Project;
  onRequestInfo: () => void;
}

export function BrochureDigital({ project, onRequestInfo }: BrochureDigitalProps) {
  const cover = project.coverImage ?? '';
  const gallery = project.images?.length ? project.images : cover ? [cover] : [];
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const sideImage = gallery[Math.min(2, gallery.length - 1)];
  const bannerImage = gallery[Math.min(4, gallery.length - 1)];
  const c = resolveBrochureContent(project.brochureContent);

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
        {/* Encabezado de sección */}
        <Reveal>
          <div className="mb-10">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-accent" strokeWidth={1.8} />
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
                Brochure Digital
              </p>
            </div>
            <span className="mt-2 block h-1 w-16 rounded bg-secondary" />
          </div>
        </Reveal>

        {/* HERO DEL BROCHURE */}
        <Reveal>
          <div className="relative isolate overflow-hidden rounded-3xl">
            {cover && (
              <img
                src={cld(cover, { width: 1600 })}
                alt={project.name}
                className="absolute inset-0 -z-10 h-full w-full object-cover"
              />
            )}
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/45 to-black/30" />
            <div className="px-6 py-20 text-center text-white sm:py-28">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-secondary">
                {c.eyebrow}
              </p>
              <h2 className="mt-4 font-serif text-4xl font-bold sm:text-6xl">{project.name}</h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-white/85">{c.heroTagline}</p>
              <p className="mt-2 text-sm text-white/70">{c.heroLocation}</p>
            </div>
          </div>
        </Reveal>

        {/* PILARES DE VALOR */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {c.pillars.map((p, i) => {
            const Icon = resolveIcon(p.icon);
            return (
              <Reveal key={p.title} delay={i * 0.06}>
                <div className="h-full rounded-2xl bg-primary p-6 text-white">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-secondary ring-1 ring-white/20">
                    <Icon className="h-5 w-5" strokeWidth={1.6} />
                  </span>
                  <h4 className="mt-3 font-serif text-lg">{p.title}</h4>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/70">{p.body}</p>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* DATOS CLAVE */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {c.keyFacts.map((f, i) => {
            const Icon = resolveIcon(f.icon);
            return (
              <Reveal key={f.label} delay={i * 0.05}>
                <div className="flex items-center gap-4 rounded-2xl bg-light p-5">
                  <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-white text-accent ring-1 ring-secondary/30">
                    <Icon className="h-5 w-5" strokeWidth={1.6} />
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-brand-gray">{f.label}</p>
                    <p className="font-semibold text-primary">{f.value}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* GALERÍA CINEMATOGRÁFICA */}
        {gallery.length > 0 && (
          <div className="mt-16">
            <Reveal>
              <SectionTitle eyebrow="Recorrido visual">Vive {project.name}</SectionTitle>
            </Reveal>
            <Reveal>
              <MosaicGallery images={gallery} alt={project.name} onOpen={setLightboxIndex} />
            </Reveal>
          </div>
        )}

        {/* VISTA GENERAL */}
        <div className="mt-16">
          <Reveal>
            <SectionTitle>Vista General</SectionTitle>
          </Reveal>
          <div className="grid gap-8 lg:grid-cols-5 lg:items-center">
            <Reveal delay={0.05} className="lg:col-span-3">
              <p className="leading-relaxed text-primary/80">{c.overviewText}</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {c.overviewStats.map((s) => (
                  <div key={s.small} className="rounded-2xl bg-primary p-5 text-center text-white">
                    <p className="font-serif text-2xl font-bold text-secondary">{s.big}</p>
                    <p className="mt-1 text-xs text-white/70">{s.small}</p>
                  </div>
                ))}
              </div>
            </Reveal>
            {sideImage && (
              <Reveal delay={0.1} className="lg:col-span-2">
                <button
                  onClick={() => setLightboxIndex(gallery.indexOf(sideImage))}
                  className="group relative block aspect-[4/5] w-full cursor-zoom-in overflow-hidden rounded-2xl"
                >
                  <img
                    src={cld(sideImage, { width: 700 })}
                    alt={`${project.name} vista`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </button>
              </Reveal>
            )}
          </div>
        </div>

        {/* UBICACIÓN */}
        <div className="mt-16">
          <Reveal>
            <SectionTitle eyebrow="A pasos del mar">Ubicación privilegiada</SectionTitle>
          </Reveal>
          <Reveal>
            <LocationMap
              lat={project.mapLat ?? DEFAULT_MAP_LAT}
              lng={project.mapLng ?? DEFAULT_MAP_LNG}
              label={project.name}
              routeStats={c.routeStats}
            />
          </Reveal>
        </div>

        {/* PLAN DE INVERSIÓN */}
        <div className="mt-16">
          <Reveal>
            <SectionTitle>Plan de Inversión</SectionTitle>
          </Reveal>
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Modelo de pago */}
            <Reveal>
              <div className="rounded-2xl bg-light p-6">
                <h4 className="mb-4 font-serif text-xl text-primary">Modelo de pago</h4>
                <dl className="divide-y divide-black/5">
                  {c.paymentPlan.map((p) => (
                    <div key={p.label} className="flex items-center justify-between py-3">
                      <dt className="text-sm text-brand-gray">{p.label}</dt>
                      <dd className="text-right font-semibold text-primary">{p.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Reveal>

            {/* Proyección de valor + gráfico animado */}
            <Reveal delay={0.1}>
              <div className="rounded-2xl bg-light p-6">
                <h4 className="mb-4 font-serif text-xl text-primary">Proyección de valor</h4>
                <div className="space-y-3">
                  {c.valueProjection.map((v) => (
                    <div key={v.year} className="rounded-xl bg-white p-4">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs uppercase tracking-wider text-brand-gray">
                          {v.year} · {v.label}
                        </span>
                        <span className="font-serif text-xl font-bold text-accent">{fmt(v.value)}</span>
                      </div>
                      <p className="text-xs text-brand-gray">{v.note}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <p className="mb-1 text-xs uppercase tracking-wider text-brand-gray">
                    Crecimiento estimado (Año 0 → {c.chart.length - 1})
                  </p>
                  <GrowthChart data={c.chart} years={c.chart.map((_, i) => `A${i}`)} />
                </div>
              </div>
            </Reveal>
          </div>

          {/* Renting */}
          <Reveal>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {c.rentingStats.map((s) => (
                <div key={s.l} className="rounded-2xl border border-black/10 p-5 text-center">
                  <p className="font-serif text-2xl font-bold text-primary">{s.v}</p>
                  <p className="mt-1 text-sm text-brand-gray">{s.l}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        {/* AMENIDADES */}
        <div className="mt-16">
          <Reveal>
            <SectionTitle>Amenidades</SectionTitle>
          </Reveal>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {c.amenities.map((a, i) => (
              <Reveal key={a} delay={i * 0.04}>
                <div className="flex flex-col items-center gap-2 rounded-2xl bg-light p-5 text-center">
                  <AmenityIcon name={a} className="h-7 w-7 text-accent" />
                  <span className="text-sm font-medium text-primary">{a}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* ¿POR QUÉ INVERTIR? */}
        <div className="mt-16">
          <Reveal>
            <SectionTitle>¿Por qué invertir?</SectionTitle>
          </Reveal>
          <div className="grid gap-5 sm:grid-cols-2">
            {c.whyInvest.map((w, i) => {
              const Icon = resolveIcon(w.icon);
              return (
                <Reveal key={w.title} delay={i * 0.05}>
                  <div className="h-full rounded-2xl bg-light p-6">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-accent ring-1 ring-secondary/30">
                      <Icon className="h-5 w-5" strokeWidth={1.6} />
                    </span>
                    <h4 className="mt-3 font-serif text-xl text-primary">{w.title}</h4>
                    <p className="mt-2 text-sm leading-relaxed text-brand-gray">{w.body}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>

          {/* Seguros + garantía */}
          <Reveal>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {c.insurances.map((s) => (
                <div key={s.label} className="flex items-center justify-between rounded-xl bg-primary px-5 py-4 text-white">
                  <span className="text-sm">{s.label}</span>
                  <span className="font-serif text-lg font-bold text-secondary">{s.value}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        {/* BANNER EMOTIVO */}
        {bannerImage && (
          <Reveal>
            <div className="relative isolate mt-16 overflow-hidden rounded-3xl">
              <img
                src={cld(bannerImage, { width: 1400 })}
                alt={`${project.name} playa`}
                className="absolute inset-0 -z-10 h-full w-full object-cover"
              />
              <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/90 via-primary/60 to-transparent" />
              <div className="max-w-md px-6 py-16 text-white sm:px-12">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-secondary">
                  {c.bannerEyebrow}
                </p>
                <h3 className="mt-3 font-serif text-3xl font-bold sm:text-4xl">{c.bannerTitle}</h3>
                <p className="mt-3 text-white/80">{c.bannerBody}</p>
              </div>
            </div>
          </Reveal>
        )}

        {/* TESTIMONIOS */}
        <div className="mt-16">
          <Reveal>
            <SectionTitle>Testimonios</SectionTitle>
          </Reveal>
          <div className="grid gap-5 md:grid-cols-3">
            {c.testimonials.map((t, i) => (
              <Reveal key={t.name} delay={i * 0.05}>
                <figure className="h-full rounded-2xl bg-light p-6">
                  <blockquote className="text-sm leading-relaxed text-primary/80">“{t.text}”</blockquote>
                  <figcaption className="mt-4">
                    <p className="font-semibold text-primary">{t.name}</p>
                    <p className="text-xs text-brand-gray">{t.role}</p>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>

        {/* CTA FINAL DEL BROCHURE */}
        <Reveal>
          <div className="mt-16 overflow-hidden rounded-3xl bg-primary px-6 py-12 text-center text-white sm:px-12">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-secondary">
              Tu oportunidad te espera
            </p>
            <h3 className="mt-3 font-serif text-3xl font-bold sm:text-4xl">¿Listo para invertir?</h3>
            <p className="mt-2 text-white/70">{c.ctaSubtitle}</p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-center">
              {c.ctaStats.map((s) => (
                <div key={s.l}>
                  <p className="font-serif text-2xl font-bold text-secondary">{s.v}</p>
                  <p className="text-xs text-white/60">{s.l}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button size="lg" onClick={onRequestInfo}>
                Solicitar información
              </Button>
              {c.pdfUrl && (
                <a href={c.pdfUrl} download target="_blank" rel="noreferrer">
                  <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white hover:text-primary">
                    Descargar brochure PDF
                  </Button>
                </a>
              )}
            </div>

            {c.contactLine && <p className="mt-6 text-xs text-white/50">{c.contactLine}</p>}
          </div>
        </Reveal>
      </div>

      <Lightbox
        images={gallery}
        index={lightboxIndex}
        alt={project.name}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
      />
    </section>
  );
}
