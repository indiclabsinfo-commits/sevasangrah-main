// Supabase Configuration - Zero Backend Architecture
// Uses VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from environment variables
// Falls back to hardcoded values if env vars are not set

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  projectName?: string;
}

// Get configuration from environment variables (set in .env or Vercel)
function getEnvConfig(): SupabaseConfig {
  const url = import.meta.env.VITE_SUPABASE_URL || 'https://plkbxjedbjpmbfrekmrr.supabase.co';
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsa2J4amVkYmpwbWJmcmVrbXJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5Njg5MDEsImV4cCI6MjA4NjU0NDkwMX0.6zlXnUoEmGoOPVJ8S6uAwWZX3yWbShlagDykjgm6BUM';

  // Extract project name from URL
  const projectMatch = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  const projectName = projectMatch ? projectMatch[1] : 'Unknown';

  return { url, anonKey, projectName };
}

// Get current configuration
export function getCurrentConfig(): SupabaseConfig {
  return getEnvConfig();
}

// Create Supabase client with current config (uses npm package directly)
export function createSupabaseClient(): SupabaseClient {
  const config = getCurrentConfig();

  console.log(`🔧 Using Supabase project: ${config.projectName} (${config.url})`);

  return createClient(config.url, config.anonKey);
}

// Check if Supabase is available (always true with npm package)
export function isSupabaseAvailable(): boolean {
  return true;
}

// No-op for backward compatibility (npm package is always available)
export async function ensureSupabaseLoaded(): Promise<void> {
  return;
}