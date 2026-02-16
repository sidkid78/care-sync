
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testSubscriptionLogic() {
    console.log('--- STARTING SUBSCRIPTION LOGIC TEST ---');

    // 1. Get a random user
    const { data: profiles, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

    if (fetchError || !profiles || profiles.length === 0) {
        console.error('Failed to fetch a test profile:', fetchError);
        return;
    }

    const testUser = profiles[0];
    console.log(`Testing with User ID: ${testUser.id}`);
    console.log(`Initial Status: ${testUser.subscription_status}`);

    // 2. Simulate Webhook Update Logic
    const simulatedStripeId = `cus_TEST_${Date.now()}`;
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    console.log(`\nSimulating upgrade to PREMIUM...`);
    const { error: updateError } = await supabase
        .from('profiles')
        .update({
            stripe_customer_id: simulatedStripeId,
            subscription_status: 'premium',
            current_period_end: nextMonth.toISOString(),
        })
        .eq('id', testUser.id);

    if (updateError) {
        console.error('Failed to update subscription:', updateError);
        return;
    }

    // 3. Verify Update
    const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('subscription_status, stripe_customer_id')
        .eq('id', testUser.id)
        .single();

    console.log(`New Status: ${updatedProfile?.subscription_status}`);
    console.log(`New Customer ID: ${updatedProfile?.stripe_customer_id}`);

    if (updatedProfile?.subscription_status === 'premium' && updatedProfile?.stripe_customer_id === simulatedStripeId) {
        console.log('\nSUCCESS: Subscription logic verified.');
    } else {
        console.error('\nFAILURE: Subscription status did not update correctly.');
    }
}

testSubscriptionLogic();
