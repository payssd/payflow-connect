import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UpdatePaymentRequest {
  organizationId: string;
}

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

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('Auth result - user:', user?.id, 'error:', userError?.message);
    
    if (userError || !user) {
      console.error('Auth validation failed:', userError?.message || 'No user returned');
      return new Response(
        JSON.stringify({ error: 'Invalid or expired session. Please log in again.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: UpdatePaymentRequest = await req.json();
    const { organizationId } = body;

    if (!organizationId) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: organizationId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user is owner/admin of the organization
    const { data: membership, error: memberError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (memberError || !membership) {
      console.error('Membership error:', memberError);
      return new Response(
        JSON.stringify({ error: 'Organization not found or access denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (membership.role !== 'owner' && membership.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Only owners and admins can manage payment methods' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get organization with Paystack details
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('paystack_customer_id, paystack_subscription_code, email, name, subscription_status, subscription_plan')
      .eq('id', organizationId)
      .single();

    if (orgError || !org) {
      console.error('Org fetch error:', orgError);
      return new Response(
        JSON.stringify({ error: 'Organization not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If subscription code missing, try to recover it from Paystack
    let subscriptionCode: string | null = org.paystack_subscription_code;
    let customerCode: string | null = org.paystack_customer_id;

    const fetchCustomerCodeByEmail = async (): Promise<string | null> => {
      try {
        console.log('Looking up Paystack customer by email:', org.email);
        const res = await fetch(`https://api.paystack.co/customer?email=${encodeURIComponent(org.email)}`, {
          headers: {
            'Authorization': `Bearer ${paystackSecretKey}`,
            'Content-Type': 'application/json',
          },
        });
        const json = await res.json();
        console.log('Customer lookup response:', JSON.stringify(json));
        if (json?.status && json.data?.customer_code) return json.data.customer_code;
        return null;
      } catch (e) {
        console.error('Customer lookup failed:', e);
        return null;
      }
    };

    const fetchActiveSubscriptionCode = async (custCode: string): Promise<string | null> => {
      try {
        console.log('Looking up subscriptions by customer:', custCode);
        const subsResponse = await fetch(`https://api.paystack.co/subscription?customer=${custCode}`, {
          headers: {
            'Authorization': `Bearer ${paystackSecretKey}`,
            'Content-Type': 'application/json',
          },
        });
        const subsData = await subsResponse.json();
        console.log('Customer subscriptions lookup:', JSON.stringify(subsData));

        if (subsData?.status && Array.isArray(subsData.data) && subsData.data.length > 0) {
          const activeSub = subsData.data.find((s: any) => s.status === 'active') || subsData.data[0];
          return activeSub?.subscription_code || null;
        }

        return null;
      } catch (e) {
        console.error('Subscription lookup failed:', e);
        return null;
      }
    };

    // Try existing customer code first
    if (!subscriptionCode && customerCode) {
      subscriptionCode = await fetchActiveSubscriptionCode(customerCode);
    }

    // If not found, try to locate the correct customer by email (in case we stored the wrong customer_code)
    if (!subscriptionCode) {
      const emailCustomer = await fetchCustomerCodeByEmail();
      if (emailCustomer) {
        customerCode = emailCustomer;
        subscriptionCode = await fetchActiveSubscriptionCode(emailCustomer);

        // Best-effort persist corrected customer/subscription codes
        const updatePatch: any = { paystack_customer_id: emailCustomer };
        if (subscriptionCode) updatePatch.paystack_subscription_code = subscriptionCode;
        const { error: saveError } = await supabase
          .from('organizations')
          .update(updatePatch)
          .eq('id', organizationId);
        if (saveError) console.error('Failed to persist recovered Paystack identifiers:', saveError);
      }
    }

    // If still no subscription code, DO NOT redirect to a paid checkout for active subscribers
    if (!subscriptionCode) {
      console.log('No subscription code available for org:', organizationId);

      if (org.subscription_status === 'active') {
        // Return 200 so the client doesn't surface a generic "non-2xx" error.
        return new Response(
          JSON.stringify({
            error: 'We could not find your Paystack subscription to generate a card-update link. To update your card, we may need to run a small card verification first.',
            needs_payment_setup: true,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // For non-active users, allow card setup (Paystack may show a small verification charge)
      const callbackUrl = `${req.headers.get('origin')}/subscription/callback?action=add_card`;
      const authResponse = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: org.email,
          amount: 1, // minimal possible charge (1 cent) for card verification
          callback_url: callbackUrl,
          channels: ['card'],
          metadata: {
            organization_id: organizationId,
            action: 'add_payment_method',
          },
        }),
      });

      const authData = await authResponse.json();
      console.log('Card authorization response:', JSON.stringify(authData));

      if (!authData.status) {
        return new Response(
          JSON.stringify({ error: authData.message || 'Failed to initialize card setup' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          link: authData.data.authorization_url,
          type: 'add_card',
          message: 'Paystack may show a small verification charge during card setup.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate a new card update link using Paystack's subscription API
    console.log('Fetching subscription details for:', subscriptionCode);
    
    const subscriptionResponse = await fetch(
      `https://api.paystack.co/subscription/${subscriptionCode}`,
      {
        headers: {
          'Authorization': `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const subscriptionData = await subscriptionResponse.json();
    console.log('Subscription fetch response:', JSON.stringify(subscriptionData));

    if (!subscriptionData.status) {
      // Subscription not found or invalid - allow user to re-subscribe
      return new Response(
        JSON.stringify({ 
          error: 'Subscription not found in payment system. Please re-subscribe.',
          redirect: '/settings/subscription'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get manage subscription link
    const manageResponse = await fetch(
      `https://api.paystack.co/subscription/${subscriptionCode}/manage/link`,
      {
        headers: {
          'Authorization': `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const manageData = await manageResponse.json();
    console.log('Manage link response:', JSON.stringify(manageData));

    if (!manageData.status) {
      // Fallback: Create a new authorization URL for card update
      console.log('Manage link failed, creating authorization URL');
      
      const callbackUrl = `${req.headers.get('origin')}/subscription/callback?action=update_card`;
      
      const authResponse = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: org.email,
          amount: 1, // minimal possible charge (1 cent) for card authorization
          callback_url: callbackUrl,
          channels: ['card'],
          metadata: {
            organization_id: organizationId,
            action: 'update_payment_method',
          },
        }),
      });

      const authData = await authResponse.json();
      console.log('Auth URL response:', JSON.stringify(authData));

      if (!authData.status) {
        return new Response(
          JSON.stringify({ error: authData.message || 'Failed to generate update link' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          link: authData.data.authorization_url,
          type: 'authorization',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        link: manageData.data.link,
        type: 'manage',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Update payment method error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
