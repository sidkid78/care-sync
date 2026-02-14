import { createClient } from '@/utils/supabase/server';

export async function checkSubscription(userId: string): Promise<boolean> {
    const supabase = createClient();

    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('subscription_status')
            .eq('id', userId)
            .single();

        if (error || !profile) {
            console.error('Error fetching subscription status:', error);
            return false;
        }

        const isValid =
            profile.subscription_status === 'premium' ||
            profile.subscription_status === 'trialing';

        return isValid;
    } catch (error) {
        console.error('Unexpected error checking subscription:', error);
        return false;
    }
}
