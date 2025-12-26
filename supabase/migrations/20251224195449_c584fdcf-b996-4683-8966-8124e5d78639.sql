-- Fix org member creation so new organizations can add the first owner member safely

-- 1) Helper: does an organization already have any members?
create or replace function public.org_has_members(_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = _org_id
    limit 1
  )
$$;

-- 2) Replace the INSERT policy on organization_members
-- The first member (owner) can be created by the logged-in user.
-- After that, only an existing owner can add more members.
drop policy if exists "Owners can manage org members" on public.organization_members;

create policy "Owners can manage org members"
on public.organization_members
for insert
to authenticated
with check (
  (
    (not public.org_has_members(organization_id))
    and (user_id = auth.uid())
    and (role = 'owner'::public.org_role)
  )
  or
  (public.get_org_role(auth.uid(), organization_id) = 'owner'::public.org_role)
);
