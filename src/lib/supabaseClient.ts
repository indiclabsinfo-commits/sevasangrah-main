// Supabase Client - Zero Backend Architecture
// Auto-loads Supabase and creates client with current configuration

import { ensureSupabaseLoaded, createSupabaseClient } from '../config/supabaseConfig';

let supabaseInstance: any = null;

// Get or create Supabase client
export async function getSupabase() {
  if (supabaseInstance) {
    return supabaseInstance;
  }
  
  // Ensure Supabase is loaded
  await ensureSupabaseLoaded();
  
  // Create client with current config
  supabaseInstance = createSupabaseClient();
  
  console.log('✅ Supabase client initialized');
  return supabaseInstance;
}

// Export a simple object that will be replaced with real client after initialization
export const supabase = {} as any;

// Initialize on page load and replace the supabase object
if (typeof window !== 'undefined') {
  getSupabase().then(client => {
    // Copy all properties from real client to our export
    Object.keys(client).forEach(key => {
      supabase[key] = client[key];
    });
    console.log('✅ Supabase export initialized');
  }).catch(err => {
    console.error('❌ Failed to initialize Supabase:', err);
  });
}