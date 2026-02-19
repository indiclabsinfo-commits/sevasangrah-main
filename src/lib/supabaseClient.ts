// Supabase Client - Zero Backend Architecture
// Auto-loads Supabase and creates client with current configuration

import { ensureSupabaseLoaded, createSupabaseClient } from '../config/supabaseConfig';

let supabaseInstance: any = null;

/**
 * Get or create Supabase client.
 * Returns a promise that resolves to the Supabase client instance.
 * Use this instead of direct 'supabase' export for maximum safety and async loading.
 */
export let supabase: any = null;

export async function getSupabase() {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // Ensure Supabase is loaded
  await ensureSupabaseLoaded();

  // Create client with current config
  supabaseInstance = createSupabaseClient();

  if (!supabaseInstance) {
    throw new Error('Failed to create Supabase client. Please refresh the page.');
  }

  supabase = supabaseInstance; // Update the exported let

  console.log('✅ Supabase client initialized');
  return supabaseInstance;
}