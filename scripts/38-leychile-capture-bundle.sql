-- KUMPLIO LeyChile Controlled Capture — atomic capture bundle

begin;

create or replace function public.record_leychile_capture_bundle(
  p_source_id uuid,
  p_requested_url text,
  p_final_url text,
  p_http_status integer,
  p_mime_type text,
  p_content_hash text,
  p_raw_content text,
  p_connector_version text,
  p_document_identifier text,
  p_document_title text,
  p_document_type text,
  p_document_url text,
  p_external_reference text,
  p_publication_date date,
  p_effective_from date,
  p_effective_to date,
  p_document_status text,
  p_version_label text,
  p_version_date date,
  p_normalized_content text,
  p_parser_version text,
  p_sections jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  capture_result jsonb;
  version_id uuid;
  parsed_section_count integer;
begin
  capture_result := public.record_regulatory_source_capture(
    p_source_id := p_source_id,
    p_requested_url := p_requested_url,
    p_final_url := p_final_url,
    p_status := 'succeeded',
    p_http_status := p_http_status,
    p_mime_type := p_mime_type,
    p_content_hash := p_content_hash,
    p_raw_content := p_raw_content,
    p_storage_path := null,
    p_response_headers := '{}'::jsonb,
    p_connector_version := p_connector_version,
    p_error_code := null,
    p_error_message := null,
    p_document_identifier := p_document_identifier,
    p_document_title := p_document_title,
    p_document_type := p_document_type,
    p_document_url := p_document_url,
    p_external_reference := p_external_reference,
    p_publication_date := p_publication_date,
    p_effective_from := p_effective_from,
    p_effective_to := p_effective_to,
    p_document_status := p_document_status,
    p_version_label := p_version_label,
    p_version_date := p_version_date,
    p_normalized_content := p_normalized_content,
    p_parser_version := p_parser_version
  );

  version_id := (capture_result->>'versionId')::uuid;
  if version_id is null then
    raise exception using
      errcode = '23514',
      message = 'LeyChile capture did not resolve a document version';
  end if;

  parsed_section_count := public.record_regulatory_parsed_sections(
    p_version_id := version_id,
    p_parser_version := p_parser_version,
    p_sections := p_sections
  );

  return capture_result || jsonb_build_object(
    'parsedSectionCount', parsed_section_count
  );
end;
$$;

revoke all on function public.record_leychile_capture_bundle(
  uuid,text,text,integer,text,text,text,text,text,text,text,text,text,date,date,date,text,text,date,text,text,jsonb
) from public, anon, authenticated;

grant execute on function public.record_leychile_capture_bundle(
  uuid,text,text,integer,text,text,text,text,text,text,text,text,text,date,date,date,text,text,date,text,text,jsonb
) to service_role;

commit;
