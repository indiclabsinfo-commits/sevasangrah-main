import { createClient } from '@supabase/supabase-js'

console.log('⚡ [SupabaseClient] URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('⚡ [SupabaseClient] KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY);

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

console.log('⚡ [SupabaseClient] Initializing with URL:', supabaseUrl ? 'Set' : 'Missing');

export const supabase = createClient(
    supabaseUrl,
    supabaseAnonKey
)
