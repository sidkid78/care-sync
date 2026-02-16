import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkStatus() {
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, email, subscription_status, stripe_customer_id');

    if (error) {
        console.error('Error fetching profiles:', error);
    } else {
        console.log('User Profiles:', profiles);
    }
}

checkStatus();
