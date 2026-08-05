create table if not exists public.context_nodes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  node_type text not null,
  external_id uuid,
  label text not null,
  summary text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, node_type, external_id)
);

create table if not exists public.context_edges (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  from_node_id uuid not null references public.context_nodes(id) on delete cascade,
  to_node_id uuid not null references public.context_nodes(id) on delete cascade,
  relation_type text not null,
  confidence numeric(5,4) not null default 1,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (organization_id, from_node_id, to_node_id, relation_type)
);

create table if not exists public.organization_memory (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  memory_type text not null,
  source_type text not null,
  source_id uuid,
  title text not null,
  summary text not null,
  outcome text,
  tags text[] not null default '{}',
  context jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (organization_id, memory_type, source_type, source_id)
);

create index if not exists idx_context_nodes_org_type on public.context_nodes(organization_id, node_type);
create index if not exists idx_context_edges_org_from on public.context_edges(organization_id, from_node_id);
create index if not exists idx_context_edges_org_to on public.context_edges(organization_id, to_node_id);
create index if not exists idx_org_memory_org_time on public.organization_memory(organization_id, occurred_at desc);

create or replace function public.capture_decision_memory()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.status = 'resolved' and old.status is distinct from 'resolved' then
    insert into public.organization_memory(organization_id,memory_type,source_type,source_id,title,summary,outcome,tags,context,occurred_at)
    values(new.organization_id,'decision_precedent','mission_decision',new.id,new.title,
      coalesce(new.resolution_notes,new.description,'Decisión resuelta'),coalesce(new.resolution_notes,'Resuelta'),
      array_remove(array[new.priority,'decision'],null),
      jsonb_build_object('recommendation',new.recommendation,'mission_id',new.mission_id,'evidence_ids',new.evidence_ids,'resolved_by',new.resolved_by),
      coalesce(new.resolved_at,now()))
    on conflict (organization_id,memory_type,source_type,source_id)
    do update set summary=excluded.summary,outcome=excluded.outcome,context=excluded.context,occurred_at=excluded.occurred_at;
  end if;
  return new;
end $$;

drop trigger if exists trg_capture_decision_memory on public.mission_decisions;
create trigger trg_capture_decision_memory after update on public.mission_decisions
for each row execute function public.capture_decision_memory();

create or replace function public.capture_situation_context_node()
returns trigger language plpgsql security definer set search_path=public as $$
declare situation_node uuid; mission_node uuid; decision_node uuid;
begin
  insert into public.context_nodes(organization_id,node_type,external_id,label,summary,metadata)
  values(new.organization_id,'situation',new.id,new.title,new.summary,jsonb_build_object('severity',new.severity,'status',new.status,'confidence',new.confidence))
  on conflict (organization_id,node_type,external_id) do update set label=excluded.label,summary=excluded.summary,metadata=excluded.metadata,updated_at=now()
  returning id into situation_node;

  if new.mission_id is not null then
    insert into public.context_nodes(organization_id,node_type,external_id,label,summary)
    select new.organization_id,'mission',m.id,m.title,m.objective from public.missions m where m.id=new.mission_id
    on conflict (organization_id,node_type,external_id) do update set label=excluded.label,summary=excluded.summary,updated_at=now()
    returning id into mission_node;
    if mission_node is not null then
      insert into public.context_edges(organization_id,from_node_id,to_node_id,relation_type)
      values(new.organization_id,situation_node,mission_node,'executed_by') on conflict do nothing;
    end if;
  end if;

  if new.decision_id is not null then
    insert into public.context_nodes(organization_id,node_type,external_id,label,summary)
    select new.organization_id,'decision',d.id,d.title,d.description from public.mission_decisions d where d.id=new.decision_id
    on conflict (organization_id,node_type,external_id) do update set label=excluded.label,summary=excluded.summary,updated_at=now()
    returning id into decision_node;
    if decision_node is not null then
      insert into public.context_edges(organization_id,from_node_id,to_node_id,relation_type)
      values(new.organization_id,situation_node,decision_node,'requires_decision') on conflict do nothing;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_capture_situation_context on public.compliance_situations;
create trigger trg_capture_situation_context after insert or update on public.compliance_situations
for each row execute function public.capture_situation_context_node();
