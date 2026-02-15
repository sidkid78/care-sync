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
        if (!process.env.STRIPE_WEBHOOK_SECRET) {
            console.error('[STRIPE_WEBHOOK] Missing STRIPE_WEBHOOK_SECRET');
            return new NextResponse('Internal Error: Missing Webhook Secret', { status: 500 });
        }

        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error: any) {
        console.error(`[STRIPE_WEBHOOK] Signature verification failed: ${error.message}`);
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const supabase = await createClient();

    console.log(`[STRIPE_WEBHOOK] Received event: ${event.type}`, { id: event.id });

    if (event.type === 'checkout.session.completed') {
        const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
        ) as any;

        if (!session.metadata?.userId) {
            console.error('[STRIPE_WEBHOOK] User ID is missing from metadata', { sessionId: session.id });
            return new NextResponse('User ID is missing from metadata', { status: 400 });
        }

        console.log(`[STRIPE_WEBHOOK] Processing subscription for user: ${session.metadata.userId}`);

        const { error } = await supabase
            .from('profiles')
            .update({
                stripe_customer_id: session.customer as string,
                subscription_status: 'premium',
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq('id', session.metadata.userId);

        if (error) {
            console.error('[STRIPE_WEBHOOK] Database update failed:', error);
            return new NextResponse('Database update failed', { status: 500 });
        }

        console.log(`[STRIPE_WEBHOOK] Successfully updated subscription for user: ${session.metadata.userId}`);
    }

    if (event.type === 'invoice.payment_succeeded') {
        const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
        ) as any;

        // This event might not have metadata directly, so we might need to look up customer
        // But for simplicity/MVP, checkout.session.completed handles the initial upgrade
        // Ideally we'd look up the profile by stripe_customer_id here
        if (session.customer) {
            console.log(`[STRIPE_WEBHOOK] Processing invoice payment for customer: ${session.customer}`);
            const { error } = await supabase
                .from('profiles')
                .update({
                    subscription_status: 'premium',
                    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                })
                .eq('stripe_customer_id', session.customer as string);

            if (error) {
                console.error('[STRIPE_WEBHOOK] Database update failed for invoice:', error);
            } else {
                console.log(`[STRIPE_WEBHOOK] Successfully updated subscription from invoice for customer: ${session.customer}`);
            }
        }
    }

    return new NextResponse(null, { status: 200 });
}
