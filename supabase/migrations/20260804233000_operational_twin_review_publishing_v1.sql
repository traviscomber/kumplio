create table if not exists public.executive_snapshot_events (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references public.executive_intelligence_snapshots(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  event_type text not null check (event_type in ('generated','submitted','approved','published','archived','rejected')),
  from_status text,
  to_status text not null,
  actor_user_id uuid references auth.users(id),
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists executive_snapshot_events_snapshot_idx on public.executive_snapshot_events(snapshot_id, created_at desc);
create index if not exists executive_snapshot_events_org_idx on public.executive_snapshot_events(organization_id, created_at desc);
alter table public.executive_snapshot_events enable row level security;
revoke all on public.executive_snapshot_events from public, anon, authenticated;
grant all on public.executive_snapshot_events to service_role;

create or replace function public.transition_executive_snapshot_v1(p_snapshot_id uuid,p_actor_user_id uuid,p_action text,p_notes text default null) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare v_snapshot public.executive_intelligence_snapshots%rowtype; v_next text;
begin
 select * into v_snapshot from public.executive_intelligence_snapshots where id=p_snapshot_id for update;
 if not found then raise exception 'snapshot_not_found'; end if;
 v_next:=case p_action when 'submit' then 'review_required' when 'approve' then 'approved' when 'publish' then 'published' when 'archive' then 'archived' when 'reject' then 'draft' else null end;
 if v_next is null then raise exception 'invalid_action'; end if;
 if p_action='approve' and v_snapshot.status<>'review_required' then raise exception 'invalid_transition'; end if;
 if p_action='publish' and v_snapshot.status<>'approved' then raise exception 'invalid_transition'; end if;
 if p_action='archive' and v_snapshot.status<>'published' then raise exception 'invalid_transition'; end if;
 update public.executive_intelligence_snapshots set status=v_next,
 reviewed_by=case when p_action in ('approve','reject') then p_actor_user_id else reviewed_by end,
 reviewed_at=case when p_action in ('approve','reject') then now() else reviewed_at end,
 published_at=case when p_action='publish' then now() else published_at end where id=p_snapshot_id;
 insert into public.executive_snapshot_events(snapshot_id,organization_id,event_type,from_status,to_status,actor_user_id,notes)
 values(p_snapshot_id,v_snapshot.organization_id,case p_action when 'submit' then 'submitted' when 'approve' then 'approved' when 'publish' then 'published' when 'archive' then 'archived' else 'rejected' end,v_snapshot.status,v_next,p_actor_user_id,nullif(trim(p_notes),''));
 return p_snapshot_id;
end;$$;
revoke all on function public.transition_executive_snapshot_v1(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.transition_executive_snapshot_v1(uuid,uuid,text,text) to service_role;
