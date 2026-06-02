import { Skeleton } from '@/components/ui/Skeleton';

/** Skeleton para la página de detalle (proyecto o producto). */
export function DetailSkeleton() {
  return (
    <div>
      <Skeleton className="h-[60vh] w-full rounded-none" />
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-12 sm:px-6">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-5 w-2/3" />
        <div className="grid gap-6 sm:grid-cols-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}

/** Grid de skeletons tipo galería. */
export function GallerySkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-56 w-full" />
      ))}
    </div>
  );
}
