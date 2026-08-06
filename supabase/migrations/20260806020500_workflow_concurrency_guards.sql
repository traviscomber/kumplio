create unique index if not exists agent_reviews_one_terminal_per_run_uidx
on public.agent_reviews (run_id)
where run_id is not null
  and decision in ('approved', 'rejected', 'changes_requested');

create or replace function private.prevent_duplicate_stage_claim()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = 'running'
    and new.status = 'running'
    and new.attempt_count <= old.attempt_count
    and new.run_id is not distinct from old.run_id
    and new.started_at is distinct from old.started_at then
    raise exception using
      errcode = '40001',
      message = 'Workflow stage is already claimed by another execution';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_duplicate_stage_claim on public.agent_workflow_stages;
create trigger prevent_duplicate_stage_claim
before update on public.agent_workflow_stages
for each row execute function private.prevent_duplicate_stage_claim();
