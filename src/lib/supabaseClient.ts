import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * Cliente de Supabase, o null si faltan las variables de entorno.
 * Sin Supabase la app usa los datos de ejemplo (modo demostración).
 */
export const supabase: SupabaseClient | null =
  url && key && !url.includes('xxxx') ? createClient(url, key) : null;

export const modoEjemplo = supabase === null;
