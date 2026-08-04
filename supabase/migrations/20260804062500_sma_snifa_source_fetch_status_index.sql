begin;

create index if not exists regulatory_source_fetches_source_url_status_idx
  on public.regulatory_source_fetches(source_id, requested_url, fetched_at desc)
  where status in ('succeeded', 'unchanged');

commit;
