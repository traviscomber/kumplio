-- Harden operational tables that were exposed through PostgREST without RLS.
-- Preserve authenticated product behavior inside the user's organization while
-- removing anonymous access and cross-organization access.

do $$
declare
  target_table text;
  policy_name text;
begin
  foreach target_table in array array[
    'compliance_action_plan_items',
    'document_intelligence',
    'compliance_gaps',
    'vendor_compliance_assessments',
    'audit_preparation_packages',
    'compliance_events',
    'automation_rules',
    'compliance_situations',
    'context_nodes',
    'context_edges',
    'organization_memory'
  ]
  loop
    policy_name := target_table || '_member_access';

    execute format('alter table public.%I enable row level security', target_table);

    -- TRUNCATE and other broad default privileges are not protected by RLS.
    execute format('revoke all on table public.%I from anon', target_table);
    execute format('revoke all on table public.%I from authenticated', target_table);

    execute format(
      'grant select, insert, update, delete on table public.%I to authenticated',
      target_table
    );
    execute format('grant all on table public.%I to service_role', target_table);

    execute format('drop policy if exists %I on public.%I', policy_name, target_table);
    execute format(
      'create policy %I on public.%I for all to authenticated using ((select public.is_organization_member(organization_id))) with check ((select public.is_organization_member(organization_id)))',
      policy_name,
      target_table
    );
  end loop;
end
$$;

-- Trigger functions are invoked by their triggers and must not be callable as
-- public RPC endpoints.
revoke all on function public.capture_decision_memory() from public, anon, authenticated;
revoke all on function public.capture_situation_context_node() from public, anon, authenticated;
revoke all on function public.publish_decision_resolved_event() from public, anon, authenticated;
revoke all on function public.publish_mission_completed_event() from public, anon, authenticated;

grant execute on function public.capture_decision_memory() to service_role;
grant execute on function public.capture_situation_context_node() to service_role;
grant execute on function public.publish_decision_resolved_event() to service_role;
grant execute on function public.publish_mission_completed_event() to service_role;

-- These SECURITY DEFINER routines accept organization/project identifiers but
-- do not independently validate the caller's membership. Keep them available
-- only to trusted server-side execution until protected user-facing wrappers
-- are introduced.
revoke all on function public.generate_compliance_action_plan_v1(uuid, uuid) from public, anon, authenticated;
revoke all on function public.prepare_audit_package_v1(uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function public.refresh_compliance_gaps_v1(uuid) from public, anon, authenticated;
revoke all on function public.refresh_vendor_assessments_v1(uuid) from public, anon, authenticated;

grant execute on function public.generate_compliance_action_plan_v1(uuid, uuid) to service_role;
grant execute on function public.prepare_audit_package_v1(uuid, uuid, uuid) to service_role;
grant execute on function public.refresh_compliance_gaps_v1(uuid) to service_role;
grant execute on function public.refresh_vendor_assessments_v1(uuid) to service_role;

-- create_document_record performs its own auth.uid() and project-membership
-- checks. Preserve authenticated access, but make the intended ACL explicit.
revoke all on function public.create_document_record(uuid, text, text, text) from public, anon;
grant execute on function public.create_document_record(uuid, text, text, text) to authenticated, service_role;
