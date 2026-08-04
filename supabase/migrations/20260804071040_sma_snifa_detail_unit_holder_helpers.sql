begin;

grant usage on schema private to service_role;

create or replace function private.insert_sma_detail_units(
  p_version_id uuid,
  p_items jsonb
)
returns void
language sql
security invoker
set search_path = ''
as $$
  insert into public.sma_sanctioning_detail_units(
    version_id,ordinal,sma_unit_id,unit_name,location_text,
    latitude,longitude,unit_url,item_hash
  )
  select p_version_id,ordinal,sma_unit_id,unit_name,location_text,
         latitude,longitude,unit_url,item_hash
  from jsonb_to_recordset(p_items) as item(
    ordinal integer,
    sma_unit_id bigint,
    unit_name text,
    location_text text,
    latitude numeric,
    longitude numeric,
    unit_url text,
    item_hash text
  );
$$;

create or replace function private.insert_sma_detail_holders(
  p_version_id uuid,
  p_items jsonb
)
returns void
language sql
security invoker
set search_path = ''
as $$
  insert into public.sma_sanctioning_detail_holders(
    version_id,ordinal,holder_name,item_hash
  )
  select p_version_id,ordinal,holder_name,item_hash
  from jsonb_to_recordset(p_items) as item(
    ordinal integer,
    holder_name text,
    item_hash text
  );
$$;

revoke all on function private.insert_sma_detail_units(uuid,jsonb)
  from public,anon,authenticated;
revoke all on function private.insert_sma_detail_holders(uuid,jsonb)
  from public,anon,authenticated;
grant execute on function private.insert_sma_detail_units(uuid,jsonb)
  to service_role;
grant execute on function private.insert_sma_detail_holders(uuid,jsonb)
  to service_role;

commit;
