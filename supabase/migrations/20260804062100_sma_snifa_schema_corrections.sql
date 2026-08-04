begin;

alter table public.sma_sanctioning_snapshot_rows
  alter column economic_category drop not null,
  alter column economic_subcategory drop not null;

alter table public.sma_sanctioning_snapshot_rows
  drop constraint if exists sma_sanctioning_snapshot_rows_economic_category_check,
  drop constraint if exists sma_sanctioning_snapshot_rows_economic_subcategory_check;

alter table public.sma_sanctioning_snapshot_rows
  add constraint sma_sanctioning_snapshot_rows_economic_category_check
    check (economic_category is null or btrim(economic_category) <> ''),
  add constraint sma_sanctioning_snapshot_rows_economic_subcategory_check
    check (economic_subcategory is null or btrim(economic_subcategory) <> '');

alter table public.sma_fiscalizable_units
  alter column economic_category drop not null,
  alter column economic_subcategory drop not null;

alter table public.sma_fiscalizable_units
  add constraint sma_fiscalizable_units_category_check
    check (economic_category is null or btrim(economic_category) <> ''),
  add constraint sma_fiscalizable_units_subcategory_check
    check (economic_subcategory is null or btrim(economic_subcategory) <> '');

comment on column public.sma_sanctioning_snapshot_rows.economic_category is
  'Categoría informada por SNIFA; NULL cuando el dataset oficial no la entrega.';
comment on column public.sma_sanctioning_snapshot_rows.economic_subcategory is
  'Subcategoría informada por SNIFA; NULL cuando el dataset oficial no la entrega.';
comment on column public.sma_fiscalizable_units.economic_category is
  'Categoría vigente según el snapshot SNIFA más reciente; puede ser NULL.';
comment on column public.sma_fiscalizable_units.economic_subcategory is
  'Subcategoría vigente según el snapshot SNIFA más reciente; puede ser NULL.';

commit;
