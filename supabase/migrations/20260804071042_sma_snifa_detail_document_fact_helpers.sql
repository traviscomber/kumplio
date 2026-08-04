begin;

create or replace function private.insert_sma_detail_documents(
  p_version_id uuid,
  p_items jsonb
)
returns void
language sql
security invoker
set search_path = ''
as $$
  insert into public.sma_sanctioning_detail_documents(
    version_id,ordinal,document_name,document_type,document_date,
    download_id,download_url,item_hash
  )
  select p_version_id,ordinal,document_name,document_type,document_date,
         download_id,download_url,item_hash
  from jsonb_to_recordset(p_items) as item(
    ordinal integer,
    document_name text,
    document_type text,
    document_date date,
    download_id bigint,
    download_url text,
    item_hash text
  );
$$;

create or replace function private.insert_sma_detail_facts(
  p_version_id uuid,
  p_items jsonb
)
returns void
language sql
security invoker
set search_path = ''
as $$
  insert into public.sma_sanctioning_detail_facts(
    version_id,ordinal,fact_text,instrument_label,instrument_url,
    infringement_text,classification_label,classification_detail,
    item_hash,validation_status
  )
  select p_version_id,ordinal,fact_text,instrument_label,instrument_url,
         infringement_text,classification_label,classification_detail,
         item_hash,'pending'
  from jsonb_to_recordset(p_items) as item(
    ordinal integer,
    fact_text text,
    instrument_label text,
    instrument_url text,
    infringement_text text,
    classification_label text,
    classification_detail text,
    item_hash text
  );
$$;

revoke all on function private.insert_sma_detail_documents(uuid,jsonb)
  from public,anon,authenticated;
revoke all on function private.insert_sma_detail_facts(uuid,jsonb)
  from public,anon,authenticated;
grant execute on function private.insert_sma_detail_documents(uuid,jsonb)
  to service_role;
grant execute on function private.insert_sma_detail_facts(uuid,jsonb)
  to service_role;

commit;
