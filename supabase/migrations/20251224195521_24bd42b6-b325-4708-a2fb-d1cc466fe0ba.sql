-- Fix: Policies must be PERMISSIVE to grant access

-- 1) Drop and recreate organizations INSERT policy as PERMISSIVE
drop policy if exists "Authenticated users can create organizations" on public.organizations;
create policy "Authenticated users can create organizations"
on public.organizations
for insert
to authenticated
with check (true);

-- 2) Drop and recreate organization_members INSERT policy as PERMISSIVE
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
