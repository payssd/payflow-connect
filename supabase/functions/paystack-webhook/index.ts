import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from 'https://deno.land/std@0.177.0/node/crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-paystack-signature',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookSecret = Deno.env.get('PAYSTACK_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error('PAYSTACK_WEBHOOK_SECRET not configured');
      return new Response('Webhook secret not configured', { status: 500 });
    }

    // Get raw body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get('x-paystack-signature');

    if (!signature) {
      console.error('Missing Paystack signature');
      return new Response('Missing signature', { status: 400 });
    }

    // Verify webhook signature
    const hash = createHmac('sha512', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (hash !== signature) {
      console.error('Invalid webhook signature');
      return new Response('Invalid signature', { status: 401 });
    }

    const event = JSON.parse(rawBody);
    console.log('Paystack webhook event:', event.event, 'data:', JSON.stringify(event.data));

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle different event types
    switch (event.event) {
      case 'subscription.create': {
        const { subscription_code, customer, plan, status, next_payment_date } = event.data;
        const organizationId = event.data.metadata?.organization_id;

        if (!organizationId) {
          console.error('No organization_id in subscription metadata');
          break;
        }

        console.log('Processing subscription.create for org:', organizationId);

        // Map Paystack status to our status
        let subscriptionStatus = 'active';
        if (status === 'non-renewing' || status === 'cancelled') {
          subscriptionStatus = 'cancelled';
        } else if (status === 'attention') {
          subscriptionStatus = 'past_due';
        }

        // Map plan code to our plan enum
        const planCode = plan?.plan_code?.toLowerCase() || '';
        let subscriptionPlan = null;
        if (planCode.includes('starter')) subscriptionPlan = 'starter';
        else if (planCode.includes('growth')) subscriptionPlan = 'growth';
        else if (planCode.includes('pro')) subscriptionPlan = 'pro';

        const { error: updateError } = await supabase
          .from('organizations')
          .update({
            paystack_subscription_code: subscription_code,
            paystack_customer_id: customer?.customer_code,
            subscription_status: subscriptionStatus,
            subscription_plan: subscriptionPlan,
            subscription_started_at: new Date().toISOString(),
            subscription_ends_at: next_payment_date ? new Date(next_payment_date).toISOString() : null,
          })
          .eq('id', organizationId);

        if (updateError) {
          console.error('Failed to update organization subscription:', updateError);
        } else {
          console.log('Successfully activated subscription for org:', organizationId);
        }
        break;
      }

      case 'subscription.disable':
      case 'subscription.not_renew': {
        const subscriptionCode = event.data.subscription_code;
        
        console.log('Processing subscription disable/not_renew:', subscriptionCode);

        const { error: updateError } = await supabase
          .from('organizations')
          .update({
            subscription_status: 'cancelled',
          })
          .eq('paystack_subscription_code', subscriptionCode);

        if (updateError) {
          console.error('Failed to update subscription status:', updateError);
        }
        break;
      }

      case 'charge.success': {
        // Payment successful - could be subscription renewal
        const { reference, metadata, plan, amount, currency } = event.data;
        const organizationId = metadata?.organization_id;

        console.log('Processing charge.success, reference:', reference, 'org:', organizationId);

        if (organizationId) {
          // Determine plan name from plan code or metadata
          let planName = 'Unknown';
          if (plan?.name) {
            planName = plan.name;
          } else if (metadata?.plan) {
            planName = metadata.plan;
          }

          // Insert payment record
          const { error: paymentError } = await supabase
            .from('subscription_payments')
            .insert({
              organization_id: organizationId,
              amount: amount / 100, // Paystack sends amount in kobo/cents
              currency: currency || 'USD',
              status: 'completed',
              payment_reference: reference,
              paystack_reference: reference,
              plan_name: planName,
              payment_method: event.data.channel || 'card',
              billing_period: 'monthly',
            });

          if (paymentError) {
            console.error('Failed to insert payment record:', paymentError);
          } else {
            console.log('Recorded payment for org:', organizationId);
          }

          // Update organization subscription status if this is a plan payment
          if (plan) {
            const { error: updateError } = await supabase
              .from('organizations')
              .update({
                subscription_status: 'active',
                subscription_ends_at: event.data.paid_at 
                  ? new Date(new Date(event.data.paid_at).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
                  : null,
              })
              .eq('id', organizationId);

            if (updateError) {
              console.error('Failed to update organization after charge:', updateError);
            } else {
              console.log('Updated subscription after successful charge for org:', organizationId);
            }
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const subscriptionCode = event.data.subscription?.subscription_code;
        
        console.log('Processing invoice.payment_failed:', subscriptionCode);

        if (subscriptionCode) {
          const { error: updateError } = await supabase
            .from('organizations')
            .update({
              subscription_status: 'past_due',
            })
            .eq('paystack_subscription_code', subscriptionCode);

          if (updateError) {
            console.error('Failed to update subscription to past_due:', updateError);
          }
        }
        break;
      }

      default:
        console.log('Unhandled Paystack event:', event.event);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response('Internal server error', { status: 500 });
  }
});
