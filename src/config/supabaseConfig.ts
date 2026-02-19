// Supabase Configuration - Zero Backend Architecture
// Switch between different Supabase projects via URL parameter

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  projectName?: string;
}

// Available configurations
export const SUPABASE_CONFIGS: Record<string, SupabaseConfig> = {
  // Magnus Hospital (Production)
  magnus: {
    url: 'https://plkbxjedbjpmbfrekmrr.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsa2J4amVkYmpwbWJmcmVrbXJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5Njg5MDEsImV4cCI6MjA4NjU0NDkwMX0.6zlXnUoEmGoOPVJ8S6uAwWZX3yWbShlagDykjgm6BUM',
    projectName: 'Magnus Hospital'
  },

  // Demo Client A
  demoA: {
    url: 'https://plkbxjedbjpmbfrekmrr.supabase.co', // Same for now
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsa2J4amVkYmpwbWJmcmVrbXJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5Njg5MDEsImV4cCI6MjA4NjU0NDkwMX0.6zlXnUoEmGoOPVJ8S6uAwWZX3yWbShlagDykjgm6BUM',
    projectName: 'Demo Client A'
  },

  // Demo Client B  
  demoB: {
    url: 'https://plkbxjedbjpmbfrekmrr.supabase.co', // Same for now
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsa2J4amVkYmpwbWJmcmVrbXJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5Njg5MDEsImV4cCI6MjA4NjU0NDkwMX0.6zlXnUoEmGoOPVJ8S6uAwWZX3yWbShlagDykjgm6BUM',
    projectName: 'Demo Client B'
  }
};

// Get current configuration based on URL parameter
export function getCurrentConfig(): SupabaseConfig {
  const urlParams = new URLSearchParams(window.location.search);
  const client = urlParams.get('client') || 'magnus';

  return SUPABASE_CONFIGS[client] || SUPABASE_CONFIGS.magnus;
}

// Create Supabase client with current config
export function createSupabaseClient() {
  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.error('❌ window.supabase is not available:', window.supabase);
    throw new Error('Supabase SDK not loaded. Please refresh the page and try again.');
  }

  const { createClient } = window.supabase;
  const config = getCurrentConfig();

  console.log(`🔧 Using Supabase project: ${config.projectName || 'Unknown'}`);

  return createClient(config.url, config.anonKey);
}

// Check if Supabase is available
export function isSupabaseAvailable(): boolean {
  return typeof window.supabase?.createClient === 'function';
}

// Wait for window.supabase to be populated after script loads
function waitForSupabaseGlobal(maxWaitMs: number = 5000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isSupabaseAvailable()) {
      resolve();
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      if (isSupabaseAvailable()) {
        clearInterval(interval);
        resolve();
      } else if (Date.now() - startTime > maxWaitMs) {
        clearInterval(interval);
        reject(new Error('Supabase SDK did not initialize within timeout. Please refresh the page.'));
      }
    }, 100);
  });
}

// Initialize Supabase if not loaded
export async function ensureSupabaseLoaded(): Promise<void> {
  if (isSupabaseAvailable()) {
    return;
  }

  // Check if script is already in DOM but not yet initialized
  const existingScript = document.querySelector('script[src*="supabase"]');
  if (existingScript) {
    console.log('⏳ Supabase script found in DOM, waiting for initialization...');
    await waitForSupabaseGlobal();
    return;
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.0/dist/umd/supabase.min.js';
    script.onload = async () => {
      try {
        // Wait for the global to actually be populated
        await waitForSupabaseGlobal(3000);
        resolve();
      } catch (err) {
        reject(err);
      }
    };
    script.onerror = () => reject(new Error('Failed to load Supabase CDN script'));
    document.head.appendChild(script);
  });
}