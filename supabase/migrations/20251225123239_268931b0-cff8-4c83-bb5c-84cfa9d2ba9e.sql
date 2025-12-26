-- Create payment_gateway_configs table for storing API credentials
CREATE TABLE public.payment_gateway_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  is_live_mode BOOLEAN NOT NULL DEFAULT false,
  public_key TEXT,
  secret_key_hint TEXT, -- Only store last 4 chars for display
  webhook_secret_hint TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, provider)
);

-- Enable RLS
ALTER TABLE public.payment_gateway_configs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Members can view gateway configs" ON public.payment_gateway_configs
FOR SELECT USING (
  organization_id IN (SELECT get_user_org_ids(auth.uid()))
);

CREATE POLICY "Owners and admins can manage gateway configs" ON public.payment_gateway_configs
FOR INSERT WITH CHECK (
  get_org_role(auth.uid(), organization_id) IN ('owner', 'admin')
);

CREATE POLICY "Owners and admins can update gateway configs" ON public.payment_gateway_configs
FOR UPDATE USING (
  get_org_role(auth.uid(), organization_id) IN ('owner', 'admin')
);

CREATE POLICY "Owners can delete gateway configs" ON public.payment_gateway_configs
FOR DELETE USING (
  get_org_role(auth.uid(), organization_id) = 'owner'
);

-- Add trigger for updated_at
CREATE TRIGGER update_payment_gateway_configs_updated_at
BEFORE UPDATE ON public.payment_gateway_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();