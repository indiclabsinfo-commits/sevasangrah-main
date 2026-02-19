// Supabase Client - Zero Backend Architecture
// Uses npm package @supabase/supabase-js directly

import { createSupabaseClient } from '../config/supabaseConfig';
import type { SupabaseClient } from '@supabase/supabase-js';

// Initialize Supabase client immediately to prevent null pointer errors when exported directly
const supabaseInstance = createSupabaseClient();
export const supabase: SupabaseClient = supabaseInstance;

/**
 * Get or create Supabase client.
 * Returns the Supabase client instance (synchronous with npm package).
 * Kept for backwards compatibility.
 */
export async function getSupabase(): Promise<SupabaseClient> {
  return supabaseInstance;
}