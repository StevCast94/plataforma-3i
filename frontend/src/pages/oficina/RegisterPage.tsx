import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Seo } from '@/components/shared/Seo';
import { useAuth } from '@/hooks/useAuth';
import { type RegisterData } from '@/context/AuthContext';
import { useReferral } from '@/hooks/useReferral';
import { useToast } from '@/components/shared/Toast';

type StepErrors = Record<string, string>;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const empty: RegisterData = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  docType: 'cedula',
  docId: '',
  payoutMethod: 'transfer',
  payoutEmail: '',
};

export default function RegisterPage() {
  const { register } = useAuth();
  const referralCode = useReferral();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const claimEmail = params.get('email');

  const [step, setStep] = useState(1);
  const [data, setData] = useState<RegisterData>(
    claimEmail ? { ...empty, email: claimEmail } : empty,
  );
  const [errors, setErrors] = useState<StepErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof RegisterData>(key: K, value: RegisterData[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  function validateStep(s: number): StepErrors {
    const e: StepErrors = {};
    if (s === 1) {
      if (!data.fullName.trim()) e.fullName = 'Requerido';
      if (!EMAIL_RE.test(data.email)) e.email = 'Email inválido';
      if (data.password.length < 8) e.password = 'Mínimo 8 caracteres';
    }
    if (s === 2) {
      if (!data.docId.trim()) e.docId = 'Requerido';
    }
    return e;
  }

  function next() {
    const e = validateStep(step);
    setErrors(e);
    if (Object.keys(e).length === 0) setStep((s) => Math.min(s + 1, 3));
  }

  async function submit() {
    const e = { ...validateStep(1), ...validateStep(2) };
    setErrors(e);
    if (Object.keys(e).length > 0) {
      setStep(1);
      return;
    }
    setSubmitting(true);
    try {
      await register(data);
      toast('¡Bienvenido al Club 3i! 🎉', 'success');
      navigate('/oficina/dashboard');
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-light px-4 py-10">
      <Seo title="Registro — Oficina Virtual" />
      <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-xl">
        <Link to="/oficina" className="font-serif text-2xl font-bold text-primary">
          Grupo<span className="text-secondary"> 3i</span>
        </Link>

        {claimEmail && (
          <div className="mt-4 rounded-xl bg-secondary/15 p-3 text-sm text-primary">
            ✨ Estás <strong>activando tu oficina</strong>. Define tu contraseña y datos para
            desbloquear tu código de referidor.
          </div>
        )}

        {referralCode && (
          <div className="mt-4 flex items-center gap-2">
            <Badge variant="gold">Referido</Badge>
            <span className="text-sm text-brand-gray">
              Te invitó: <strong className="text-primary">{referralCode}</strong>
            </span>
          </div>
        )}

        {/* Barra de progreso */}
        <div className="mt-6 flex gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-secondary' : 'bg-light'}`}
            />
          ))}
        </div>
        <p className="mt-2 text-xs uppercase tracking-wider text-brand-gray">Paso {step} de 3</p>

        <div className="mt-6 space-y-4">
          {step === 1 && (
            <>
              <h2 className="text-2xl text-primary">Datos personales</h2>
              <FieldInput
                label="Nombre completo"
                value={data.fullName}
                onChange={(v) => set('fullName', v)}
                error={errors.fullName}
              />
              <FieldInput
                label="Email"
                type="email"
                value={data.email}
                onChange={(v) => set('email', v)}
                error={errors.email}
              />
              <FieldInput
                label="Teléfono (opcional)"
                value={data.phone ?? ''}
                onChange={(v) => set('phone', v)}
              />
              <FieldInput
                label="Contraseña"
                type="password"
                value={data.password}
                onChange={(v) => set('password', v)}
                error={errors.password}
              />
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-2xl text-primary">Documento de identidad</h2>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-primary">Tipo</span>
                <select
                  value={data.docType}
                  onChange={(e) => set('docType', e.target.value)}
                  className="w-full rounded-lg border border-black/15 bg-white px-4 py-3 text-sm"
                >
                  <option value="cedula">Cédula</option>
                  <option value="pasaporte">Pasaporte</option>
                </select>
              </label>
              <FieldInput
                label="Número de documento"
                value={data.docId}
                onChange={(v) => set('docId', v)}
                error={errors.docId}
              />
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-2xl text-primary">Datos de pago</h2>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-primary">
                  Método preferido
                </span>
                <select
                  value={data.payoutMethod}
                  onChange={(e) => set('payoutMethod', e.target.value)}
                  className="w-full rounded-lg border border-black/15 bg-white px-4 py-3 text-sm"
                >
                  <option value="transfer">Transferencia bancaria</option>
                  <option value="paypal">PayPal</option>
                  <option value="payoneer">Payoneer</option>
                  <option value="wise">Wise</option>
                </select>
              </label>
              {data.payoutMethod !== 'transfer' && (
                <FieldInput
                  label="Email de la cuenta"
                  type="email"
                  value={data.payoutEmail ?? ''}
                  onChange={(v) => set('payoutEmail', v)}
                />
              )}
              <p className="text-xs text-brand-gray">
                Podrás completar o cambiar estos datos luego desde tu oficina.
              </p>
            </>
          )}
        </div>

        <div className="mt-8 flex items-center justify-between">
          {step > 1 ? (
            <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
              Atrás
            </Button>
          ) : (
            <span />
          )}
          {step < 3 ? (
            <Button onClick={next}>Continuar</Button>
          ) : (
            <Button onClick={submit} disabled={submitting}>
              {submitting ? 'Creando cuenta…' : 'Crear mi cuenta'}
            </Button>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-brand-gray">
          ¿Ya tienes cuenta?{' '}
          <Link to="/oficina/login" className="font-semibold text-accent hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}

function FieldInput({
  label,
  value,
  onChange,
  type = 'text',
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  error?: string;
}) {
  return (
    <div>
      <Input label={label} type={type} value={value} onChange={(e) => onChange(e.target.value)} />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
