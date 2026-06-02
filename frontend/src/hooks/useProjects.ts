import { api } from '@/lib/api';
import { useFetch } from './useFetch';
import type { Project } from '@shared/types';

export function useProjects() {
  return useFetch<Project[]>(() => api.get<Project[]>('/projects'), []);
}

export function useProject(slug: string | undefined) {
  return useFetch<Project>(
    () => api.get<Project>(`/projects/${slug}`),
    [slug],
  );
}
