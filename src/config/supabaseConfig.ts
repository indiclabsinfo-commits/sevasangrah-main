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
  const { createClient } = window.supabase;
  const config = getCurrentConfig();
  
  console.log(`🔧 Using Supabase project: ${config.projectName || 'Unknown'}`);
  
  return createClient(config.url, config.anonKey);
}

// Check if Supabase is available
export function isSupabaseAvailable(): boolean {
  return typeof window.supabase?.createClient === 'function';
}

// Initialize Supabase if not loaded
export function ensureSupabaseLoaded(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isSupabaseAvailable()) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.0/dist/umd/supabase.min.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Supabase'));
    document.head.appendChild(script);
  });
}