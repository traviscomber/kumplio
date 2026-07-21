-- KUMPLIO continuous compliance core (part 2)
-- Tenant isolation policies for tables created in 04-continuous-compliance-core.sql.

begin;

create or replace function public.is_organization_member(target_organization uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from organization_members membership
    where membership.organization_id = target_organization
      and membership.user_id = auth.uid()
  );
$$;

revoke all on function public.is_organization_member(uuid) from public;
grant execute on function public.is_organization_member(uuid) to authenticated;

create policy controls_select_member on controls
  for select to authenticated
  using (public.is_organization_member(organization_id));
create policy controls_insert_member on controls
  for insert to authenticated
  with check (public.is_organization_member(organization_id));
create policy controls_update_member on controls
  for update to authenticated
  using (public.is_organization_member(organization_id))
  with check (public.is_organization_member(organization_id));
create policy controls_delete_member on controls
  for delete to authenticated
  using (public.is_organization_member(organization_id));

create policy evidence_select_member on evidence
  for select to authenticated
  using (public.is_organization_member(organization_id));
create policy evidence_insert_member on evidence
  for insert to authenticated
  with check (public.is_organization_member(organization_id));
create policy evidence_update_member on evidence
  for update to authenticated
  using (public.is_organization_member(organization_id))
  with check (public.is_organization_member(organization_id));
create policy evidence_delete_member on evidence
  for delete to authenticated
  using (public.is_organization_member(organization_id));

create policy findings_select_member on findings
  for select to authenticated
  using (public.is_organization_member(organization_id));
create policy findings_insert_member on findings
  for insert to authenticated
  with check (public.is_organization_member(organization_id));
create policy findings_update_member on findings
  for update to authenticated
  using (public.is_organization_member(organization_id))
  with check (public.is_organization_member(organization_id));
create policy findings_delete_member on findings
  for delete to authenticated
  using (public.is_organization_member(organization_id));

create policy actions_select_member on action_items
  for select to authenticated
  using (public.is_organization_member(organization_id));
create policy actions_insert_member on action_items
  for insert to authenticated
  with check (public.is_organization_member(organization_id));
create policy actions_update_member on action_items
  for update to authenticated
  using (public.is_organization_member(organization_id))
  with check (public.is_organization_member(organization_id));
create policy actions_delete_member on action_items
  for delete to authenticated
  using (public.is_organization_member(organization_id));

create policy control_evidence_select_member on control_evidence
  for select to authenticated
  using (
    exists (
      select 1 from controls c
      where c.id = control_id
        and public.is_organization_member(c.organization_id)
    )
  );
create policy control_evidence_insert_member on control_evidence
  for insert to authenticated
  with check (
    exists (
      select 1 from controls c
      where c.id = control_id
        and public.is_organization_member(c.organization_id)
    )
    and exists (
      select 1 from evidence e
      where e.id = evidence_id
        and public.is_organization_member(e.organization_id)
    )
  );
create policy control_evidence_delete_member on control_evidence
  for delete to authenticated
  using (
    exists (
      select 1 from controls c
      where c.id = control_id
        and public.is_organization_member(c.organization_id)
    )
  );

commit;
