import { createClient } from '@supabase/supabase-js'

console.log('⚡ [SupabaseClient] URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('⚡ [SupabaseClient] KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY);

const supabaseUrl = 'https://plkbxjedbjpmbfrekmrr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsa2J4amVkYmpwbWJmcmVrbXJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5Njg5MDEsImV4cCI6MjA4NjU0NDkwMX0.6zlXnUoEmGoOPVJ8S6uAwWZX3yWbShlagDykjgm6BUM';

console.log('⚡ [SupabaseClient] Initializing with HARDCODED credentials');

export const supabase = createClient(
    supabaseUrl,
    supabaseAnonKey
)
