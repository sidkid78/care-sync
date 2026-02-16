
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import WebSocket from 'ws';

// Polyfill WebSocket for Node.js environment
global.WebSocket = WebSocket as any;

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function testRealtime() {
    console.log('--- STARTING REALTIME SYNC TEST ---');
    console.log('Listening for changes on "profiles" table...');

    const channel = supabase
        .channel('schema-db-changes')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'profiles',
            },
            (payload) => {
                console.log('\n--- REALTIME EVENT RECEIVED ---');
                console.log('Event Type:', payload.eventType);
                console.log('Payload:', payload.new);
                console.log('-------------------------------');
                process.exit(0); // Exit on success
            }
        )
        .subscribe((status) => {
            console.log(`Subscription status: ${status}`);
            if (status === 'SUBSCRIBED') {
                console.log('Ready! Please perform a profile update in another terminal (e.g. npx tsx scripts/test-subscription.ts) to verify.');
            }
        });
}

testRealtime();
