// Test the uhidService from the actual code
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://plkbxjedbjpmbfrekmrr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsa2J4amVkYmpwbWJmcmVrbXJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5Njg5MDEsImV4cCI6MjA4NjU0NDkwMX0.6zlXnUoEmGoOPVJ8S6uAwWZX3yWbShlagDykjgm6BUM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Simulate the uhidService from azureApiService.ts
const uhidService = {
  async getConfig(hospitalId) {
    const { data, error } = await supabase
      .from('uhid_config')
      .select('*')
      .eq('hospital_id', hospitalId || '550e8400-e29b-41d4-a716-446655440000')
      .single();
    
    if (error) {
      console.error('Error fetching UHID config:', error);
      throw error;
    }
    
    return data;
  },

  async generateUhid(hospitalId) {
    const { data, error } = await supabase.rpc('generate_uhid', {
      p_hospital_id: hospitalId || '550e8400-e29b-41d4-a716-446655440000'
    });
    
    if (error) {
      console.error('Error generating UHID:', error);
      throw error;
    }
    
    return { uhid: data };
  }
};

async function test() {
  console.log('=== Testing uhidService directly ===\n');
  
  try {
    // Test 1: Get config
    console.log('1. Testing getConfig...');
    const config = await uhidService.getConfig();
    console.log('✅ Config:', config);
    
    // Test 2: Generate UHID
    console.log('\n2. Testing generateUhid...');
    const result = await uhidService.generateUhid();
    console.log('✅ Generated UHID:', result.uhid);
    
    // Test 3: Check current sequence
    console.log('\n3. Current sequence should be:', config.current_sequence);
    console.log('   Next UHID should be:', `MH-2026-${(config.current_sequence + 1).toString().padStart(6, '0')}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

test();