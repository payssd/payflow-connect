-- Create employees table
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_number TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  department TEXT,
  job_title TEXT,
  employment_type TEXT DEFAULT 'full-time' CHECK (employment_type IN ('full-time', 'part-time', 'contract', 'intern')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
  hire_date DATE,
  date_of_birth DATE,
  national_id TEXT,
  tax_pin TEXT,
  bank_name TEXT,
  bank_account_number TEXT,
  bank_branch TEXT,
  base_salary DECIMAL(12, 2) DEFAULT 0,
  currency TEXT DEFAULT 'KES',
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'Kenya',
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  notes TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, email),
  UNIQUE(organization_id, employee_number)
);

-- Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- RLS policies using existing org membership functions
CREATE POLICY "Members can view employees in their org"
ON public.employees FOR SELECT
USING (organization_id IN (SELECT get_user_org_ids(auth.uid())));

CREATE POLICY "Owners and admins can insert employees"
ON public.employees FOR INSERT
WITH CHECK (get_org_role(auth.uid(), organization_id) IN ('owner', 'admin'));

CREATE POLICY "Owners and admins can update employees"
ON public.employees FOR UPDATE
USING (get_org_role(auth.uid(), organization_id) IN ('owner', 'admin'));

CREATE POLICY "Owners can delete employees"
ON public.employees FOR DELETE
USING (get_org_role(auth.uid(), organization_id) = 'owner');

-- Trigger for updated_at
CREATE TRIGGER update_employees_updated_at
BEFORE UPDATE ON public.employees
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Create index for common queries
CREATE INDEX idx_employees_organization_id ON public.employees(organization_id);
CREATE INDEX idx_employees_status ON public.employees(status);
CREATE INDEX idx_employees_department ON public.employees(department);