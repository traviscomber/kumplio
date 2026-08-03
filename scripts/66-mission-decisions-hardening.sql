-- KUMPLIO — MISSION-003 hardening
begin;
create index if not exists mission_decisions_resolved_by_idx
  on public.mission_decisions(resolved_by)
  where resolved_by is not null;
commit;
