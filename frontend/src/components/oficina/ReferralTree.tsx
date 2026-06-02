import { Badge } from '@/components/ui/Badge';
import { statusLabel } from '@/lib/referral';
import type { TreeNode, ReferredSummary } from '@shared/types';

function MemberCard({
  member,
  level,
  firstPurchaseAt,
}: {
  member: ReferredSummary;
  level: 1 | 2;
  firstPurchaseAt?: string | null;
}) {
  const isElite = member.status === 'ELITE';
  return (
    <div
      className={`rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5 ${
        level === 2 ? 'border-l-4 border-light' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="truncate font-semibold text-primary">{member.fullName}</p>
        <Badge variant={isElite ? 'gold' : 'light'}>{statusLabel(member.status)}</Badge>
      </div>
      <p className="mt-1 truncate text-xs text-brand-gray">{member.email}</p>
      <p className="mt-2 text-xs text-brand-gray">
        Registrado: {new Date(member.createdAt).toLocaleDateString('es-EC')}
      </p>
      <p className="text-xs">
        {firstPurchaseAt ? (
          <span className="text-green-600">✓ Con compra</span>
        ) : (
          <span className="text-brand-gray">Sin compra aún</span>
        )}
      </p>
    </div>
  );
}

/** Árbol genealógico de 2 niveles usando CSS grid/flex (sin librerías). */
export function ReferralTree({ nodes }: { nodes: TreeNode[] }) {
  if (nodes.length === 0) {
    return (
      <p className="rounded-2xl bg-white p-8 text-center text-brand-gray ring-1 ring-black/5">
        Aún no tienes referidos. ¡Comparte tu enlace para empezar!
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {nodes.map((node) => (
        <div key={node.referralId} className="rounded-2xl bg-light/60 p-4">
          <MemberCard member={node.member} level={1} firstPurchaseAt={node.firstPurchaseAt} />
          {node.children && node.children.length > 0 && (
            <div className="mt-3 ml-4 space-y-3 border-l-2 border-secondary/40 pl-4">
              <p className="text-xs uppercase tracking-wider text-brand-gray">
                Nivel 2 ({node.children.length})
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {node.children.map((child) => (
                  <MemberCard
                    key={child.referralId}
                    member={child.member}
                    level={2}
                    firstPurchaseAt={child.firstPurchaseAt}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
