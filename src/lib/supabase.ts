import { createClient } from '@supabase/supabase-js';

// Variables de entorno para Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file'
  );
}

// Cliente de Supabase (sin tipos estrictos por ahora para mayor flexibilidad)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Cambiado a false para evitar cuelgues
    storage: window.localStorage,
    storageKey: 'sb-auth-token',
    flowType: 'pkce',
  },
});

// Helper para manejar errores de Supabase
export function handleSupabaseError(error: any, context: string): never {
  console.error(`❌ Supabase error in ${context}:`, error);
  throw new Error(`${context}: ${error.message || 'Unknown error'}`);
}

// Helper para verificar si el usuario está autenticado
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    console.error('Error getting current user:', error);
    return null;
  }

  return user;
}

// Helper para verificar si el usuario es admin
export async function isUserAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error checking user role:', error);
    return false;
  }

  return data?.role === 'admin';
}
