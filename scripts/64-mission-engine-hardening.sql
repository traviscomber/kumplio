-- KUMPLIO — Endurecimiento del Motor de Misiones
begin;

create index if not exists mission_playbooks_created_by_idx on public.mission_playbooks(created_by) where created_by is not null;
create index if not exists missions_created_by_idx on public.missions(created_by);
create index if not exists mission_events_actor_user_idx on public.mission_events(actor_user_id) where actor_user_id is not null;
create index if not exists mission_results_reviewed_by_idx on public.mission_results(reviewed_by) where reviewed_by is not null;
create index if not exists mission_results_created_by_user_idx on public.mission_results(created_by_user_id) where created_by_user_id is not null;

create or replace function public.protect_approved_mission_result()
returns trigger language plpgsql security invoker set search_path=''
as $$
begin
  if tg_op='DELETE' and old.status in ('approved','superseded') then
    raise exception 'approved_mission_results_are_immutable';
  end if;
  if tg_op='UPDATE' and old.status='approved' then
    if new.status<>'superseded'
       or new.mission_id<>old.mission_id
       or new.result_type<>old.result_type
       or new.version<>old.version
       or new.title is distinct from old.title
       or new.summary is distinct from old.summary
       or new.payload is distinct from old.payload
       or new.evidence_ids is distinct from old.evidence_ids
       or new.source_artifact_id is distinct from old.source_artifact_id
       or new.reviewed_by is distinct from old.reviewed_by
       or new.reviewed_at is distinct from old.reviewed_at
       or new.review_notes is distinct from old.review_notes then
      raise exception 'approved_mission_results_are_immutable';
    end if;
  elsif tg_op='UPDATE' and old.status='superseded' then
    raise exception 'superseded_mission_results_are_immutable';
  end if;
  return new;
end;
$$;

commit;
