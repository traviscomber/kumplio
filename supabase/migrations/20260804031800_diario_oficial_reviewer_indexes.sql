create index if not exists diario_oficial_editions_reviewer_idx
  on public.diario_oficial_editions (reviewed_by)
  where reviewed_by is not null;

create index if not exists diario_oficial_publications_reviewer_idx
  on public.diario_oficial_publications (reviewed_by)
  where reviewed_by is not null;
