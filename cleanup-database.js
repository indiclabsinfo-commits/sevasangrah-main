// Quick Database Cleanup Script
// Run this with: node cleanup-database.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://plkbxjedbjpmbfrekmrr.supabase.co';
const supabaseKey = 'sb_publishable_Uxb_oT9hSn5KbDdwykK19A_UvKLpBZT';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupDatabase() {
    console.log('🧹 Starting database cleanup...\n');

    try {
        // Count before
        const { count: beforeCount } = await supabase
            .from('patients')
            .select('*', { count: 'exact', head: true });

        console.log(`📊 Current patient count: ${beforeCount}`);

        // Delete all patients (will cascade to related tables)
        const { error } = await supabase
            .from('patients')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

        if (error) {
            console.error('❌ Error:', error.message);
            return;
        }

        // Count after
        const { count: afterCount } = await supabase
            .from('patients')
            .select('*', { count: 'exact', head: true });

        console.log(`\n✅ Cleanup complete!`);
        console.log(`📊 Patient count after cleanup: ${afterCount}`);
        console.log(`🗑️  Deleted ${beforeCount} patient records\n`);

        // Reset beds to AVAILABLE
        await supabase
            .from('beds')
            .update({ status: 'AVAILABLE' })
            .eq('status', 'OCCUPIED');

        console.log('✅ All beds reset to AVAILABLE');
        console.log('\n🎉 Database is now clean and ready for fresh data!');

    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

cleanupDatabase();
