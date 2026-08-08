-- Kumplio UI Golden Path — reversible cleanup for pre-mission E2E tenants.
--
-- IMPORTANT:
--   * This script ends in ROLLBACK by default.
--   * It targets only four explicit users and three explicit organizations.
--   * It must never be broadened to every @kumplio.invalid identity.
--   * It must never disable immutable-event triggers.
--   * Review docs/operations/ui-golden-path-data-lifecycle.md first.
--
-- Expected scope before execution:
--   users=4, profiles=4, organizations=3, memberships=3, projects=3,
--   cases=4, case_events=8, workflows=1, stages=5, runs=1,
--   artifacts=1, jobs=1, tool_calls=3, missions=0,
--   mission_events=0, knowledge_events=0, processing_activities=0.

begin;
set transaction isolation level serializable;
set local lock_timeout = '5s';
set local statement_timeout = '90s';

-- Prevent two cleanup sessions from targeting the same evidence set.
select pg_advisory_xact_lock(
  hashtextextended('kumplio:cleanup:ui-golden-path-pre-mission:v1', 0)
);

create temporary table target_users(
  user_id uuid primary key,
  expected_email text not null unique
) on commit drop;

insert into target_users(user_id, expected_email) values
  ('cd549b07-9ad1-429d-9f1a-d8499e5de48d', 'ui-golden-path-31224219777-1@kumplio.invalid'),
  ('b4f65bf7-18ff-4945-90cb-e263230ac687', 'ui-golden-path-31224669239-1@kumplio.invalid'),
  ('971ccc9d-be30-49f5-b15b-7341d5b046d6', 'ui-golden-path-31225188519-1@kumplio.invalid'),
  ('9dfc01cd-e4a8-4304-a787-17af0bcc04cf', 'ui-golden-path-31225760803-1@kumplio.invalid');

create temporary table target_orgs(
  organization_id uuid primary key,
  expected_name text not null unique
) on commit drop;

insert into target_orgs(organization_id, expected_name) values
  ('bbb9134c-2661-4c07-8c0a-33bab603f9a0', 'Kumplio UI Golden Path 31224669239-1'),
  ('7df3cfe5-ba8e-430c-ae9a-e164b5205bf3', 'Kumplio UI Golden Path 31225188519-1'),
  ('c19429e1-78a2-44cc-880e-dd6216ae94d3', 'Kumplio UI Golden Path 31225760803-1');

create temporary table target_projects(
  project_id uuid primary key
) on commit drop;

insert into target_projects(project_id)
select id
from public.projects
where organization_id in (select organization_id from target_orgs);

create temporary table baseline_guard on commit drop as
select
  (select count(*) from public.organizations where id in (
    'f02634d4-8dfe-46b3-b58f-fd1c188a1230'::uuid,
    '855eb5b2-c35c-4130-b80c-d87576bc0140'::uuid,
    '68291744-3ea1-424f-88ad-c199a780c662'::uuid
  )) as official_orgs,
  (select count(*) from public.organizations where id not in (select organization_id from target_orgs)) as retained_orgs,
  (select count(*) from auth.users where id not in (select user_id from target_users)) as retained_users,
  (select count(*) from public.agent_workflows where organization_id not in (select organization_id from target_orgs)) as retained_workflows,
  (select count(*) from public.organization_processes where organization_id not in (select organization_id from target_orgs)) as retained_processes,
  (select count(*) from public.mission_events where organization_id not in (select organization_id from target_orgs)) as retained_mission_events,
  (select count(*) from public.knowledge_events where organization_id not in (select organization_id from target_orgs)) as retained_knowledge_events;

-- Fail closed if production no longer matches the reviewed target.
do $$
begin
  if (select count(*) from target_users) <> 4 then
    raise exception 'Expected exactly 4 pre-mission E2E users';
  end if;

  if (select count(*) from target_orgs) <> 3 then
    raise exception 'Expected exactly 3 pre-mission E2E organizations';
  end if;

  if (select count(*) from target_projects) <> 3 then
    raise exception 'Expected exactly 3 pre-mission E2E projects';
  end if;

  if (
    select count(*)
    from auth.users u
    join target_users t on t.user_id = u.id and t.expected_email = u.email
  ) <> 4 then
    raise exception 'Target user IDs or emails changed';
  end if;

  if (
    select count(*)
    from public.organizations o
    join target_orgs t on t.organization_id = o.id and t.expected_name = o.name
  ) <> 3 then
    raise exception 'Target organization IDs or names changed';
  end if;

  if (select count(*) from public.profiles where id in (select user_id from target_users)) <> 4 then
    raise exception 'Expected exactly 4 target profiles';
  end if;

  if (select count(*) from public.organization_members where organization_id in (select organization_id from target_orgs)) <> 3 then
    raise exception 'Expected exactly 3 target memberships';
  end if;

  if (select count(*) from public.compliance_cases where organization_id in (select organization_id from target_orgs)) <> 4 then
    raise exception 'Expected exactly 4 target cases';
  end if;

  if (select count(*) from public.compliance_case_events where organization_id in (select organization_id from target_orgs)) <> 8 then
    raise exception 'Expected exactly 8 target case events';
  end if;

  if (select count(*) from public.agent_workflows where organization_id in (select organization_id from target_orgs)) <> 1 then
    raise exception 'Expected exactly 1 target workflow';
  end if;

  if (select count(*) from public.agent_workflow_stages where organization_id in (select organization_id from target_orgs)) <> 5 then
    raise exception 'Expected exactly 5 target workflow stages';
  end if;

  if (select count(*) from public.agent_runs where organization_id in (select organization_id from target_orgs)) <> 1 then
    raise exception 'Expected exactly 1 target agent run';
  end if;

  if (select count(*) from public.agent_artifacts where organization_id in (select organization_id from target_orgs)) <> 1 then
    raise exception 'Expected exactly 1 target agent artifact';
  end if;

  if (select count(*) from public.agent_jobs where organization_id in (select organization_id from target_orgs)) <> 1 then
    raise exception 'Expected exactly 1 target agent job';
  end if;

  if (select count(*) from public.agent_tool_calls where organization_id in (select organization_id from target_orgs)) <> 3 then
    raise exception 'Expected exactly 3 target agent tool calls';
  end if;

  if exists (
    select 1
    from target_orgs
    where organization_id in (
      'f02634d4-8dfe-46b3-b58f-fd1c188a1230'::uuid,
      '855eb5b2-c35c-4130-b80c-d87576bc0140'::uuid,
      '68291744-3ea1-424f-88ad-c199a780c662'::uuid
    )
  ) then
    raise exception 'Official 3x organization entered cleanup target';
  end if;

  if exists (
    select 1
    from public.missions
    where organization_id in (select organization_id from target_orgs)
  ) then
    raise exception 'Target contains a mission and must remain auditable';
  end if;

  if exists (
    select 1
    from public.mission_events
    where organization_id in (select organization_id from target_orgs)
  ) then
    raise exception 'Target contains immutable mission events';
  end if;

  if exists (
    select 1
    from public.knowledge_events
    where organization_id in (select organization_id from target_orgs)
  ) then
    raise exception 'Target contains immutable knowledge events';
  end if;

  if exists (
    select 1
    from public.organization_processes
    where organization_id in (select organization_id from target_orgs)
  ) then
    raise exception 'Target contains processing activities';
  end if;

  if exists (
    select 1
    from public.tenant_assurance_runs
    where primary_organization_id in (select organization_id from target_orgs)
       or sandbox_organization_id in (select organization_id from target_orgs)
       or primary_user_id in (select user_id from target_users)
       or sandbox_user_id in (select user_id from target_users)
       or sandbox_project_id in (select project_id from target_projects)
  ) then
    raise exception 'Target is referenced by tenant assurance';
  end if;

  if exists (
    select 1
    from public.organization_members
    where user_id in (select user_id from target_users)
      and organization_id not in (select organization_id from target_orgs)
  ) then
    raise exception 'Target user has a cross-organization membership';
  end if;

  if exists (
    select 1
    from public.profiles
    where id in (select user_id from target_users)
      and organization_id is not null
      and organization_id not in (select organization_id from target_orgs)
  ) then
    raise exception 'Target profile points to an organization outside the allowlist';
  end if;
end $$;

-- These FKs use SET NULL toward organizations/users. Delete the E2E telemetry
-- explicitly so it cannot survive as an unowned global record.
delete from public.ai_platform_runs
where organization_id in (select organization_id from target_orgs)
   or actor_user_id in (select user_id from target_users);

delete from public.scraper_runs
where organization_id in (select organization_id from target_orgs)
   or requested_by in (select user_id from target_users);

-- profiles.organization_id uses NO ACTION and would block tenant deletion.
delete from public.profiles
where id in (select user_id from target_users);

-- Organization-scoped records cascade here. projects.organization_id is SET NULL;
-- the projects are removed later by projects.user_id -> auth.users ON DELETE CASCADE.
delete from public.organizations
where id in (select organization_id from target_orgs);

-- Verify that no RESTRICT/NO ACTION reference to the target users survived the
-- tenant cascade. This protects global tables added after this script was written.
do $$
declare
  r record;
  v_count bigint;
begin
  for r in
    select
      ns.nspname as table_schema,
      cls.relname as table_name,
      att.attname as column_name
    from pg_constraint con
    join pg_class cls on cls.oid = con.conrelid
    join pg_namespace ns on ns.oid = cls.relnamespace
    join pg_class fcls on fcls.oid = con.confrelid
    join pg_namespace fns on fns.oid = fcls.relnamespace
    join lateral unnest(con.conkey) with ordinality ck(attnum, ord) on true
    join lateral unnest(con.confkey) with ordinality fk(attnum, ord) on fk.ord = ck.ord
    join pg_attribute att on att.attrelid = con.conrelid and att.attnum = ck.attnum
    where con.contype = 'f'
      and fns.nspname = 'auth'
      and fcls.relname = 'users'
      and con.confdeltype in ('a', 'r')
  loop
    execute format(
      'select count(*) from %I.%I where %I in (select user_id from pg_temp.target_users)',
      r.table_schema,
      r.table_name,
      r.column_name
    ) into v_count;

    if v_count <> 0 then
      raise exception 'Blocking user reference remains in %.% column %: % rows',
        r.table_schema, r.table_name, r.column_name, v_count;
    end if;
  end loop;
end $$;

-- Verify that projects can be removed by the auth.users cascade.
do $$
declare
  r record;
  v_count bigint;
begin
  for r in
    select
      ns.nspname as table_schema,
      cls.relname as table_name,
      att.attname as column_name
    from pg_constraint con
    join pg_class cls on cls.oid = con.conrelid
    join pg_namespace ns on ns.oid = cls.relnamespace
    join pg_class fcls on fcls.oid = con.confrelid
    join pg_namespace fns on fns.oid = fcls.relnamespace
    join lateral unnest(con.conkey) with ordinality ck(attnum, ord) on true
    join lateral unnest(con.confkey) with ordinality fk(attnum, ord) on fk.ord = ck.ord
    join pg_attribute att on att.attrelid = con.conrelid and att.attnum = ck.attnum
    where con.contype = 'f'
      and fns.nspname = 'public'
      and fcls.relname = 'projects'
      and con.confdeltype in ('a', 'r')
  loop
    execute format(
      'select count(*) from %I.%I where %I in (select project_id from pg_temp.target_projects)',
      r.table_schema,
      r.table_name,
      r.column_name
    ) into v_count;

    if v_count <> 0 then
      raise exception 'Blocking project reference remains in %.% column %: % rows',
        r.table_schema, r.table_name, r.column_name, v_count;
    end if;
  end loop;
end $$;

-- Auth deletion cascades identities, sessions and projects owned by each E2E user.
delete from auth.users
where id in (select user_id from target_users);

-- Final invariants. Any mismatch aborts the transaction.
do $$
begin
  if exists (select 1 from auth.users where id in (select user_id from target_users)) then
    raise exception 'A target user remains';
  end if;

  if exists (select 1 from public.organizations where id in (select organization_id from target_orgs)) then
    raise exception 'A target organization remains';
  end if;

  if exists (select 1 from public.projects where id in (select project_id from target_projects)) then
    raise exception 'A target project remains';
  end if;

  if (select count(*) from public.organizations) <> (select retained_orgs from baseline_guard) then
    raise exception 'A retained organization changed';
  end if;

  if (select count(*) from auth.users) <> (select retained_users from baseline_guard) then
    raise exception 'A retained user changed';
  end if;

  if (select count(*) from public.agent_workflows) <> (select retained_workflows from baseline_guard) then
    raise exception 'A retained workflow changed';
  end if;

  if (select count(*) from public.organization_processes) <> (select retained_processes from baseline_guard) then
    raise exception 'A retained process changed';
  end if;

  if (select count(*) from public.mission_events) <> (select retained_mission_events from baseline_guard) then
    raise exception 'An immutable mission event changed';
  end if;

  if (select count(*) from public.knowledge_events) <> (select retained_knowledge_events from baseline_guard) then
    raise exception 'An immutable knowledge event changed';
  end if;

  if (select count(*) from public.organizations where id in (
    'f02634d4-8dfe-46b3-b58f-fd1c188a1230'::uuid,
    '855eb5b2-c35c-4130-b80c-d87576bc0140'::uuid,
    '68291744-3ea1-424f-88ad-c199a780c662'::uuid
  )) <> 3 then
    raise exception 'An official 3x organization is missing';
  end if;

  if (select count(*) from auth.users where email like 'ui-golden-path-%@kumplio.invalid') <> 6 then
    raise exception 'Expected exactly 6 retained E2E users';
  end if;

  if (
    select count(distinct p.organization_id)
    from public.profiles p
    join auth.users u on u.id = p.id
    where u.email like 'ui-golden-path-%@kumplio.invalid'
      and p.organization_id is not null
  ) <> 6 then
    raise exception 'Expected exactly 6 retained E2E organizations';
  end if;
end $$;

select jsonb_build_object(
  'mode', 'reversible_dry_run',
  'targetUsersRemaining', (select count(*) from auth.users where id in (select user_id from target_users)),
  'targetOrganizationsRemaining', (select count(*) from public.organizations where id in (select organization_id from target_orgs)),
  'targetProjectsRemaining', (select count(*) from public.projects where id in (select project_id from target_projects)),
  'officialOrganizationsRemaining', (select count(*) from public.organizations where id in (
    'f02634d4-8dfe-46b3-b58f-fd1c188a1230'::uuid,
    '855eb5b2-c35c-4130-b80c-d87576bc0140'::uuid,
    '68291744-3ea1-424f-88ad-c199a780c662'::uuid
  )),
  'remainingE2eUsers', (select count(*) from auth.users where email like 'ui-golden-path-%@kumplio.invalid'),
  'remainingE2eOrganizations', (
    select count(distinct p.organization_id)
    from public.profiles p
    join auth.users u on u.id = p.id
    where u.email like 'ui-golden-path-%@kumplio.invalid'
      and p.organization_id is not null
  ),
  'retainedOrganizationsUnchanged', (select count(*) from public.organizations) = (select retained_orgs from baseline_guard),
  'retainedUsersUnchanged', (select count(*) from auth.users) = (select retained_users from baseline_guard),
  'retainedWorkflowsUnchanged', (select count(*) from public.agent_workflows) = (select retained_workflows from baseline_guard),
  'retainedProcessesUnchanged', (select count(*) from public.organization_processes) = (select retained_processes from baseline_guard),
  'immutableMissionEventsUnchanged', (select count(*) from public.mission_events) = (select retained_mission_events from baseline_guard),
  'immutableKnowledgeEventsUnchanged', (select count(*) from public.knowledge_events) = (select retained_knowledge_events from baseline_guard)
) as cleanup_report;

-- Default is intentionally non-destructive. Replace with COMMIT only after an
-- operator reviews cleanup_report in the same transaction and confirms backup,
-- maintenance window and unchanged targets.
rollback;
