import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Cliente Supabase para auth de usuarios públicos (se usa a partir de Fase 1+).
// Las llaves van en frontend/.env (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Cliente perezoso: solo se crea si hay credenciales configuradas.
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;

export function getSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'Supabase no está configurado. Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.',
    );
  }
  return supabase;
}
