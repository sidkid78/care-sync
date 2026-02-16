import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ... imports ...

async function checkStatus() {
    console.log('--- FETCHING PROFILES ---');
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, subscription_status, stripe_customer_id');

    if (profileError) {
        console.error('Error fetching profiles:', profileError);
    } else {
        console.table(profiles);

        // PERFORM A TEST UPDATE TO TRIGGER AUDIT LOG
        if (profiles && profiles.length > 0) {
            const testUserId = profiles[0].id;
            console.log(`\n--- PERFORMING TEST UPDATE ON USER [${testUserId}] ---`);
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', testUserId);

            if (updateError) {
                console.error('Error updating profile:', updateError);
            } else {
                console.log('Profile updated successfully. Waiting for trigger...');
                // Wait a moment for trigger to fire
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }

    console.log('\n--- FETCHING RECENT AUDIT LOGS (HIPAA CHECK) ---');
    const { data: logs, error: logError } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (logError) {
        console.error('Error fetching audit logs:', logError);
    } else {
        if (logs && logs.length > 0) {
            console.table(logs.map(log => ({
                table: log.table_name,
                operation: log.operation,
                record_id: log.record_id,
                time: log.created_at
            })));
        } else {
            console.log('No audit logs found yet. (This is expected if no data changes have occurred since migration)');
        }
    }
}

checkStatus();
