-- Create expenses table for expense tracking
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'KES',
  category TEXT NOT NULL,
  vendor TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_url TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Members can view expenses in their org"
ON public.expenses
FOR SELECT
TO authenticated
USING (organization_id IN (SELECT get_user_org_ids(auth.uid())));

CREATE POLICY "Owners and admins can insert expenses"
ON public.expenses
FOR INSERT
TO authenticated
WITH CHECK (get_org_role(auth.uid(), organization_id) = ANY (ARRAY['owner'::org_role, 'admin'::org_role]));

CREATE POLICY "Owners and admins can update expenses"
ON public.expenses
FOR UPDATE
TO authenticated
USING (get_org_role(auth.uid(), organization_id) = ANY (ARRAY['owner'::org_role, 'admin'::org_role]));

CREATE POLICY "Owners can delete expenses"
ON public.expenses
FOR DELETE
TO authenticated
USING (get_org_role(auth.uid(), organization_id) = 'owner'::org_role);

-- Updated at trigger
CREATE TRIGGER update_expenses_updated_at
BEFORE UPDATE ON public.expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Create payment_settings table for storing gateway configurations
CREATE TABLE public.payment_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  mpesa_enabled BOOLEAN DEFAULT false,
  mpesa_business_shortcode TEXT,
  mpesa_account_name TEXT,
  bank_enabled BOOLEAN DEFAULT false,
  bank_name TEXT,
  bank_account_name TEXT,
  bank_account_number TEXT,
  bank_branch TEXT,
  bank_swift_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for payment_settings
CREATE POLICY "Members can view their org payment settings"
ON public.payment_settings
FOR SELECT
TO authenticated
USING (organization_id IN (SELECT get_user_org_ids(auth.uid())));

CREATE POLICY "Owners and admins can insert payment settings"
ON public.payment_settings
FOR INSERT
TO authenticated
WITH CHECK (get_org_role(auth.uid(), organization_id) = ANY (ARRAY['owner'::org_role, 'admin'::org_role]));

CREATE POLICY "Owners and admins can update payment settings"
ON public.payment_settings
FOR UPDATE
TO authenticated
USING (get_org_role(auth.uid(), organization_id) = ANY (ARRAY['owner'::org_role, 'admin'::org_role]));

-- Updated at trigger
CREATE TRIGGER update_payment_settings_updated_at
BEFORE UPDATE ON public.payment_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();
