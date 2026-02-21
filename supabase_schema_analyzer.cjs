// Supabase Schema Analyzer for Claude Code CLI
const https = require('https');
const fs = require('fs');

const supabaseUrl = 'https://plkbxjedbjpmbfrekmrr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsa2J4amVkYmpwbWJmcmVrbXJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5Njg5MDEsImV4cCI6MjA4NjU0NDkwMX0.6zlXnUoEmGoOPVJ8S6uAwWZX3yWbShlagDykjgm6BUM';

function makeRequest(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'plkbxjedbjpmbfrekmrr.supabase.co',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: body ? JSON.parse(body) : null,
            headers: res.headers
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body,
            headers: res.headers,
            error: e.message
          });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function getAllTables() {
  console.log('🔍 Fetching all tables...');
  
  // Try to get tables from information_schema
  const response = await makeRequest('/rest/v1/information_schema.tables?select=table_name,table_schema&table_schema=eq.public');
  
  if (response.status === 200 && response.data) {
    return response.data.map(t => t.table_name);
  }
  
  // Fallback: Try to guess tables from common patterns
  console.log('⚠️ Could not fetch tables from information_schema, trying common table names...');
  
  const commonTables = [
    'patients', 'doctors', 'appointments', 'consultations', 
    'prescriptions', 'bills', 'queue', 'departments',
    'medicines', 'tests', 'procedures', 'users'
  ];
  
  const foundTables = [];
  
  for (const table of commonTables) {
    try {
      const test = await makeRequest(`/rest/v1/${table}?limit=1`);
      if (test.status === 200) {
        foundTables.push(table);
        console.log(`   ✅ Found table: ${table}`);
      }
    } catch (e) {
      // Table doesn't exist or not accessible
    }
  }
  
  return foundTables;
}

async function getTableDetails(tableName) {
  try {
    // Get sample data to infer structure
    const sampleResponse = await makeRequest(`/rest/v1/${tableName}?limit=1`);
    
    if (sampleResponse.status !== 200 || !sampleResponse.data || sampleResponse.data.length === 0) {
      return null;
    }
    
    const sampleRow = sampleResponse.data[0];
    const columns = [];
    
    // Infer columns from sample data
    Object.keys(sampleRow).forEach(colName => {
      const value = sampleRow[colName];
      let type = 'unknown';
      
      if (typeof value === 'string') {
        if (value.match(/^\d{4}-\d{2}-\d{2}/)) {
          type = 'date/timestamp';
        } else if (value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          type = 'uuid';
        } else {
          type = 'text';
        }
      } else if (typeof value === 'number') {
        type = Number.isInteger(value) ? 'integer' : 'decimal';
      } else if (typeof value === 'boolean') {
        type = 'boolean';
      } else if (value === null) {
        type = 'nullable';
      } else if (typeof value === 'object') {
        type = 'json';
      }
      
      columns.push({
        name: colName,
        type: type,
        sampleValue: value
      });
    });
    
    // Get row count
    const countResponse = await makeRequest(`/rest/v1/${tableName}?select=id`);
    let rowCount = 0;
    
    if (countResponse.headers['content-range']) {
      const range = countResponse.headers['content-range'];
      const match = range.match(/\/(\d+)/);
      rowCount = match ? parseInt(match[1]) : 0;
    }
    
    return {
      name: tableName,
      columns: columns,
      rowCount: rowCount,
      sampleData: sampleRow
    };
    
  } catch (error) {
    console.error(`   ❌ Error analyzing table ${tableName}:`, error.message);
    return null;
  }
}

async function analyzeDatabase() {
  console.log('='.repeat(80));
  console.log('🏥 SUPABASE DATABASE ANALYSIS FOR CLAUDE CODE CLI');
  console.log('='.repeat(80));
  console.log('\n📊 Analyzing database structure...\n');
  
  const tables = await getAllTables();
  
  if (tables.length === 0) {
    console.log('❌ No tables found or unable to connect to Supabase.');
    console.log('   Check:');
    console.log('   1. Supabase URL and API key');
    console.log('   2. Internet connection');
    console.log('   3. RLS policies (might block anonymous access)');
    return;
  }
  
  console.log(`✅ Found ${tables.length} tables:\n`);
  
  const tableDetails = [];
  for (const table of tables) {
    console.log(`🔍 Analyzing: ${table}`);
    const details = await getTableDetails(table);
    if (details) {
      tableDetails.push(details);
      console.log(`   ✓ ${details.columns.length} columns, ${details.rowCount} rows`);
    }
  }
  
  // Generate comprehensive report
  const report = {
    metadata: {
      supabaseUrl: supabaseUrl,
      analysisDate: new Date().toISOString(),
      totalTables: tableDetails.length,
      totalRows: tableDetails.reduce((sum, table) => sum + table.rowCount, 0)
    },
    tables: tableDetails.map(table => ({
      name: table.name,
      rowCount: table.rowCount,
      columns: table.columns.map(col => ({
        name: col.name,
        type: col.type,
        sampleValue: col.sampleValue
      })),
      sampleRow: table.sampleData
    })),
    businessLogic: {
      patientFlow: inferPatientFlow(tableDetails),
      relationships: inferRelationships(tableDetails)
    }
  };
  
  // Save JSON report
  fs.writeFileSync('supabase_complete_analysis.json', JSON.stringify(report, null, 2));
  console.log(`\n💾 Complete analysis saved to: supabase_complete_analysis.json`);
  
  // Generate SQL schema
  generateSqlSchema(tableDetails);
  
  // Generate TypeScript interfaces
  generateTypeScriptInterfaces(tableDetails);
  
  // Generate Claude CLI context
  generateClaudeCliContext(report);
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ ANALYSIS COMPLETE - FILES GENERATED:');
  console.log('='.repeat(80));
  console.log('\n1. 📄 supabase_complete_analysis.json - Full database analysis');
  console.log('2. 🗃️  supabase_schema.sql - SQL schema definition');
  console.log('3. 📝 supabase_types.ts - TypeScript interfaces');
  console.log('4. 🤖 claude_cli_context.md - Claude CLI integration guide');
  console.log('\n🚀 Ready for Claude Code CLI development!');
}

function inferPatientFlow(tables) {
  const flow = [];
  
  // Look for patient-related tables
  const patientTables = tables.filter(t => 
    t.name.includes('patient') || 
    t.name.includes('appointment') ||
    t.name.includes('consultation') ||
    t.name.includes('queue')
  );
  
  patientTables.forEach(table => {
    const steps = [];
    
    // Check for status columns
    const statusCol = table.columns.find(col => 
      col.name.includes('status') || 
      col.name.includes('state')
    );
    
    if (statusCol && statusCol.sampleValue) {
      steps.push(`Status: ${statusCol.sampleValue}`);
    }
    
    // Check for date columns
    const dateCols = table.columns.filter(col => 
      col.type.includes('date') || 
      col.type.includes('timestamp')
    );
    
    dateCols.forEach(col => {
      if (col.sampleValue) {
        steps.push(`${col.name}: ${col.sampleValue}`);
      }
    });
    
    flow.push({
      table: table.name,
      description: `Handles ${table.name.replace(/_/g, ' ')}`,
      steps: steps
    });
  });
  
  return flow;
}

function inferRelationships(tables) {
  const relationships = [];
  
  // Look for foreign key patterns (columns ending with _id)
  tables.forEach(table => {
    table.columns.forEach(col => {
      if (col.name.endsWith('_id') && col.type === 'uuid') {
        const referencedTable = col.name.replace(/_id$/, '') + 's';
        relationships.push({
          fromTable: table.name,
          fromColumn: col.name,
          toTable: referencedTable,
          relationship: 'many-to-one'
        });
      }
    });
  });
  
  return relationships;
}

function generateSqlSchema(tables) {
  let sql = `-- Supabase Schema Definition\n`;
  sql += `-- Generated: ${new Date().toISOString()}\n`;
  sql += `-- Total Tables: ${tables.length}\n\n`;
  
  tables.forEach(table => {
    sql += `-- Table: ${table.name} (${table.rowCount} rows)\n`;
    sql += `CREATE TABLE IF NOT EXISTS ${table.name} (\n`;
    
    table.columns.forEach((col, index) => {
      const sqlType = mapToSqlType(col.type);
      sql += `  ${col.name} ${sqlType}`;
      
      // Add NOT NULL if sample value is not null
      if (col.sampleValue !== null && col.sampleValue !== undefined) {
        sql += ' NOT NULL';
      }
      
      if (col.name === 'id' && col.type === 'uuid') {
        sql += ' PRIMARY KEY DEFAULT gen_random_uuid()';
      }
      
      if (index < table.columns.length - 1) sql += ',';
      sql += '\n';
    });
    
    sql += `);\n\n`;
    
    // Add sample insert
    if (table.sampleData) {
      sql += `-- Sample data for ${table.name}\n`;
      const columns = Object.keys(table.sampleData).join(', ');
      const values = Object.values(table.sampleData).map(v => {
        if (v === null) return 'NULL';
        if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
        if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
        return v;
      }).join(', ');
      
      sql += `-- INSERT INTO ${table.name} (${columns}) VALUES (${values});\n\n`;
    }
  });
  
  fs.writeFileSync('supabase_schema.sql', sql);
}

function mapToSqlType(jsType) {
  const typeMap = {
    'uuid': 'UUID',
    'text': 'TEXT',
    'string': 'VARCHAR(255)',
    'integer': 'INTEGER',
    'decimal': 'DECIMAL(10,2)',
    'boolean': 'BOOLEAN',
    'date/timestamp': 'TIMESTAMP',
    'json': 'JSONB',
    'nullable': 'TEXT',
    'unknown': 'TEXT'
  };
  
  return typeMap[jsType] || 'TEXT';
}

function generateTypeScriptInterfaces(tables) {
  let ts = `// TypeScript Interfaces for Supabase Schema\n`;
  ts += `// Generated: ${new Date().toISOString()}\n\n`;
  
  tables.forEach(table => {
    const interfaceName = table.name.charAt(0).toUpperCase() + table.name.slice(1);
    ts += `export interface ${interfaceName} {\n`;
    
    table.columns.forEach(col => {
      const tsType = mapToTsType(col.type, col.sampleValue);
      const optional = col.sampleValue === null || col.sampleValue === undefined ? '?' : '';
      ts += `  ${col.name}${optional}: ${tsType};\n`;
    });
    
    ts += `}\n\n`;
  });
  
  fs.writeFileSync('supabase_types.ts', ts);
}

function mapToTsType(jsType, sampleValue) {
  const typeMap = {
    'uuid': 'string',
    'text': 'string',
    'string': 'string',
    'integer': 'number',
    'decimal': 'number',
    'boolean': 'boolean',
    'date/timestamp': 'Date | string',
    'json': 'any',
    'nullable': 'string | null',
    'unknown': 'any'
  };
  
  return typeMap[jsType] || 'any';
}

function generateClaudeCliContext(report) {
  let md = `# Claude Code CLI - Supabase Context\n\n`;
  md += `## Database Overview\n`;
  md += `- **URL**: ${report.metadata.supabaseUrl}\n`;
  md += `- **Tables**: ${report.metadata.totalTables}\n`;
  md += `- **Total Rows**: ${report.metadata.totalRows}\n`;
  md += `- **Analysis Date**: ${report.metadata.analysisDate}\n\n`;
  
  md += `## Table Structure\n\n`;
  
  report.tables.forEach(table => {
    md += `### ${table.name} (${table.rowCount} rows)\n\n`;
    md += `| Column | Type | Sample Value |\n`;
    md += `|--------|------|--------------|\n`;
    
    table.columns.forEach(col => {
      const sample = col.sampleValue !== null && col.sampleValue !== undefined 
        ? JSON.stringify(col.sampleValue).substring(0, 50)
        : 'NULL';
      md += `| ${col.name} | ${col.type} | ${sample} |\n`;
    });
    
    md += `\n`;
  });
  
  md += `## Business Logic\n\n`;
  
  if (report.businessLogic.patientFlow.length > 0) {
    md += `### Patient Flow\n\n`;
    report.businessLogic.patientFlow.forEach(flow => {
      md += `- **${flow.table}**: ${flow.description}\n`;
      flow.steps.forEach(step => {
        md += `  - ${step}\n`;
      });
      md += `\n`;
    });
  }
  
  if (report.businessLogic.relationships.length > 0) {
    md += `### Database Relationships\n\n`;
    report.businessLogic.relationships.forEach(rel => {
      md += `- \`${rel.fromTable}.${rel.fromColumn}\` → \`${rel.toTable}.id\` (${rel.relationship})\n`;
    });
    md += `\n`;
  }
  
  md += `## API Usage Examples\n\n`;
  md += `### Fetch Patients\n`;
  md += `\`\`\`javascript\n`;
  md += `const response = await fetch('${supabaseUrl}/rest/v1/patients?select=*', {\n`;
  md += `  headers: {\n`;
  md += `    'apikey': '${supabaseKey}',\n`;
  md += `    'Authorization': 'Bearer ${supabaseKey}'\n`;
  md += `  }\n`;
  md += `});\n`;
  md += `\`\`\`\n\n`;
  
  md += `### Insert New Patient\n`;
  md += `\`\`\`javascript\n`;
  md += `const newPatient = {\n`;
  md += `  name: 'John Doe',\n`;
  md += `  phone: '9876543210',\n`;
  md += `  age: 30,\n`;
  md += `  gender: 'male'\n`;
  md += `};\n\n`;
  md += `const response = await fetch('${supabaseUrl}/rest/v1/patients', {\n`;
  md += `  method: 'POST',\n`;
  md += `  headers: {\n`;
  md += `    'apikey': '${supabaseKey}',\n`;
  md += `    'Authorization': 'Bearer ${supabaseKey}',\n`;
  md += `    'Content-Type': 'application/json',\n`;
  md += `    'Prefer': 'return=representation'\n`;
  md += `  },\n`;
  md += `  body: JSON.stringify(newPatient)\n`;
  md += `});\n`;
  md += `\`\`\`\n\n`;
  
  md += `## Common Queries for Claude CLI\n\n`;
  md += `1. **Get all active patients**: \`SELECT * FROM patients WHERE is_active = true\`\n`;
  md += `2. **Today's appointments**: \`SELECT * FROM appointments WHERE date::date = CURRENT_DATE\`\n`;
  md += `3. **Doctor schedule**: \`SELECT * FROM doctors WHERE is_active = true