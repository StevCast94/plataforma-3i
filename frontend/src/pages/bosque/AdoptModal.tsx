import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, X } from 'lucide-react';
import { PhoneField } from '@/components/shared/PhoneField';
import { WhatsAppCTA } from '@/components/shared/WhatsAppCTA';
import { useReferral } from '@/hooks/useReferral';
import { BOSQUE_NAME, bosquePath, bosquePost, CATEGORY_LABEL, money, type MapTree, type TreeSpecies } from '@/lib/bosque';

interface Props {
  species: TreeSpecies[];
  initial: TreeSpecies | null;
  /** Árbol elegido en el mapa: la adopción es de ese árbol exacto. */
  picked?: MapTree | null;
  onClose: () => void;
}

interface Created {
  treeCode?: string | null;
  code: string;
  amount: number;
  quantity: number;
  species: string;
}

const field = 'w-full rounded-xl border border-bosque/20 bg-white px-4 py-3 text-sm outline-none focus:border-bosque';

/** Formulario de adopción. La adopción queda pendiente hasta que se confirma el pago. */
export function AdoptModal({ species, initial, picked, onClose }: Props) {
  const referral = useReferral();
  const [speciesId, setSpeciesId] = useState(picked?.speciesId ?? initial?.id ?? species[0]?.id ?? '');
  const [accepted, setAccepted] = useState(false);
  const [anonymous, setAnonymous] = useState(false);
  const [qty, setQty] = useState(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [dedication, setDedication] = useState('');
  const [gift, setGift] = useState(false);
  const [subscription, setSubscription] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Created | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const sp = species.find((s) => s.id === speciesId);
  const total = (sp?.price ?? 0) * (picked ? 1 : qty);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!phone) {
      setError('El WhatsApp es obligatorio: por ahí coordinamos el pago y te enviamos las fotos.');
      return;
    }
    setSending(true);
    try {
      const r = await bosquePost<Created>('/adoptions', {
        speciesId,
        treeCode: picked?.code ?? null,
        quantity: picked ? 1 : qty,
        customerName: name,
        customerPhone: phone,
        customerEmail: email || null,
        dedication: gift || dedication ? dedication || null : null,
        subscription,
        anonymous,
        referralCode: referral,
      });
      setCreated(r);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[1100] flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="adopt-title"
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-savia p-6 shadow-2xl sm:rounded-3xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="adopt-title" className="font-bosque text-2xl font-semibold text-bosque">
            {created ? '¡Gracias por sembrar vida!' : 'Adopta un árbol'}
          </h2>
          <button onClick={onClose} aria-label="Cerrar" className="rounded-full p-1.5 text-bosque-dark/60 hover:bg-bosque/10">
            <X className="h-5 w-5" />
          </button>
        </div>

        {created ? (
          <div className="mt-5 space-y-4 text-sm leading-relaxed">
            <p>
              Registramos tu adopción de <strong>{created.treeCode ? `${created.species} ${created.treeCode}` : `${created.quantity} ${created.species}`}</strong> por{' '}
              <strong>{money(created.amount)}</strong>.
            </p>
            <div className="rounded-2xl bg-white p-4 text-center">
              <p className="text-xs uppercase tracking-widest text-bosque-dark/60">Tu código</p>
              <p className="mt-1 font-mono text-2xl font-semibold tracking-wider text-bosque">{created.code}</p>
            </div>
            <p>
              Escríbenos por WhatsApp para coordinar el pago. Cuando se confirme, tu certificado queda activo y te
              asignamos tu árbol con su ubicación en el bosque.
            </p>
            <WhatsAppCTA
              message={`Hola, quiero pagar mi adopción ${created.code} en ${BOSQUE_NAME}: ${created.quantity} ${created.species} por ${money(created.amount)}.`}
              className="w-full justify-center"
            >
              Coordinar pago por WhatsApp
            </WhatsAppCTA>
            <Link
              to={bosquePath(`/certificado/${created.code}`)}
              className="block text-center font-medium text-bosque underline underline-offset-4"
            >
              Ver el estado de mi adopción
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-5 space-y-4">
            {picked ? (
              <div className="rounded-xl bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-widest text-bosque-dark/60">Árbol elegido en el mapa</p>
                <p className="mt-1 font-semibold">
                  <span className="font-mono text-bosque">{picked.code}</span> · {picked.species}
                  {picked.zone ? ` · ${picked.zone}` : ''}
                </p>
              </div>
            ) : (
            <>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Especie</span>
              <select id="adopt-species" value={speciesId} onChange={(e) => setSpeciesId(e.target.value)} className={field}>
                {species.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} · {CATEGORY_LABEL[s.category]} · {money(s.price)}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3">
              <span className="text-sm font-medium">Cantidad de árboles</span>
              <div className="flex items-center gap-3">
                <button type="button" aria-label="Uno menos" onClick={() => setQty((q) => Math.max(1, q - 1))} className="rounded-full border border-bosque/20 p-1.5 hover:bg-savia">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-6 text-center font-semibold tabular-nums">{qty}</span>
                <button type="button" aria-label="Uno más" onClick={() => setQty((q) => Math.min(100, q + 1))} className="rounded-full border border-bosque/20 p-1.5 hover:bg-savia">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
            </>
            )}

            <input id="adopt-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre completo" className={field} />
            <PhoneField name="adopt-phone" label="WhatsApp" required onChange={setPhone} />
            <input id="adopt-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo (opcional)" className={field} />

            <label className="flex items-center gap-2 text-sm">
              <input id="adopt-gift" type="checkbox" checked={gift} onChange={(e) => setGift(e.target.checked)} className="h-4 w-4 accent-[#1f4d34]" />
              Es un regalo o quiero dedicarlo a otra persona
            </label>
            {gift && (
              <input id="adopt-dedication" value={dedication} onChange={(e) => setDedication(e.target.value)} placeholder="Nombre que aparecerá en el certificado" className={field} />
            )}

            <label className="flex items-center gap-2 text-sm">
              <input id="adopt-anon" type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} className="h-4 w-4 accent-[#1f4d34]" />
              No mostrar mi nombre en el mapa (aparecerá como padrino anónimo)
            </label>

            <label className="flex items-start gap-2 text-sm">
              <input id="adopt-sub" type="checkbox" checked={subscription} onChange={(e) => setSubscription(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#1f4d34]" />
              <span>
                Quiero sumarme como <strong>padrino activo</strong> (aporte mensual opcional para novedades, visita guiada y
                fruta de temporada). Te contamos los detalles por WhatsApp.
              </span>
            </label>

            <label className="flex items-start gap-2 text-sm">
              <input id="adopt-terms" type="checkbox" required checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#1f4d34]" />
              <span>
                Acepto los{' '}
                <Link to={bosquePath('/terminos')} target="_blank" className="font-semibold text-bosque underline underline-offset-2">
                  términos de la adopción
                </Link>
              </span>
            </label>

            {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

            <div className="flex items-center justify-between border-t border-bosque/10 pt-4">
              <div>
                <p className="text-xs text-bosque-dark/60">Total</p>
                <p className="font-bosque text-2xl font-semibold text-bosque">{money(total)}</p>
              </div>
              <button
                type="submit"
                disabled={sending || !speciesId}
                className="rounded-full bg-bosque px-6 py-3 text-sm font-semibold text-white transition hover:bg-bosque-dark disabled:opacity-60"
              >
                {sending ? 'Enviando…' : 'Adoptar'}
              </button>
            </div>
            <p className="text-xs leading-relaxed text-bosque-dark/60">
              Incluye la siembra, 3 años de cuidado y reposición si el árbol no prospera. El pago se coordina por WhatsApp.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
