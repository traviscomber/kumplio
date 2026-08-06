-- KUMPLIO — Mission accountability and lifecycle integrity
-- Applied to the production Supabase project as migration: mission_accountability_atomic

alter table public.organization_members
  drop constraint if exists organization_members_role_check;

alter table public.organization_members
  add constraint organization_members_role_check
  check (role = any (array[
    'owner'::text,
    'admin'::text,
    'compliance'::text,
    'reviewer'::text,
    'member'::text,
    'viewer'::text
  ]));

create or replace function public.update_mission_accountability(
  p_actor_id uuid,
  p_organization_id uuid,
  p_mission_id uuid,
  p_owner_id uuid,
  p_due_at timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_role text;
  v_mission public.missions%rowtype;
  v_updated public.missions%rowtype;
begin
  select om.role
    into v_actor_role
  from public.organization_members om
  where om.organization_id = p_organization_id
    and om.user_id = p_actor_id
  for share;

  if not found or v_actor_role not in ('owner', 'admin', 'compliance') then
    raise exception 'mission_assignment_forbidden' using errcode = '42501';
  end if;

  if p_owner_id is not null and not exists (
    select 1
    from public.organization_members om
    where om.organization_id = p_organization_id
      and om.user_id = p_owner_id
  ) then
    raise exception 'mission_owner_not_member' using errcode = '23503';
  end if;

  select *
    into v_mission
  from public.missions m
  where m.id = p_mission_id
    and m.organization_id = p_organization_id
  for update;

  if not found then
    raise exception 'mission_not_found' using errcode = 'P0002';
  end if;

  if v_mission.status in ('completed', 'cancelled') then
    raise exception 'mission_terminal' using errcode = '55000';
  end if;

  update public.missions
  set owner_id = p_owner_id,
      due_at = p_due_at,
      updated_at = now()
  where id = p_mission_id
    and organization_id = p_organization_id
  returning * into v_updated;

  insert into public.mission_events (
    organization_id,
    mission_id,
    event_type,
    actor_type,
    actor_user_id,
    from_status,
    to_status,
    payload
  ) values (
    p_organization_id,
    p_mission_id,
    'ownership_updated',
    'user',
    p_actor_id,
    v_mission.status,
    v_updated.status,
    jsonb_build_object(
      'previous_owner_id', v_mission.owner_id,
      'owner_id', v_updated.owner_id,
      'previous_due_at', v_mission.due_at,
      'due_at', v_updated.due_at
    )
  );

  return jsonb_build_object(
    'missionId', v_updated.id,
    'status', v_updated.status,
    'ownerId', v_updated.owner_id,
    'dueAt', v_updated.due_at
  );
end;
$$;

revoke all on function public.update_mission_accountability(uuid, uuid, uuid, uuid, timestamptz)
  from public, anon, authenticated;
grant execute on function public.update_mission_accountability(uuid, uuid, uuid, uuid, timestamptz)
  to service_role;

create or replace function public.apply_assigned_mission_action(
  p_actor_id uuid,
  p_organization_id uuid,
  p_mission_id uuid,
  p_action text,
  p_due_at timestamptz default null,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_mission public.missions%rowtype;
  v_updated public.missions%rowtype;
  v_event_type text;
  v_payload jsonb := '{}'::jsonb;
begin
  if not exists (
    select 1
    from public.organization_members om
    where om.organization_id = p_organization_id
      and om.user_id = p_actor_id
  ) then
    raise exception 'organization_membership_required' using errcode = '42501';
  end if;

  select *
    into v_mission
  from public.missions m
  where m.id = p_mission_id
    and m.organization_id = p_organization_id
    and m.owner_id = p_actor_id
  for update;

  if not found then
    raise exception 'assigned_mission_not_found' using errcode = 'P0002';
  end if;

  if p_action = 'start' then
    if v_mission.status = 'active' then
      return jsonb_build_object(
        'missionId', v_mission.id,
        'status', v_mission.status,
        'dueAt', v_mission.due_at,
        'completedAt', v_mission.completed_at,
        'changed', false
      );
    end if;

    if v_mission.status not in ('draft', 'ready') then
      raise exception 'mission_start_invalid_transition' using errcode = '55000';
    end if;

    update public.missions
    set status = 'active',
        started_at = coalesce(started_at, now()),
        updated_at = now()
    where id = v_mission.id
    returning * into v_updated;

    v_event_type := 'mission_started';

  elsif p_action = 'reschedule' then
    if v_mission.status in ('completed', 'cancelled') then
      raise exception 'mission_terminal' using errcode = '55000';
    end if;

    if p_due_at is null then
      raise exception 'mission_due_at_required' using errcode = '22023';
    end if;

    update public.missions
    set due_at = p_due_at,
        updated_at = now()
    where id = v_mission.id
    returning * into v_updated;

    v_event_type := 'mission_rescheduled';
    v_payload := jsonb_build_object(
      'previous_due_at', v_mission.due_at,
      'due_at', v_updated.due_at
    );

  elsif p_action = 'complete' then
    if v_mission.status = 'completed' then
      return jsonb_build_object(
        'missionId', v_mission.id,
        'status', v_mission.status,
        'dueAt', v_mission.due_at,
        'completedAt', v_mission.completed_at,
        'changed', false
      );
    end if;

    if v_mission.status = 'cancelled' then
      raise exception 'mission_cancelled' using errcode = '55000';
    end if;

    if coalesce(length(trim(p_notes)), 0) < 3 then
      raise exception 'mission_completion_notes_required' using errcode = '22023';
    end if;

    update public.missions
    set status = 'completed',
        completed_at = now(),
        updated_at = now(),
        metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
          'completion_notes', trim(p_notes),
          'completed_by', p_actor_id
        )
    where id = v_mission.id
    returning * into v_updated;

    v_event_type := 'mission_completed';
    v_payload := jsonb_build_object('completion_notes', trim(p_notes));

  else
    raise exception 'invalid_mission_action' using errcode = '22023';
  end if;

  insert into public.mission_events (
    organization_id,
    mission_id,
    event_type,
    actor_type,
    actor_user_id,
    from_status,
    to_status,
    payload
  ) values (
    p_organization_id,
    p_mission_id,
    v_event_type,
    'user',
    p_actor_id,
    v_mission.status,
    v_updated.status,
    v_payload
  );

  return jsonb_build_object(
    'missionId', v_updated.id,
    'status', v_updated.status,
    'dueAt', v_updated.due_at,
    'completedAt', v_updated.completed_at,
    'changed', true
  );
end;
$$;

revoke all on function public.apply_assigned_mission_action(uuid, uuid, uuid, text, timestamptz, text)
  from public, anon, authenticated;
grant execute on function public.apply_assigned_mission_action(uuid, uuid, uuid, text, timestamptz, text)
  to service_role;
