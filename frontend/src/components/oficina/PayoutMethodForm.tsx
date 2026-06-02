import { useState, type FormEvent } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { useToast } from '@/components/shared/Toast';
import { useAuth } from '@/hooks/useAuth';
import type { ReferralMember } from '@shared/types';

const METHODS = [
  { value: 'transfer', label: 'Transferencia bancaria' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'payoneer', label: 'Payoneer' },
  { value: 'wise', label: 'Wise' },
];

export function PayoutMethodForm({ member }: { member: ReferralMember }) {
  const { toast } = useToast();
  const { refresh } = useAuth();
  const [method, setMethod] = useState(member.payoutMethod ?? 'transfer');
  const [email, setEmail] = useState(member.payoutEmail ?? '');
  const [account, setAccount] = useState(
    (member.bankInfo?.account as string) ?? '',
  );
  const [bank, setBank] = useState((member.bankInfo?.bank as string) ?? '');
  const [saving, setSaving] = useState(false);

  const isOnlineWallet = method === 'paypal' || method === 'payoneer' || method === 'wise';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/members/payout-method', {
        payoutMethod: method,
        payoutEmail: isOnlineWallet ? email : null,
        bankInfo: method === 'transfer' ? { bank, account } : undefined,
      });
      await refresh();
      toast('Método de pago guardado', 'success');
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-primary">Método de pago</span>
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="w-full rounded-lg border border-black/15 bg-white px-4 py-3 text-sm text-primary focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/30"
        >
          {METHODS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </label>

      {isOnlineWallet ? (
        <Input
          label={`Email de ${method}`}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tucorreo@ejemplo.com"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Banco" value={bank} onChange={(e) => setBank(e.target.value)} />
          <Input
            label="Número de cuenta"
            value={account}
            onChange={(e) => setAccount(e.target.value)}
          />
        </div>
      )}

      <Button type="submit" disabled={saving}>
        {saving ? 'Guardando…' : 'Guardar método'}
      </Button>
    </form>
  );
}
