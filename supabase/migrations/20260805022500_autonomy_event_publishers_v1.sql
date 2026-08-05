create or replace function public.publish_mission_completed_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'completed' and old.status is distinct from new.status then
    insert into public.compliance_events (
      organization_id, event_type, source_type, source_id, subject_type, subject_id, payload
    ) values (
      new.organization_id,
      'mission.completed',
      'mission',
      new.id,
      'mission',
      new.id,
      jsonb_build_object(
        'title', new.title,
        'priority', new.priority,
        'owner_id', new.owner_id,
        'completed_at', new.completed_at
      )
    );
  end if;
  return new;
end;
$$;

drop trigger if exists missions_publish_completed_event on public.missions;
create trigger missions_publish_completed_event
after update of status on public.missions
for each row execute function public.publish_mission_completed_event();

create or replace function public.publish_decision_resolved_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'resolved' and old.status is distinct from new.status then
    insert into public.compliance_events (
      organization_id, event_type, source_type, source_id, subject_type, subject_id, payload
    ) values (
      new.organization_id,
      'decision.resolved',
      'decision',
      new.id,
      'mission',
      new.mission_id,
      jsonb_build_object(
        'title', new.title,
        'priority', new.priority,
        'resolved_by', new.resolved_by,
        'resolved_at', new.resolved_at
      )
    );
  end if;
  return new;
end;
$$;

drop trigger if exists decisions_publish_resolved_event on public.mission_decisions;
create trigger decisions_publish_resolved_event
after update of status on public.mission_decisions
for each row execute function public.publish_decision_resolved_event();