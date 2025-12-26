-- Create payroll_runs table
CREATE TABLE public.payroll_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  run_number TEXT NOT NULL,
  name TEXT NOT NULL,
  pay_period_start DATE NOT NULL,
  pay_period_end DATE NOT NULL,
  payment_date DATE NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'approved', 'paid', 'cancelled')),
  total_gross DECIMAL(14, 2) DEFAULT 0,
  total_paye DECIMAL(14, 2) DEFAULT 0,
  total_nhif DECIMAL(14, 2) DEFAULT 0,
  total_nssf DECIMAL(14, 2) DEFAULT 0,
  total_deductions DECIMAL(14, 2) DEFAULT 0,
  total_net DECIMAL(14, 2) DEFAULT 0,
  employee_count INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'KES',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, run_number)
);

-- Create payroll_items table (individual employee payslips)
CREATE TABLE public.payroll_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payroll_run_id UUID NOT NULL REFERENCES public.payroll_runs(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  basic_salary DECIMAL(12, 2) NOT NULL,
  housing_allowance DECIMAL(12, 2) DEFAULT 0,
  transport_allowance DECIMAL(12, 2) DEFAULT 0,
  other_allowances DECIMAL(12, 2) DEFAULT 0,
  gross_pay DECIMAL(12, 2) NOT NULL,
  paye DECIMAL(12, 2) DEFAULT 0,
  nhif DECIMAL(12, 2) DEFAULT 0,
  nssf DECIMAL(12, 2) DEFAULT 0,
  other_deductions DECIMAL(12, 2) DEFAULT 0,
  total_deductions DECIMAL(12, 2) DEFAULT 0,
  net_pay DECIMAL(12, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'paid')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(payroll_run_id, employee_id)
);

-- Enable RLS
ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_items ENABLE ROW LEVEL SECURITY;

-- Payroll Runs RLS
CREATE POLICY "Members can view payroll runs in their org"
ON public.payroll_runs FOR SELECT
USING (organization_id IN (SELECT get_user_org_ids(auth.uid())));

CREATE POLICY "Owners and admins can insert payroll runs"
ON public.payroll_runs FOR INSERT
WITH CHECK (get_org_role(auth.uid(), organization_id) IN ('owner', 'admin'));

CREATE POLICY "Owners and admins can update payroll runs"
ON public.payroll_runs FOR UPDATE
USING (get_org_role(auth.uid(), organization_id) IN ('owner', 'admin'));

CREATE POLICY "Owners can delete payroll runs"
ON public.payroll_runs FOR DELETE
USING (get_org_role(auth.uid(), organization_id) = 'owner');

-- Payroll Items RLS
CREATE POLICY "Members can view payroll items"
ON public.payroll_items FOR SELECT
USING (payroll_run_id IN (
  SELECT id FROM public.payroll_runs WHERE organization_id IN (SELECT get_user_org_ids(auth.uid()))
));

CREATE POLICY "Owners and admins can insert payroll items"
ON public.payroll_items FOR INSERT
WITH CHECK (payroll_run_id IN (
  SELECT id FROM public.payroll_runs WHERE get_org_role(auth.uid(), organization_id) IN ('owner', 'admin')
));

CREATE POLICY "Owners and admins can update payroll items"
ON public.payroll_items FOR UPDATE
USING (payroll_run_id IN (
  SELECT id FROM public.payroll_runs WHERE get_org_role(auth.uid(), organization_id) IN ('owner', 'admin')
));

CREATE POLICY "Owners and admins can delete payroll items"
ON public.payroll_items FOR DELETE
USING (payroll_run_id IN (
  SELECT id FROM public.payroll_runs WHERE get_org_role(auth.uid(), organization_id) IN ('owner', 'admin')
));

-- Triggers
CREATE TRIGGER update_payroll_runs_updated_at
BEFORE UPDATE ON public.payroll_runs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Indexes
CREATE INDEX idx_payroll_runs_organization_id ON public.payroll_runs(organization_id);
CREATE INDEX idx_payroll_runs_status ON public.payroll_runs(status);
CREATE INDEX idx_payroll_items_payroll_run_id ON public.payroll_items(payroll_run_id);
CREATE INDEX idx_payroll_items_employee_id ON public.payroll_items(employee_id);