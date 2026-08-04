begin;

create or replace function private.insert_sma_detail_associations(
  p_version_id uuid,
  p_items jsonb
)
returns void
language sql
security invoker
set search_path = ''
as $$
  insert into public.sma_sanctioning_detail_associations(
    version_id,association_type,ordinal,reference_label,activity_year,
    external_id,detail_url,row_data,item_hash
  )
  select p_version_id,association_type,ordinal,reference_label,activity_year,
         external_id,detail_url,row_data,item_hash
  from jsonb_to_recordset(p_items) as item(
    association_type text,
    ordinal integer,
    reference_label text,
    activity_year integer,
    external_id bigint,
    detail_url text,
    row_data jsonb,
    item_hash text
  );
$$;

create or replace function private.insert_sma_detail_sanctions(
  p_version_id uuid,
  p_items jsonb
)
returns void
language sql
security invoker
set search_path = ''
as $$
  insert into public.sma_sanctioning_detail_sanctions(
    version_id,ordinal,fact_text,instrument_label,instrument_url,
    infringement_text,classification_label,classification_detail,
    sanction_text,fine_uta,item_hash,validation_status
  )
  select p_version_id,ordinal,fact_text,instrument_label,instrument_url,
         infringement_text,classification_label,classification_detail,
         sanction_text,fine_uta,item_hash,'pending'
  from jsonb_to_recordset(p_items) as item(
    ordinal integer,
    fact_text text,
    instrument_label text,
    instrument_url text,
    infringement_text text,
    classification_label text,
    classification_detail text,
    sanction_text text,
    fine_uta numeric,
    item_hash text
  );
$$;

revoke all on function private.insert_sma_detail_associations(uuid,jsonb)
  from public,anon,authenticated;
revoke all on function private.insert_sma_detail_sanctions(uuid,jsonb)
  from public,anon,authenticated;
grant execute on function private.insert_sma_detail_associations(uuid,jsonb)
  to service_role;
grant execute on function private.insert_sma_detail_sanctions(uuid,jsonb)
  to service_role;

commit;
