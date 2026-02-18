
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://plkbxjedbjpmbfrekmrr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsa2J4amVkYmpwbWJmcmVrbXJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5Njg5MDEsImV4cCI6MjA4NjU0NDkwMX0.6zlXnUoEmGoOPVJ8S6uAwWZX3yWbShlagDykjgm6BUM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDoctors() {
    console.log("Connecting to Supabase...");

    const { data: doctors, error } = await supabase
        .from('doctors')
        .select('*');

    if (error) {
        console.error("Error fetching doctors:", error);
        return;
    }

    console.log(`Found ${doctors.length} doctors.`);
    doctors.forEach(d => {
        console.log(`- [${d.id}] ${d.first_name} ${d.last_name} (${d.department})`);
    });

    if (doctors.length === 0) {
        console.log("\nWARNING: No doctors found. Queue insertion logic will fail if it relies on this table.");
    }
}

checkDoctors();
