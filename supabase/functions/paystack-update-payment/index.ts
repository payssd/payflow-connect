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

    // Get organization with Paystack subscription code
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('paystack_customer_id, paystack_subscription_code, email, name')
      .eq('id', organizationId)
      .single();

    if (orgError || !org) {
      console.error('Org fetch error:', orgError);
      return new Response(
        JSON.stringify({ error: 'Organization not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If no subscription exists, redirect to subscription page
    if (!org.paystack_subscription_code) {
      console.log('No active subscription found for org:', organizationId);
      return new Response(
        JSON.stringify({ 
          error: 'No active subscription found',
          redirect: '/settings/subscription'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate a new card update link using Paystack's subscription API
    console.log('Fetching subscription details for:', org.paystack_subscription_code);
    
    const subscriptionResponse = await fetch(
      `https://api.paystack.co/subscription/${org.paystack_subscription_code}`,
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
      `https://api.paystack.co/subscription/${org.paystack_subscription_code}/manage/link`,
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
          amount: 100, // Minimal amount for authorization (will be refunded or not charged)
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
