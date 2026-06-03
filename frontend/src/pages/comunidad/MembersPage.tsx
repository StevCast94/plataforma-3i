import { useState } from 'react';
import { Seo } from '@/components/shared/Seo';
import { MemberCard } from '@/components/comunidad/MemberCard';
import { useFetch } from '@/hooks/useFetch';
import { api } from '@/lib/api';
import type { CommunityMember } from '@shared/types';

export default function MembersPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const params = new URLSearchParams({ ...(q ? { q } : {}), ...(status ? { status } : {}) });
  const { data, loading } = useFetch<CommunityMember[]>(
    () => api.get<CommunityMember[]>(`/community/members?${params}`),
    [q, status],
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <Seo title="Miembros — Comunidad" />
      <h1 className="mb-5 text-2xl font-bold text-primary">Miembros de la comunidad</h1>

      <div className="mb-5 flex flex-wrap gap-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o ubicación…" className="flex-1 rounded-lg border border-black/15 px-3 py-2 text-sm" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-black/15 px-3 py-2 text-sm">
          <option value="">Todos</option>
          <option value="ELITE">Elite</option>
          <option value="PREMIERE">Premiere</option>
        </select>
      </div>

      {loading && <p className="text-brand-gray">Cargando…</p>}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {(data ?? []).map((m) => (
          <MemberCard key={m.referralCode} member={m} />
        ))}
      </div>
      {!loading && (data ?? []).length === 0 && (
        <p className="rounded-2xl bg-white p-8 text-center text-brand-gray ring-1 ring-black/5">Sin resultados.</p>
      )}
    </div>
  );
}
