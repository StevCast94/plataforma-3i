import { api } from '@/lib/api';
import { useFetch } from './useFetch';
import type { Product } from '@shared/types';

export function useProducts() {
  return useFetch<Product[]>(() => api.get<Product[]>('/products'), []);
}

export function useProduct(slug: string | undefined) {
  return useFetch<Product>(
    () => api.get<Product>(`/products/${slug}`),
    [slug],
  );
}
