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

// Helper for components that need immediate access
export const supabase = {
  // These will throw if called before initialization
  // Components should use getSupabase() instead
};

// Initialize on page load (optional)
if (typeof window !== 'undefined') {
  // Auto-initialize in background
  getSupabase().catch(err => {
    console.error('❌ Failed to initialize Supabase:', err);
  });
}