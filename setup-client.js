#!/usr/bin/env node
// Client Setup Script for Zero-Backend HMS
// Creates new client configuration and deployment

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Zero-Backend HMS - Client Setup\n');

async function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function main() {
  try {
    // Get client details
    const clientName = await ask('Client name (e.g., "magnus", "clientA"): ');
    const projectName = await ask('Project display name: ');
    const supabaseUrl = await ask('Supabase URL (https://xxx.supabase.co): ');
    const supabaseAnonKey = await ask('Supabase Anon Key: ');
    
    // Read current config
    const configPath = path.join(__dirname, 'src/config/supabaseConfig.ts');
    let configContent = fs.readFileSync(configPath, 'utf8');
    
    // Find the SUPABASE_CONFIGS object
    const configsMatch = configContent.match(/export const SUPABASE_CONFIGS: Record<string, SupabaseConfig> = ({[\s\S]*?});/);
    
    if (!configsMatch) {
      throw new Error('Could not find SUPABASE_CONFIGS in config file');
    }
    
    const configsStr = configsMatch[1];
    const newClientConfig = `\n  // ${projectName}\n  ${clientName}: {\n    url: '${supabaseUrl}',\n    anonKey: '${supabaseAnonKey}',\n    projectName: '${projectName}'\n  },`;
    
    // Insert new config before the closing brace
    const updatedConfigs = configsStr.replace(/\n\s*\}/, `${newClientConfig}\n  }`);
    configContent = configContent.replace(configsStr, updatedConfigs);
    
    // Write updated config
    fs.writeFileSync(configPath, configContent);
    
    console.log('\n✅ Client configuration added!');
    console.log('\n📋 Next steps:');
    console.log(`1. Deploy to Vercel: vercel`);
    console.log(`2. Access via: https://deploy.vercel.app?client=${clientName}`);
    console.log(`3. Or set as default by changing 'magnus' to '${clientName}' in getCurrentConfig()`);
    
    // Generate deployment command
    console.log('\n🚀 Deployment command:');
    console.log(`vercel --prod -n ${clientName}-hms`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

main();