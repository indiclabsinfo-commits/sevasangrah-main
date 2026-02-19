// Supabase Configuration - Zero Backend Architecture
// Uses npm package @supabase/supabase-js directly (no CDN needed)

import { createClient, SupabaseClient } from '@supabase/supabase-js';

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
    url: 'https://plkbxjedbjpmbfrekmrr.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsa2J4amVkYmpwbWJmcmVrbXJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5Njg5MDEsImV4cCI6MjA4NjU0NDkwMX0.6zlXnUoEmGoOPVJ8S6uAwWZX3yWbShlagDykjgm6BUM',
    projectName: 'Demo Client A'
  },

  // Demo Client B  
  demoB: {
    url: 'https://plkbxjedbjpmbfrekmrr.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsa2J4amVkYmpwbWJmcmVrbXJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5Njg5MDEsImV4cCI6MjA4NjU0NDkwMX0.6zlXnUoEmGoOPVJ8S6uAwWZX3yWbShlagDykjgm6BUM',
    projectName: 'Demo Client B'
  }
};

// Get current configuration based on URL parameter
export function getCurrentConfig(): SupabaseConfig {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const client = urlParams.get('client') || 'magnus';
    return SUPABASE_CONFIGS[client] || SUPABASE_CONFIGS.magnus;
  }
  return SUPABASE_CONFIGS.magnus;
}

// Create Supabase client with current config (uses npm package directly)
export function createSupabaseClient(): SupabaseClient {
  const config = getCurrentConfig();

  console.log(`🔧 Using Supabase project: ${config.projectName || 'Unknown'}`);

  return createClient(config.url, config.anonKey);
}

// Check if Supabase is available (always true with npm package)
export function isSupabaseAvailable(): boolean {
  return true;
}

// No-op for backward compatibility (npm package is always available)
export async function ensureSupabaseLoaded(): Promise<void> {
  // No-op: @supabase/supabase-js is bundled via npm, no CDN loading needed
  return;
}