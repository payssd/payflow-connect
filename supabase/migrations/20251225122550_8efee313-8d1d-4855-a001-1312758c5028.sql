-- Create audit_logs table for tracking critical actions
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for faster queries
CREATE INDEX idx_audit_logs_org_id ON public.audit_logs(organization_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only owners and admins can view audit logs
CREATE POLICY "Owners and admins can view audit logs" ON public.audit_logs
FOR SELECT USING (
  get_org_role(auth.uid(), organization_id) IN ('owner', 'admin')
);

-- Only system can insert (via service role or edge functions)
CREATE POLICY "Service can insert audit logs" ON public.audit_logs
FOR INSERT WITH CHECK (true);

-- Create invoice_payments table for tracking payments
CREATE TABLE public.invoice_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  payment_reference TEXT,
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'completed',
  gateway_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;

-- Members can view payments in their org
CREATE POLICY "Members can view invoice payments" ON public.invoice_payments
FOR SELECT USING (
  invoice_id IN (
    SELECT id FROM public.invoices 
    WHERE organization_id IN (SELECT get_user_org_ids(auth.uid()))
  )
);

-- Owners and admins can insert payments
CREATE POLICY "Owners and admins can insert payments" ON public.invoice_payments
FOR INSERT WITH CHECK (
  invoice_id IN (
    SELECT id FROM public.invoices 
    WHERE get_org_role(auth.uid(), organization_id) IN ('owner', 'admin')
  )
);

-- Add public_token to invoices for sharing
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS public_token TEXT UNIQUE;

-- Create function to generate public token
CREATE OR REPLACE FUNCTION generate_invoice_public_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.public_token IS NULL THEN
    NEW.public_token := encode(gen_random_bytes(16), 'hex');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-generating public token
DROP TRIGGER IF EXISTS set_invoice_public_token ON public.invoices;
CREATE TRIGGER set_invoice_public_token
BEFORE INSERT ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION generate_invoice_public_token();