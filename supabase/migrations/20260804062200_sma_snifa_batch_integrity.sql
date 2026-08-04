begin;

create or replace function public.record_sma_sanctioning_batch(
  p_snapshot_id uuid,
  p_rows jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  batch_size integer;
  distinct_row_numbers integer;
  inserted_count integer;
  persisted_count integer;
begin
  if jsonb_typeof(p_rows) <> 'array' then
    raise exception 'sma_batch_must_be_array';
  end if;

  batch_size := jsonb_array_length(p_rows);
  if batch_size < 1 or batch_size > 500 then
    raise exception 'sma_invalid_batch_size:%', batch_size;
  end if;

  if not exists (
    select 1
    from public.sma_dataset_snapshots snapshot
    where snapshot.id = p_snapshot_id
      and snapshot.status = 'processing'
  ) then
    raise exception 'sma_snapshot_not_processing';
  end if;

  select count(distinct incoming.row_number)
  into distinct_row_numbers
  from jsonb_to_recordset(p_rows) as incoming(row_number integer);

  if distinct_row_numbers <> batch_size then
    raise exception 'sma_batch_duplicate_row_numbers';
  end if;

  if exists (
    with incoming as (
      select
        row_number,
        sma_process_id,
        expediente,
        process_type,
        process_state,
        start_date,
        end_date,
        confirms_pdc,
        fine_total_uta,
        proceeding_url,
        sma_unit_id,
        unit_name,
        region_name,
        commune_name,
        latitude,
        longitude,
        economic_category,
        economic_subcategory,
        unit_url,
        source_update_date,
        encode(digest(concat_ws(E'\x1f',
          sma_process_id::text, expediente, process_type, process_state,
          start_date::text, coalesce(end_date::text, ''), confirms_pdc::text,
          coalesce(fine_total_uta::text, ''), proceeding_url,
          source_update_date::text
        ), 'sha256'), 'hex') as process_hash,
        encode(digest(concat_ws(E'\x1f',
          sma_unit_id::text, lower(unit_name), lower(region_name), lower(commune_name),
          coalesce(latitude::text, ''), coalesce(longitude::text, ''),
          coalesce(lower(economic_category), ''),
          coalesce(lower(economic_subcategory), ''), unit_url
        ), 'sha256'), 'hex') as unit_hash
      from jsonb_to_recordset(p_rows) as row_data(
        row_number integer,
        sma_process_id bigint,
        expediente text,
        process_type text,
        process_state text,
        start_date date,
        end_date date,
        confirms_pdc boolean,
        fine_total_uta numeric,
        proceeding_url text,
        sma_unit_id bigint,
        unit_name text,
        region_name text,
        commune_name text,
        latitude numeric,
        longitude numeric,
        economic_category text,
        economic_subcategory text,
        unit_url text,
        source_update_date date
      )
    ), hashed as (
      select incoming.*,
        encode(digest(process_hash || E'\x1f' || unit_hash, 'sha256'), 'hex') as row_hash
      from incoming
    )
    select 1
    from hashed incoming
    join public.sma_sanctioning_snapshot_rows existing
      on existing.snapshot_id = p_snapshot_id
     and existing.row_number = incoming.row_number
    where existing.row_hash <> incoming.row_hash
  ) then
    raise exception 'sma_batch_conflicts_with_existing_rows';
  end if;

  with incoming as (
    select
      row_number,
      sma_process_id,
      expediente,
      process_type,
      process_state,
      start_date,
      end_date,
      confirms_pdc,
      fine_total_uta,
      proceeding_url,
      sma_unit_id,
      unit_name,
      region_name,
      commune_name,
      latitude,
      longitude,
      economic_category,
      economic_subcategory,
      unit_url,
      source_update_date,
      encode(digest(concat_ws(E'\x1f',
        sma_process_id::text, expediente, process_type, process_state,
        start_date::text, coalesce(end_date::text, ''), confirms_pdc::text,
        coalesce(fine_total_uta::text, ''), proceeding_url,
        source_update_date::text
      ), 'sha256'), 'hex') as process_hash,
      encode(digest(concat_ws(E'\x1f',
        sma_unit_id::text, lower(unit_name), lower(region_name), lower(commune_name),
        coalesce(latitude::text, ''), coalesce(longitude::text, ''),
        coalesce(lower(economic_category), ''),
        coalesce(lower(economic_subcategory), ''), unit_url
      ), 'sha256'), 'hex') as unit_hash
    from jsonb_to_recordset(p_rows) as row_data(
      row_number integer,
      sma_process_id bigint,
      expediente text,
      process_type text,
      process_state text,
      start_date date,
      end_date date,
      confirms_pdc boolean,
      fine_total_uta numeric,
      proceeding_url text,
      sma_unit_id bigint,
      unit_name text,
      region_name text,
      commune_name text,
      latitude numeric,
      longitude numeric,
      economic_category text,
      economic_subcategory text,
      unit_url text,
      source_update_date date
    )
  ), hashed as (
    select incoming.*,
      encode(digest(process_hash || E'\x1f' || unit_hash, 'sha256'), 'hex') as row_hash
    from incoming
  ), inserted as (
    insert into public.sma_sanctioning_snapshot_rows (
      snapshot_id,
      row_number,
      sma_process_id,
      expediente,
      process_type,
      process_state,
      start_date,
      end_date,
      confirms_pdc,
      fine_total_uta,
      proceeding_url,
      sma_unit_id,
      unit_name,
      region_name,
      commune_name,
      latitude,
      longitude,
      economic_category,
      economic_subcategory,
      unit_url,
      source_update_date,
      process_hash,
      unit_hash,
      row_hash
    )
    select
      p_snapshot_id,
      row_number,
      sma_process_id,
      expediente,
      process_type,
      process_state,
      start_date,
      end_date,
      confirms_pdc,
      fine_total_uta,
      proceeding_url,
      sma_unit_id,
      unit_name,
      region_name,
      commune_name,
      latitude,
      longitude,
      economic_category,
      economic_subcategory,
      unit_url,
      source_update_date,
      process_hash,
      unit_hash,
      row_hash
    from hashed
    where proceeding_url = format(
      'https://snifa.sma.gob.cl/Sancionatorio/Ficha/%s', sma_process_id
    )
      and unit_url = format(
        'https://snifa.sma.gob.cl/UnidadFiscalizable/Ficha/%s', sma_unit_id
      )
    on conflict (snapshot_id, row_number) do nothing
    returning 1
  )
  select count(*) into inserted_count from inserted;

  select count(*)
  into persisted_count
  from public.sma_sanctioning_snapshot_rows existing
  join jsonb_to_recordset(p_rows) as incoming(row_number integer)
    on existing.snapshot_id = p_snapshot_id
   and existing.row_number = incoming.row_number;

  if persisted_count <> batch_size then
    raise exception 'sma_batch_contains_invalid_urls_or_rows:%:%',
      batch_size, persisted_count;
  end if;

  return jsonb_build_object(
    'status', case when inserted_count = 0 then 'unchanged' else 'inserted' end,
    'batchSize', batch_size,
    'inserted', inserted_count,
    'persisted', persisted_count
  );
end;
$$;

revoke all on function public.record_sma_sanctioning_batch(uuid,jsonb)
  from public, anon, authenticated;
grant execute on function public.record_sma_sanctioning_batch(uuid,jsonb)
  to service_role;

commit;
