// Auth debug utility
console.log('🔄 Auth debug loaded');

// Check environment variables
console.log('🔍 Checking env vars:', {
  hasSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
  hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing',
  supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing'
});

// Global error handler for auth
window.addEventListener('error', (event) => {
  if (event.message.includes('auth') || event.message.includes('Auth') || 
      event.message.includes('supabase') || event.message.includes('Supabase')) {
    console.warn('⚠️ Auth-related error caught:', event.message);
    // Don't prevent default, just log
  }
});

console.log('✅ Auth debug ready');
