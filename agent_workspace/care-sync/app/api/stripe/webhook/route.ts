import { stripe } from '@/lib/stripe';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
    const body = await req.text();
    const signature = (await headers()).get('Stripe-Signature') as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error: any) {
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const supabase = createClient();

    if (event.type === 'checkout.session.completed') {
        const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
        );

        if (!session.metadata?.userId) {
            return new NextResponse('User ID is missing from metadata', { status: 400 });
        }

        await supabase
            .from('profiles')
            .update({
                stripe_customer_id: session.customer as string,
                subscription_status: 'premium',
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq('id', session.metadata.userId);
    }

    if (event.type === 'invoice.payment_succeeded') {
        const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
        );

        // This event might not have metadata directly, so we might need to look up customer
        // But for simplicity/MVP, checkout.session.completed handles the initial upgrade
        // Ideally we'd look up the profile by stripe_customer_id here
        await supabase
            .from('profiles')
            .update({
                subscription_status: 'premium',
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq('stripe_customer_id', session.customer as string);
    }

    return new NextResponse(null, { status: 200 });
}
