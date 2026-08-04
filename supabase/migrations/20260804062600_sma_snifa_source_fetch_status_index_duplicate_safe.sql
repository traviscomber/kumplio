begin;

-- Esta migración replica de forma idempotente el índice aplicado durante la
-- validación productiva. Se conserva para que el historial del repositorio
-- coincida exactamente con el historial de migraciones de Supabase.
create index if not exists regulatory_source_fetches_source_url_status_idx
  on public.regulatory_source_fetches(source_id, requested_url, fetched_at desc)
  where status in ('succeeded', 'unchanged');

commit;
