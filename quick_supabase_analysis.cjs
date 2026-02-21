// Quick Supabase Analysis for Claude CLI
const https = require('https');
const fs = require('fs');

const supabaseUrl = 'https://plkbxjedbjpmbfrekmrr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsa2J4amVkYmpwbWJmcmVrbXJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5Njg5MDEsImV4cCI6MjA4NjU0NDkwMX0.6zlXnUoEmGoOPVJ8S6uAwWZX3yWbShlagDykjgm6BUM';

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'plkbxjedbjpmbfrekmrr.supabase.co',
      port: 443,
      path: path,
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const data = body ? JSON.parse(body) : null;
          resolve({
            status: res.statusCode,
            data: data,
            headers: res.headers
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            raw: body,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function analyzeTables() {
  console.log('🔍 Analyzing Supabase database structure...\n');
  
  // Common tables to check
  const tablesToCheck = [
    'patients', 'doctors', 'appointments', 'consultations',
    'prescriptions', 'bills', 'queue', 'departments',
    'medicines', 'tests', 'users', 'transactions',
    'visits', 'vitals', 'diagnosis', 'procedures'
  ];
  
  const foundTables = [];
  
  for (const table of tablesToCheck) {
    try {
      const response = await makeRequest(`/rest/v1/${table}?limit=1`);
      
      if (response.status === 200 && response.data && Array.isArray(response.data)) {
        // Get row count
        const countResponse = await makeRequest(`/rest/v1/${table}?select=id`);
        let rowCount = 0;
        
        if (countResponse.headers['content-range']) {
          const range = countResponse.headers['content-range'];
          const match = range.match(/\/(\d+)/);
          rowCount = match ? parseInt(match[1]) : 0;
        }
        
        const sample = response.data[0] || {};
        const columns = Object.keys(sample).map(key => ({
          name: key,
          type: typeof sample[key],
          sample: sample[key]
        }));
        
        foundTables.push({
          name: table,
          rowCount: rowCount,
          columns: columns,
          sample: sample
        });
        
        console.log(`✅ ${table}: ${columns.length} cols, ${rowCount} rows`);
      }
    } catch (error) {
      // Table doesn't exist or not accessible
    }
  }
  
  return foundTables;
}

async function generateReport() {
  console.log('='.repeat(80));
  console.log('🏥 SUPABASE DATABASE ANALYSIS REPORT');
  console.log('='.repeat(80));
  
  const tables = await analyzeTables();
  
  if (tables.length === 0) {
    console.log('\n❌ No tables found or unable to connect.');
    console.log('   The database might be empty or RLS is blocking access.');
    return;
  }
  
  console.log(`\n📊 Found ${tables.length} tables with data:\n`);
  
  // Create comprehensive report
  const report = {
    metadata: {
      supabaseUrl: supabaseUrl,
      analysisDate: new Date().toISOString(),
      totalTables: tables.length,
      totalRows: tables.reduce((sum, t) => sum + t.rowCount, 0)
    },
    tables: tables.map(t => ({
      name: t.name,
      rowCount: t.rowCount,
      columns: t.columns.map(c => ({
        name: c.name,
        type: c.type,
        sample: c.sample
      }))
    })),
    relationships: [],
    businessLogic: {}
  };
  
  // Infer relationships
  tables.forEach(table => {
    table.columns.forEach(col => {
      if (col.name.endsWith('_id') && typeof col.sample === 'string' && col.sample.length === 36) {
        const refTable = col.name.replace(/_id$/, '') + 's';
        report.relationships.push({
          from: table.name,
          fromColumn: col.name,
          to: refTable,
          type: 'foreign_key'
        });
      }
    });
  });
  
  // Save JSON report
  fs.writeFileSync('supabase_analysis_report.json', JSON.stringify(report, null, 2));
  console.log(`\n💾 Report saved: supabase_analysis_report.json`);
  
  // Generate SQL schema
  let sql = `-- Supabase Schema Analysis\n`;
  sql += `-- Generated: ${new Date().toISOString()}\n`;
  sql += `-- Total Tables: ${tables.length}\n\n`;
  
  tables.forEach(table => {
    sql += `-- ${table.name.toUpperCase()} (${table.rowCount} rows)\n`;
    sql += `CREATE TABLE IF NOT EXISTS ${table.name} (\n`;
    
    table.columns.forEach((col, i) => {
      const sqlType = mapToSqlType(col.type, col.sample);
      sql += `  ${col.name} ${sqlType}`;
      
      if (col.name === 'id' && typeof col.sample === 'string' && col.sample.length === 36) {
        sql += ' PRIMARY KEY DEFAULT gen_random_uuid()';
      } else if (col.sample !== null) {
        sql += ' NOT NULL';
      }
      
      if (i < table.columns.length - 1) sql += ',';
      sql += '\n';
    });
    
    sql += `);\n\n`;
  });
  
  fs.writeFileSync('supabase_schema.sql', sql);
  console.log(`💾 SQL schema saved: supabase_schema.sql`);
  
  // Generate TypeScript interfaces
  let ts = `// TypeScript Interfaces for Supabase\n`;
  ts += `// Generated: ${new Date().toISOString()}\n\n`;
  
  tables.forEach(table => {
    const interfaceName = table.name.charAt(0).toUpperCase() + table.name.slice(1);
    ts += `export interface ${interfaceName} {\n`;
    
    table.columns.forEach(col => {
      const tsType = mapToTsType(col.type, col.sample);
      const optional = col.sample === null ? '?' : '';
      ts += `  ${col.name}${optional}: ${tsType};\n`;
    });
    
    ts += `}\n\n`;
  });
  
  fs.writeFileSync('supabase_interfaces.ts', ts);
  console.log(`💾 TypeScript interfaces saved: supabase_interfaces.ts`);
  
  // Generate summary
  console.log('\n' + '='.repeat(80));
  console.log('📋 DATABASE SUMMARY');
  console.log('='.repeat(80));
  
  console.log(`\n🏥 Medical Tables:`);
  const medicalTables = tables.filter(t => 
    t.name.includes('patient') || 
    t.name.includes('doctor') || 
    t.name.includes('appoint') ||
    t.name.includes('consult') ||
    t.name.includes('prescrip')
  );
  
  medicalTables.forEach(t => {
    console.log(`  • ${t.name} (${t.rowCount} rows)`);
    t.columns.slice(0, 3).forEach(c => {
      console.log(`    - ${c.name}: ${c.type}${c.sample !== null ? ` = ${JSON.stringify(c.sample).substring(0, 30)}` : ''}`);
    });
    if (t.columns.length > 3) console.log(`    ... and ${t.columns.length - 3} more columns`);
  });
  
  console.log(`\n🔗 Relationships:`);
  if (report.relationships.length > 0) {
    report.relationships.forEach(rel => {
      console.log(`  • ${rel.from}.${rel.fromColumn} → ${rel.to}.id`);
    });
  } else {
    console.log(`  • No foreign key relationships detected`);
  }
  
  console.log(`\n🚀 Next steps for Claude CLI:`);
  console.log(`  1. Use supabase_interfaces.ts for type-safe development`);
  console.log(`  2. Refer to supabase_schema.sql for database structure`);
  console.log(`  3. Check supabase_analysis_report.json for complete analysis`);
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ ANALYSIS COMPLETE');
  console.log('='.repeat(80));
}

function mapToSqlType(jsType, sample) {
  if (typeof sample === 'string') {
    if (sample.match(/^\d{4}-\d{2}-\d{2}/)) return 'TIMESTAMP';
    if (sample.match(/^[0-9a-f]{8}-/)) return 'UUID';
    return 'TEXT';
  }
  if (typeof sample === 'number') return Number.isInteger(sample) ? 'INTEGER' : 'DECIMAL(10,2)';
  if (typeof sample === 'boolean') return 'BOOLEAN';
  if (sample === null) return 'TEXT';
  return 'TEXT';
}

function mapToTsType(jsType, sample) {
  if (typeof sample === 'string') {
    if (sample.match(/^\d{4}-\d{2}-\d{2}/)) return 'string | Date';
    if (sample.match(/^[0-9a-f]{8}-/)) return 'string';
    return 'string';
  }
  if (typeof sample === 'number') return 'number';
  if (typeof sample === 'boolean') return 'boolean';
  if (sample === null) return 'string | null';
  return 'any';
}

// Run analysis
generateReport().catch(console.error);