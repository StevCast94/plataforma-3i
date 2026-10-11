import { useCallback, useEffect, useState } from 'react';
import { usePanelClient } from '@/lib/panelClient';

interface State<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/** GET a un endpoint admin con estado de carga/error y recarga manual. */
export function useAdminGet<T>(path: string | null): State<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const client = usePanelClient();

  useEffect(() => {
    if (!path) return;
    let cancelled = false;
    setLoading(true);
    client
      .get<T>(path)
      .then((d) => !cancelled && setData(d))
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [path, tick, client]);

  return { data, loading, error, reload };
}
