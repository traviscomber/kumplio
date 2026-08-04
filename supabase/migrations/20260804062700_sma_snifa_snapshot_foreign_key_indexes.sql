begin;

create index if not exists sma_proceedings_snapshot_idx
  on public.sma_sanctioning_proceedings(source_snapshot_id);

create index if not exists sma_units_snapshot_idx
  on public.sma_fiscalizable_units(source_snapshot_id);

commit;
