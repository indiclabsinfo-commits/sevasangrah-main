
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    connectionString: 'postgresql://postgres:indicwings%4000@db.plkbxjedbjpmbfrekmrr.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

const expectedColumns = [
    'id', 'patient_id', 'prefix', 'first_name', 'last_name', 'age', 'gender', 'phone', 'email', 'address',
    'emergency_contact_name', 'emergency_contact_phone', 'medical_history', 'allergies', 'current_medications',
    'blood_group', 'notes', 'date_of_entry', 'date_of_birth', 'photo_url', 'patient_tag', 'abha_id',
    'aadhaar_number', 'assigned_doctor', 'assigned_department', 'has_reference', 'reference_details',
    'created_by', 'is_active', 'queue_no', 'queue_status', 'queue_date', 'has_pending_appointment'
];

async function checkAndAddColumns() {
    try {
        const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'patients'");
        const existingColumns = res.rows.map(r => r.column_name);
        const missing = expectedColumns.filter(c => !existingColumns.includes(c));

        console.log('Existing columns:', existingColumns.length);
        console.log('Missing columns:', missing);

        if (missing.length > 0) {
            const alterations = missing.map(col => {
                let type = 'VARCHAR(255)';
                if (['date_of_birth', 'date_of_entry', 'queue_date'].includes(col)) type = 'DATE';
                if (['is_active', 'has_reference', 'has_pending_appointment'].includes(col)) type = 'BOOLEAN';
                if (['queue_no'].includes(col)) type = 'INTEGER';

                return `ADD COLUMN IF NOT EXISTS "${col}" ${type}`;
            });

            const alterQuery = `ALTER TABLE patients ${alterations.join(', ')};`;
            console.log('Executing migration:', alterQuery);

            await pool.query(alterQuery);
            console.log('✅ Successfully added all missing columns!');
        } else {
            console.log('✅ Database schema is already up to date!');
        }
    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        pool.end();
    }
}

checkAndAddColumns();
