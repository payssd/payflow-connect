-- Create subscription_payments table for billing history
CREATE TABLE public.subscription_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'completed',
  payment_reference TEXT,
  payment_method TEXT,
  plan_name TEXT,
  billing_period TEXT,
  paystack_reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

-- Policy for members to view their org's billing history
CREATE POLICY "Members can view subscription payments"
ON public.subscription_payments
FOR SELECT
USING (organization_id IN (SELECT get_user_org_ids(auth.uid())));

-- Policy for service/edge functions to insert payments
CREATE POLICY "Service can insert subscription payments"
ON public.subscription_payments
FOR INSERT
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_subscription_payments_org ON public.subscription_payments(organization_id);
CREATE INDEX idx_subscription_payments_created ON public.subscription_payments(created_at DESC);