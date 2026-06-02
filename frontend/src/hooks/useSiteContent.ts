import { api } from '@/lib/api';
import { useFetch } from './useFetch';
import type { SiteContentMap } from '@shared/types';

/** Carga todo el contenido del sitio agrupado por sección. */
export function useSiteContent() {
  return useFetch<SiteContentMap>(() => api.get<SiteContentMap>('/content'), []);
}

/** Carga el contenido de una sola sección como { key: value }. */
export function useSectionContent(section: string) {
  return useFetch<Record<string, string>>(
    () => api.get<Record<string, string>>(`/content?section=${section}`),
    [section],
  );
}
