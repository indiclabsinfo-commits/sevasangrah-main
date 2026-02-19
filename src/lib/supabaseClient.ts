// Supabase Client - Zero Backend Architecture
// Uses npm package @supabase/supabase-js directly

import { createSupabaseClient } from '../config/supabaseConfig';
import type { SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

/**
 * Get or create Supabase client.
 * Returns the Supabase client instance (synchronous with npm package).
 */
export let supabase: SupabaseClient | null = null;

export async function getSupabase(): Promise<SupabaseClient> {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // Create client directly (no CDN loading needed)
  supabaseInstance = createSupabaseClient();
  supabase = supabaseInstance;

  console.log('✅ Supabase client initialized');
  return supabaseInstance;
}