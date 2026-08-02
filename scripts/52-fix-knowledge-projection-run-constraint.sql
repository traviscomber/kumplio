-- KUMPLIO — Compatibilidad de historial de ejecuciones de proyección
begin;

alter table public.knowledge_projection_runs
  drop constraint if exists knowledge_projection_runs_projection_type_source_version_id_source_hash_key;
alter table public.knowledge_projection_runs
  drop constraint if exists knowledge_projection_runs_projection_type_source_version_id_key;

create index if not exists knowledge_projection_runs_identity_idx
  on public.knowledge_projection_runs(projection_type, source_version_id, source_hash, created_at desc);

commit;