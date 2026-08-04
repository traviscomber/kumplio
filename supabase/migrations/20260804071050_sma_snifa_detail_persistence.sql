begin;

create or replace function public.record_sma_sanctioning_detail(
  p_sma_process_id bigint,
  p_source_fetch_id uuid,
  p_content_hash text,
  p_payload_hash text,
  p_parser_version text,
  p_expediente text,
  p_start_date date,
  p_end_date date,
  p_process_state text,
  p_counts jsonb,
  p_units jsonb,
  p_holders jsonb,
  p_documents jsonb,
  p_facts jsonb,
  p_associations jsonb,
  p_sanctions jsonb,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  existing_version public.sma_sanctioning_detail_versions%rowtype;
  created_version public.sma_sanctioning_detail_versions%rowtype;
  expected_url text;
  source_id uuid;
  discovery_matches boolean;
  fetch_matches boolean;
  unit_count integer;
  holder_count integer;
  document_count integer;
  fact_count integer;
  inspection_count integer;
  provisional_measure_count integer;
  sanction_count integer;
begin
  if p_content_hash !~ '^[0-9a-f]{64}$' or p_payload_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'sma_detail_invalid_hash';
  end if;

  expected_url := format('https://snifa.sma.gob.cl/Sancionatorio/Ficha/%s',p_sma_process_id);

  select exists(
    select 1 from public.sma_sanctioning_proceedings proceeding
    where proceeding.sma_process_id=p_sma_process_id
      and proceeding.is_current
      and proceeding.expediente=p_expediente
      and proceeding.start_date=p_start_date
      and proceeding.process_state=p_process_state
      and proceeding.proceeding_url=expected_url
  ) into discovery_matches;

  if not discovery_matches then
    raise exception 'sma_detail_discovery_mismatch:%',p_sma_process_id;
  end if;

  select source.id into source_id
  from public.regulatory_sources source
  where source.canonical_url='https://snifa.sma.gob.cl/DatosAbiertos'
    and source.is_active;

  if source_id is null then
    raise exception 'sma_detail_source_not_registered';
  end if;

  select exists(
    select 1 from public.regulatory_source_fetches fetch
    where fetch.id=p_source_fetch_id
      and fetch.source_id=source_id
      and fetch.requested_url=expected_url
      and fetch.final_url=expected_url
      and fetch.content_hash=p_content_hash
      and fetch.status in ('succeeded','unchanged')
  ) into fetch_matches;

  if not fetch_matches then
    raise exception 'sma_detail_source_fetch_mismatch:%',p_sma_process_id;
  end if;

  if jsonb_typeof(p_counts)<>'object'
    or jsonb_typeof(p_units)<>'array'
    or jsonb_typeof(p_holders)<>'array'
    or jsonb_typeof(p_documents)<>'array'
    or jsonb_typeof(p_facts)<>'array'
    or jsonb_typeof(p_associations)<>'array'
    or jsonb_typeof(p_sanctions)<>'array'
  then
    raise exception 'sma_detail_invalid_payload_shape';
  end if;

  unit_count:=jsonb_array_length(p_units);
  holder_count:=jsonb_array_length(p_holders);
  document_count:=jsonb_array_length(p_documents);
  fact_count:=jsonb_array_length(p_facts);
  sanction_count:=jsonb_array_length(p_sanctions);

  select count(*) filter (where association_type='inspection'),
         count(*) filter (where association_type='provisional_measure')
  into inspection_count,provisional_measure_count
  from jsonb_to_recordset(p_associations) as association_data(association_type text);

  if unit_count<>(p_counts->>'units')::integer
    or holder_count<>(p_counts->>'holders')::integer
    or document_count<>(p_counts->>'documents')::integer
    or fact_count<>(p_counts->>'facts')::integer
    or inspection_count<>(p_counts->>'inspections')::integer
    or provisional_measure_count<>(p_counts->>'provisionalMeasures')::integer
    or sanction_count<>(p_counts->>'sanctions')::integer
  then
    raise exception 'sma_detail_count_mismatch:%',p_sma_process_id;
  end if;

  select * into existing_version
  from public.sma_sanctioning_detail_versions detail_version
  where detail_version.sma_process_id=p_sma_process_id
    and detail_version.content_hash=p_content_hash
    and detail_version.parser_version=p_parser_version
  limit 1;

  if found then
    return jsonb_build_object(
      'status','unchanged',
      'versionId',existing_version.id,
      'processId',p_sma_process_id,
      'documents',existing_version.document_count,
      'facts',existing_version.fact_count,
      'sanctions',existing_version.sanction_count
    );
  end if;

  insert into public.sma_sanctioning_detail_versions(
    sma_process_id,source_fetch_id,content_hash,payload_hash,parser_version,
    expediente,start_date,end_date,process_state,unit_count,holder_count,
    document_count,fact_count,inspection_count,provisional_measure_count,
    sanction_count,validation_status,metadata
  ) values (
    p_sma_process_id,p_source_fetch_id,p_content_hash,p_payload_hash,p_parser_version,
    p_expediente,p_start_date,p_end_date,p_process_state,unit_count,holder_count,
    document_count,fact_count,inspection_count,provisional_measure_count,
    sanction_count,'pending',coalesce(p_metadata,'{}'::jsonb)||jsonb_build_object(
      'requiresHumanReview',true,
      'factsAreNotAutoValidatedClaims',true
    )
  ) returning * into created_version;

  insert into public.sma_sanctioning_detail_units(
    version_id,ordinal,sma_unit_id,unit_name,location_text,latitude,longitude,unit_url,item_hash
  )
  select created_version.id,ordinal,sma_unit_id,unit_name,location_text,latitude,longitude,unit_url,item_hash
  from jsonb_to_recordset(p_units) as unit_data(
    ordinal integer,sma_unit_id bigint,unit_name text,location_text text,
    latitude numeric,longitude numeric,unit_url text,item_hash text
  );

  insert into public.sma_sanctioning_detail_holders(version_id,ordinal,holder_name,item_hash)
  select created_version.id,ordinal,holder_name,item_hash
  from jsonb_to_recordset(p_holders) as holder_data(
    ordinal integer,holder_name text,item_hash text
  );

  insert into public.sma_sanctioning_detail_documents(
    version_id,ordinal,document_name,document_type,document_date,download_id,download_url,item_hash
  )
  select created_version.id,ordinal,document_name,document_type,document_date,download_id,download_url,item_hash
  from jsonb_to_recordset(p_documents) as document_data(
    ordinal integer,document_name text,document_type text,document_date date,
    download_id bigint,download_url text,item_hash text
  );

  insert into public.sma_sanctioning_detail_facts(
    version_id,ordinal,fact_text,instrument_label,instrument_url,infringement_text,
    classification_label,classification_detail,item_hash,validation_status
  )
  select created_version.id,ordinal,fact_text,instrument_label,instrument_url,
         infringement_text,classification_label,classification_detail,item_hash,'pending'
  from jsonb_to_recordset(p_facts) as fact_data(
    ordinal integer,fact_text text,instrument_label text,instrument_url text,
    infringement_text text,classification_label text,classification_detail text,item_hash text
  );

  insert into public.sma_sanctioning_detail_associations(
    version_id,association_type,ordinal,reference_label,activity_year,
    external_id,detail_url,row_data,item_hash
  )
  select created_version.id,association_type,ordinal,reference_label,activity_year,
         external_id,detail_url,row_data,item_hash
  from jsonb_to_recordset(p_associations) as association_data(
    association_type text,ordinal integer,reference_label text,activity_year integer,
    external_id bigint,detail_url text,row_data jsonb,item_hash text
  );

  insert into public.sma_sanctioning_detail_sanctions(
    version_id,ordinal,fact_text,instrument_label,instrument_url,infringement_text,
    classification_label,classification_detail,sanction_text,fine_uta,item_hash,validation_status
  )
  select created_version.id,ordinal,fact_text,instrument_label,instrument_url,
         infringement_text,classification_label,classification_detail,
         sanction_text,fine_uta,item_hash,'pending'
  from jsonb_to_recordset(p_sanctions) as sanction_data(
    ordinal integer,fact_text text,instrument_label text,instrument_url text,
    infringement_text text,classification_label text,classification_detail text,
    sanction_text text,fine_uta numeric,item_hash text
  );

  insert into public.sma_sanctioning_detail_heads(sma_process_id,current_version_id,updated_at)
  values(p_sma_process_id,created_version.id,now())
  on conflict(sma_process_id) do update
  set current_version_id=excluded.current_version_id,updated_at=now();

  update public.sma_sanctioning_proceedings
  set metadata=metadata||jsonb_build_object(
        'detailHydrated',true,
        'currentDetailVersionId',created_version.id,
        'detailParserVersion',p_parser_version,
        'detailValidationStatus','pending'
      ),
      updated_at=now()
  where sma_process_id=p_sma_process_id;

  return jsonb_build_object(
    'status','captured',
    'versionId',created_version.id,
    'processId',p_sma_process_id,
    'documents',document_count,
    'facts',fact_count,
    'inspections',inspection_count,
    'provisionalMeasures',provisional_measure_count,
    'sanctions',sanction_count
  );
end;
$$;

revoke all on function public.record_sma_sanctioning_detail(
  bigint,uuid,text,text,text,text,date,date,text,
  jsonb,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb
) from public,anon,authenticated;

grant execute on function public.record_sma_sanctioning_detail(
  bigint,uuid,text,text,text,text,date,date,text,
  jsonb,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb
) to service_role;

commit;
