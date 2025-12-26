-- =====================================================
-- PAYFLOW COMPLETE DATABASE SCHEMA MIGRATION
-- Run this in your new Supabase project's SQL Editor
-- Go to: Supabase Dashboard > SQL Editor > New Query
-- =====================================================

-- =====================================================
-- 1. ORGANIZATIONS TABLE (Core multi-tenant structure)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  country TEXT NOT NULL DEFAULT 'KE',
  tax_pin TEXT,
  logo_url TEXT,
  subscription_status TEXT NOT NULL DEFAULT 'trialing',
  subscription_plan TEXT,
  subscription_started_at TIMESTAMPTZ,
  subscription_ends_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  paystack_customer_id TEXT,
  paystack_subscription_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. PROFILES TABLE (User profiles linked to auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. ORGANIZATION MEMBERS TABLE (Links users to orgs)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. CUSTOMERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  tax_pin TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. EMPLOYEES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_number TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  national_id TEXT,
  kra_pin TEXT,
  nhif_number TEXT,
  nssf_number TEXT,
  department TEXT,
  job_title TEXT,
  hire_date DATE,
  termination_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  base_salary NUMERIC NOT NULL DEFAULT 0,
  housing_allowance NUMERIC DEFAULT 0,
  transport_allowance NUMERIC DEFAULT 0,
  other_allowances NUMERIC DEFAULT 0,
  payment_method TEXT,
  bank_name TEXT,
  bank_branch TEXT,
  bank_account TEXT,
  mobile_money_provider TEXT,
  mobile_money_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. INVOICES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  currency TEXT DEFAULT 'KES',
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_rate NUMERIC DEFAULT 16,
  tax_amount NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  terms TEXT,
  public_token TEXT UNIQUE,
  payment_reference TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7. INVOICE ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 8. PAYROLL RUNS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.payroll_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  run_number TEXT NOT NULL,
  name TEXT NOT NULL,
  pay_period_start DATE NOT NULL,
  pay_period_end DATE NOT NULL,
  payment_date DATE,
  status TEXT NOT NULL DEFAULT 'draft',
  employee_count INTEGER DEFAULT 0,
  total_gross NUMERIC DEFAULT 0,
  total_paye NUMERIC DEFAULT 0,
  total_nhif NUMERIC DEFAULT 0,
  total_nssf NUMERIC DEFAULT 0,
  total_housing_levy NUMERIC DEFAULT 0,
  total_deductions NUMERIC DEFAULT 0,
  total_net NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 9. PAYROLL ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.payroll_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_run_id UUID NOT NULL REFERENCES public.payroll_runs(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  basic_salary NUMERIC NOT NULL DEFAULT 0,
  housing_allowance NUMERIC DEFAULT 0,
  transport_allowance NUMERIC DEFAULT 0,
  other_allowances NUMERIC DEFAULT 0,
  gross_pay NUMERIC NOT NULL DEFAULT 0,
  paye NUMERIC DEFAULT 0,
  nhif NUMERIC DEFAULT 0,
  nssf NUMERIC DEFAULT 0,
  housing_levy NUMERIC DEFAULT 0,
  other_deductions NUMERIC DEFAULT 0,
  total_deductions NUMERIC DEFAULT 0,
  net_pay NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.payroll_items ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 10. EXPENSES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'KES',
  category TEXT NOT NULL,
  vendor TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_url TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 11. EXPENSE BUDGETS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.expense_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  monthly_limit NUMERIC NOT NULL,
  alert_threshold NUMERIC NOT NULL DEFAULT 80,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, category)
);

ALTER TABLE public.expense_budgets ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 12. PAYMENT GATEWAY CONFIGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.payment_gateway_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  gateway TEXT NOT NULL,
  config JSONB,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, gateway)
);

ALTER TABLE public.payment_gateway_configs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 13. TEAM INVITATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  token TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(token)
);

ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTION: Check if user is member of organization
-- =====================================================
CREATE OR REPLACE FUNCTION public.is_org_member(org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
  );
$$;

-- =====================================================
-- HELPER FUNCTION: Check if user is admin/owner of organization
-- =====================================================
CREATE OR REPLACE FUNCTION public.is_org_admin(org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  );
$$;

-- =====================================================
-- RLS POLICIES: PROFILES
-- =====================================================
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- RLS POLICIES: ORGANIZATIONS
-- =====================================================
CREATE POLICY "Members can view their organizations"
  ON public.organizations FOR SELECT
  USING (public.is_org_member(id));

CREATE POLICY "Anyone can create organizations"
  ON public.organizations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update organizations"
  ON public.organizations FOR UPDATE
  USING (public.is_org_admin(id));

-- =====================================================
-- RLS POLICIES: ORGANIZATION MEMBERS
-- =====================================================
CREATE POLICY "Members can view organization members"
  ON public.organization_members FOR SELECT
  USING (public.is_org_member(organization_id));

CREATE POLICY "Admins can add organization members"
  ON public.organization_members FOR INSERT
  WITH CHECK (public.is_org_admin(organization_id) OR user_id = auth.uid());

CREATE POLICY "Admins can update organization members"
  ON public.organization_members FOR UPDATE
  USING (public.is_org_admin(organization_id));

CREATE POLICY "Admins can delete organization members"
  ON public.organization_members FOR DELETE
  USING (public.is_org_admin(organization_id));

-- =====================================================
-- RLS POLICIES: CUSTOMERS
-- =====================================================
CREATE POLICY "Members can view customers"
  ON public.customers FOR SELECT
  USING (public.is_org_member(organization_id));

CREATE POLICY "Members can create customers"
  ON public.customers FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Members can update customers"
  ON public.customers FOR UPDATE
  USING (public.is_org_member(organization_id));

CREATE POLICY "Admins can delete customers"
  ON public.customers FOR DELETE
  USING (public.is_org_admin(organization_id));

-- =====================================================
-- RLS POLICIES: EMPLOYEES
-- =====================================================
CREATE POLICY "Members can view employees"
  ON public.employees FOR SELECT
  USING (public.is_org_member(organization_id));

CREATE POLICY "Admins can create employees"
  ON public.employees FOR INSERT
  WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY "Admins can update employees"
  ON public.employees FOR UPDATE
  USING (public.is_org_admin(organization_id));

CREATE POLICY "Admins can delete employees"
  ON public.employees FOR DELETE
  USING (public.is_org_admin(organization_id));

-- =====================================================
-- RLS POLICIES: INVOICES
-- =====================================================
CREATE POLICY "Members can view invoices"
  ON public.invoices FOR SELECT
  USING (public.is_org_member(organization_id));

CREATE POLICY "Members can create invoices"
  ON public.invoices FOR INSERT
  WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "Members can update invoices"
  ON public.invoices FOR UPDATE
  USING (public.is_org_member(organization_id));

CREATE POLICY "Admins can delete invoices"
  ON public.invoices FOR DELETE
  USING (public.is_org_admin(organization_id));

CREATE POLICY "Public can view invoices by token"
  ON public.invoices FOR SELECT
  USING (public_token IS NOT NULL);

-- =====================================================
-- RLS POLICIES: INVOICE ITEMS
-- =====================================================
CREATE POLICY "Members can view invoice items"
  ON public.invoice_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND public.is_org_member(invoices.organization_id)
    )
  );

CREATE POLICY "Members can create invoice items"
  ON public.invoice_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND public.is_org_member(invoices.organization_id)
    )
  );

CREATE POLICY "Members can update invoice items"
  ON public.invoice_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND public.is_org_member(invoices.organization_id)
    )
  );

CREATE POLICY "Admins can delete invoice items"
  ON public.invoice_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND public.is_org_admin(invoices.organization_id)
    )
  );

CREATE POLICY "Public can view invoice items by token"
  ON public.invoice_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.public_token IS NOT NULL
    )
  );

-- =====================================================
-- RLS POLICIES: PAYROLL RUNS
-- =====================================================
CREATE POLICY "Members can view payroll runs"
  ON public.payroll_runs FOR SELECT
  USING (public.is_org_member(organization_id));

CREATE POLICY "Admins can create payroll runs"
  ON public.payroll_runs FOR INSERT
  WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY "Admins can update payroll runs"
  ON public.payroll_runs FOR UPDATE
  USING (public.is_org_admin(organization_id));

CREATE POLICY "Admins can delete payroll runs"
  ON public.payroll_runs FOR DELETE
  USING (public.is_org_admin(organization_id));

-- =====================================================
-- RLS POLICIES: PAYROLL ITEMS
-- =====================================================
CREATE POLICY "Members can view payroll items"
  ON public.payroll_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.payroll_runs
      WHERE payroll_runs.id = payroll_items.payroll_run_id
      AND public.is_org_member(payroll_runs.organization_id)
    )
  );

CREATE POLICY "Admins can create payroll items"
  ON public.payroll_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.payroll_runs
      WHERE payroll_runs.id = payroll_items.payroll_run_id
      AND public.is_org_admin(payroll_runs.organization_id)
    )
  );

CREATE POLICY "Admins can update payroll items"
  ON public.payroll_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.payroll_runs
      WHERE payroll_runs.id = payroll_items.payroll_run_id
      AND public.is_org_admin(payroll_runs.organization_id)
    )
  );

CREATE POLICY "Admins can delete payroll items"
  ON public.payroll_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.payroll_runs
      WHERE payroll_runs.id = payroll_items.payroll_run_id
      AND public.is_org_admin(payroll_runs.organization_id)
    )
  );

-- =====================================================
-- RLS POLICIES: EXPENSES
-- =====================================================
CREATE POLICY "Members can view expenses"
  ON public.expenses FOR SELECT
  USING (public.is_org_member(organization_id));

CREATE POLICY "Members can create expenses"
  ON public.expenses FOR INSERT
  WITH CHECK (public.is_org_member(organization_id) AND created_by = auth.uid());

CREATE POLICY "Creators can update own expenses"
  ON public.expenses FOR UPDATE
  USING (created_by = auth.uid() OR public.is_org_admin(organization_id));

CREATE POLICY "Admins can delete expenses"
  ON public.expenses FOR DELETE
  USING (public.is_org_admin(organization_id));

-- =====================================================
-- RLS POLICIES: EXPENSE BUDGETS
-- =====================================================
CREATE POLICY "Members can view expense budgets"
  ON public.expense_budgets FOR SELECT
  USING (public.is_org_member(organization_id));

CREATE POLICY "Admins can create expense budgets"
  ON public.expense_budgets FOR INSERT
  WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY "Admins can update expense budgets"
  ON public.expense_budgets FOR UPDATE
  USING (public.is_org_admin(organization_id));

CREATE POLICY "Admins can delete expense budgets"
  ON public.expense_budgets FOR DELETE
  USING (public.is_org_admin(organization_id));

-- =====================================================
-- RLS POLICIES: PAYMENT GATEWAY CONFIGS
-- =====================================================
CREATE POLICY "Members can view gateway configs"
  ON public.payment_gateway_configs FOR SELECT
  USING (public.is_org_member(organization_id));

CREATE POLICY "Admins can create gateway configs"
  ON public.payment_gateway_configs FOR INSERT
  WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY "Admins can update gateway configs"
  ON public.payment_gateway_configs FOR UPDATE
  USING (public.is_org_admin(organization_id));

CREATE POLICY "Admins can delete gateway configs"
  ON public.payment_gateway_configs FOR DELETE
  USING (public.is_org_admin(organization_id));

-- =====================================================
-- RLS POLICIES: TEAM INVITATIONS
-- =====================================================
CREATE POLICY "Members can view team invitations"
  ON public.team_invitations FOR SELECT
  USING (public.is_org_member(organization_id) OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Admins can create team invitations"
  ON public.team_invitations FOR INSERT
  WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY "Admins can update team invitations"
  ON public.team_invitations FOR UPDATE
  USING (public.is_org_admin(organization_id) OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Admins can delete team invitations"
  ON public.team_invitations FOR DELETE
  USING (public.is_org_admin(organization_id));

-- =====================================================
-- TRIGGER: Auto-create profile on user signup
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- TRIGGER: Update updated_at timestamps
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payroll_runs_updated_at
  BEFORE UPDATE ON public.payroll_runs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expense_budgets_updated_at
  BEFORE UPDATE ON public.expense_budgets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_gateway_configs_updated_at
  BEFORE UPDATE ON public.payment_gateway_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- INDEXES for better query performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_customers_org_id ON public.customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_employees_org_id ON public.employees(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_org_id ON public.invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_public_token ON public.invoices(public_token);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_org_id ON public.payroll_runs(organization_id);
CREATE INDEX IF NOT EXISTS idx_payroll_items_run_id ON public.payroll_items(payroll_run_id);
CREATE INDEX IF NOT EXISTS idx_payroll_items_employee_id ON public.payroll_items(employee_id);
CREATE INDEX IF NOT EXISTS idx_expenses_org_id ON public.expenses(organization_id);
CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON public.expenses(created_by);
CREATE INDEX IF NOT EXISTS idx_expense_budgets_org_id ON public.expense_budgets(organization_id);
CREATE INDEX IF NOT EXISTS idx_payment_gateway_configs_org_id ON public.payment_gateway_configs(organization_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_org_id ON public.team_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON public.team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- =====================================================
-- DONE! Your PayFlow schema is ready.
-- =====================================================
