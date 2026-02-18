
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://plkbxjedbjpmbfrekmrr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsa2J4amVkYmpwbWJmcmVrbXJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5Njg5MDEsImV4cCI6MjA4NjU0NDkwMX0.6zlXnUoEmGoOPVJ8S6uAwWZX3yWbShlagDykjgm6BUM';

const supabase = createClient(supabaseUrl, supabaseKey);

const DOCTORS_DATA = [
    { name: 'DR. HEMANT KHAJJA', department: 'ORTHOPAEDIC', consultation_fee: 500 },
    { name: 'DR. HEMANT', department: 'ORTHO', consultation_fee: 500 },
    { name: 'DR. LALITA SUWALKA', department: 'DIETICIAN', consultation_fee: 300 },
    { name: 'DR. MILIND KIRIT AKHANI', department: 'GASTRO', consultation_fee: 800 },
    { name: 'DR MEETU BABLE', department: 'GYN.', consultation_fee: 500 },
    { name: 'DR. AMIT PATANVADIYA', department: 'NEUROLOGY', consultation_fee: 1000 },
    { name: 'DR. KISHAN PATEL', department: 'UROLOGY', consultation_fee: 800 },
    { name: 'DR. PARTH SHAH', department: 'SURGICAL ONCOLOGY', consultation_fee: 1200 },
    { name: 'DR.RAJEEDP GUPTA', department: 'MEDICAL ONCOLOGY', consultation_fee: 1200 },
    { name: 'DR. KULDDEP VALA', department: 'NEUROSURGERY', consultation_fee: 1500 },
    { name: 'DR. KURNAL PATEL', department: 'UROLOGY', consultation_fee: 800 },
    { name: 'DR. SAURABH GUPTA', department: 'ENDOCRINOLOGY', consultation_fee: 700 },
    { name: 'DR. BATUL PEEPAWALA', department: 'GENERAL PHYSICIAN', consultation_fee: 400 },
    { name: 'DR. POONAM JAIN', department: 'PHYSIOTHERAPY', consultation_fee: 300 }
];

async function seedDoctors() {
    console.log("Checking existing doctors...");
    const { count, error: countError } = await supabase
        .from('doctors')
        .select('*', { count: 'exact', head: true });

    if (countError) {
        console.error("Error checking doctors:", countError);
        return;
    }

    if (count > 0) {
        console.log(`Table already has ${count} doctors. Skipping seed to avoid duplicates.`);
        // Optional: truncate and re-seed if you want to force update
        return;
    }

    console.log(`Seeding ${DOCTORS_DATA.length} doctors...`);

    // Transform data to match schema typical fields (first_name, last_name split)
    const doctorsToInsert = DOCTORS_DATA.map(doc => {
        // Simple name splitting
        const nameParts = doc.name.replace('DR.', '').replace('DR ', '').trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ');

        return {
            first_name: firstName,
            last_name: lastName,
            department: doc.department,
            // consultation_fee: doc.consultation_fee, // Column unlikely to exist based on error
            specialization: doc.department, // Assuming specialization maps to department for now
            is_active: true,
            hospital_id: '550e8400-e29b-41d4-a716-446655440000', // Default hospital ID
            role: 'DOCTOR'
        };
    });

    const { data, error } = await supabase
        .from('doctors')
        .insert(doctorsToInsert)
        .select();

    if (error) {
        console.error("Error inserting doctors:", error);
    } else {
        console.log(`Successfully inserted ${data.length} doctors.`);
    }
}

seedDoctors();
