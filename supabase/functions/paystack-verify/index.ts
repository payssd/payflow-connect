import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      console.error('PAYSTACK_SECRET_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Payment service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get reference from query params
    const url = new URL(req.url);
    const reference = url.searchParams.get('reference');

    if (!reference) {
      return new Response(
        JSON.stringify({ error: 'Missing reference parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Verifying transaction reference:', reference);

    // Verify transaction with Paystack
    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
      },
    });

    const verifyData = await verifyResponse.json();
    console.log('Verification response:', verifyData);

    if (!verifyData.status) {
      return new Response(
        JSON.stringify({ error: verifyData.message || 'Verification failed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { status, metadata, plan, authorization, customer } = verifyData.data;
    const organizationId = metadata?.organization_id;

    if (status !== 'success') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          status,
          message: 'Transaction was not successful' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update organization subscription if we have the org ID
    if (organizationId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Determine plan from metadata or plan object
      const planCode = metadata?.plan_code || plan?.plan_code || '';
      
      // Map Paystack plan codes to subscription plans
      const planCodeMapping: Record<string, string> = {
        'PLN_04faggvrzaef1nv': 'starter',
        'PLN_h812vb0ofzt1n20': 'growth',
      };
      
      let subscriptionPlan = planCodeMapping[planCode] || null;
      
      // Fallback: check if plan name contains keywords
      if (!subscriptionPlan && planCode) {
        if (planCode.toLowerCase().includes('starter')) subscriptionPlan = 'starter';
        else if (planCode.toLowerCase().includes('growth')) subscriptionPlan = 'growth';
        else if (planCode.toLowerCase().includes('pro')) subscriptionPlan = 'pro';
      }

      console.log('Updating organization:', organizationId, 'with plan:', subscriptionPlan);

      // Try to get the subscription code from Paystack customer subscriptions
      let subscriptionCode = null;
      if (customer?.customer_code) {
        try {
          const subsResponse = await fetch(
            `https://api.paystack.co/subscription?customer=${customer.customer_code}`,
            {
              headers: {
                'Authorization': `Bearer ${paystackSecretKey}`,
              },
            }
          );
          const subsData = await subsResponse.json();
          console.log('Customer subscriptions:', JSON.stringify(subsData));
          
          if (subsData.status && subsData.data?.length > 0) {
            // Get the most recent active subscription
            const activeSub = subsData.data.find((s: any) => s.status === 'active') || subsData.data[0];
            subscriptionCode = activeSub?.subscription_code;
            console.log('Found subscription code:', subscriptionCode);
          }
        } catch (e) {
          console.error('Error fetching subscriptions:', e);
        }
      }

      // If we have an authorization, we might need to create a subscription
      const authorizationCode = authorization?.authorization_code;
      console.log('Authorization code:', authorizationCode);

      const updateData: any = {
        subscription_status: 'active',
        subscription_plan: subscriptionPlan,
        subscription_started_at: new Date().toISOString(),
        subscription_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      // Save subscription code if found
      if (subscriptionCode) {
        updateData.paystack_subscription_code = subscriptionCode;
      }

      // Save customer ID if available
      if (customer?.customer_code) {
        updateData.paystack_customer_id = customer.customer_code;
      }

      const { error: updateError } = await supabase
        .from('organizations')
        .update(updateData)
        .eq('id', organizationId);

      if (updateError) {
        console.error('Failed to update organization:', updateError);
      } else {
        console.log('Successfully updated organization subscription');
      }

      // Send activation email notification
      const { data: orgData } = await supabase
        .from('organizations')
        .select('name, email')
        .eq('id', organizationId)
        .single();

      if (orgData?.email) {
        const nextBillingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        try {
          await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-subscription-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
            },
            body: JSON.stringify({
              email: orgData.email,
              organizationName: orgData.name,
              type: 'activated',
              planName: subscriptionPlan ? subscriptionPlan.charAt(0).toUpperCase() + subscriptionPlan.slice(1) : 'Subscription',
              amount: verifyData.data.amount / 100,
              nextBillingDate,
            }),
          });
          console.log('Activation email sent');
        } catch (emailError) {
          console.error('Failed to send activation email:', emailError);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: 'success',
        organization_id: organizationId,
        plan: metadata?.plan_code || plan?.plan_code,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Verification error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
