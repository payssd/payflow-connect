-- Create expense_budgets table for category budget limits
CREATE TABLE public.expense_budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  monthly_limit NUMERIC NOT NULL,
  alert_threshold NUMERIC NOT NULL DEFAULT 80, -- percentage (e.g., 80 = alert at 80% of budget)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, category)
);

-- Enable RLS
ALTER TABLE public.expense_budgets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Members can view budgets in their org"
ON public.expense_budgets
FOR SELECT
USING (organization_id IN (SELECT get_user_org_ids(auth.uid())));

CREATE POLICY "Owners and admins can insert budgets"
ON public.expense_budgets
FOR INSERT
WITH CHECK (get_org_role(auth.uid(), organization_id) = ANY (ARRAY['owner'::org_role, 'admin'::org_role]));

CREATE POLICY "Owners and admins can update budgets"
ON public.expense_budgets
FOR UPDATE
USING (get_org_role(auth.uid(), organization_id) = ANY (ARRAY['owner'::org_role, 'admin'::org_role]));

CREATE POLICY "Owners and admins can delete budgets"
ON public.expense_budgets
FOR DELETE
USING (get_org_role(auth.uid(), organization_id) = ANY (ARRAY['owner'::org_role, 'admin'::org_role]));

-- Add trigger for updated_at
CREATE TRIGGER update_expense_budgets_updated_at
BEFORE UPDATE ON public.expense_budgets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();