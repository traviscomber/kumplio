begin;

update public.regulatory_parse_revisions r
set status = 'failed',
    metadata = coalesce(r.metadata, '{}'::jsonb) || jsonb_build_object(
      'supersededBeforeProjection', true,
      'reason', 'hash_mode_replaced_by_structural_v3'
    )
where r.to_parser_version = 'leychile-official-json-v2'
  and r.status = 'created';

create or replace function public.supersede_regulatory_knowledge_projection(
  p_document_id uuid,
  p_keep_version_id uuid
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  obsolete_node_ids uuid[];
  rebound_count integer := 0;
  node_count integer := 0;
  edge_count integer := 0;
begin
  with section_matches as (
    select distinct on (n.id)
      n.id as node_id,
      current_section.id as current_section_id
    from public.public_knowledge_nodes n
    join public.regulatory_document_sections previous_section
      on previous_section.id = n.source_entity_id
    join public.regulatory_document_versions previous_version
      on previous_version.id = previous_section.version_id
    join public.regulatory_document_sections current_section
      on current_section.version_id = p_keep_version_id
     and current_section.section_key = previous_section.section_key
    where n.source_entity_type = 'regulatory_document_section'
      and previous_version.document_id = p_document_id
      and previous_version.id <> p_keep_version_id
      and n.lifecycle_status not in ('superseded','archived')
    order by n.id, previous_version.version_number desc
  )
  update public.public_knowledge_nodes n
  set source_entity_id = section_matches.current_section_id,
      updated_at = now()
  from section_matches
  where n.id = section_matches.node_id;
  get diagnostics rebound_count = row_count;

  select coalesce(array_agg(n.id), '{}'::uuid[])
    into obsolete_node_ids
  from public.public_knowledge_nodes n
  where n.source_entity_type = 'regulatory_document_section'
    and n.source_entity_id in (
      select s.id
      from public.regulatory_document_sections s
      join public.regulatory_document_versions v on v.id = s.version_id
      where v.document_id = p_document_id
        and v.id <> p_keep_version_id
    )
    and n.lifecycle_status not in ('superseded','archived');

  if cardinality(obsolete_node_ids) > 0 then
    update public.public_knowledge_node_versions nv
    set review_status = 'superseded'
    where nv.id in (
      select n.current_version_id
      from public.public_knowledge_nodes n
      where n.id = any(obsolete_node_ids)
        and n.current_version_id is not null
    );

    update public.public_knowledge_edge_versions ev
    set review_status = 'superseded'
    where ev.id in (
      select e.current_version_id
      from public.public_knowledge_edges e
      where (e.source_node_id = any(obsolete_node_ids) or e.target_node_id = any(obsolete_node_ids))
        and e.current_version_id is not null
    );

    update public.public_knowledge_edges e
    set lifecycle_status = 'superseded', updated_at = now()
    where e.source_node_id = any(obsolete_node_ids)
       or e.target_node_id = any(obsolete_node_ids);
    get diagnostics edge_count = row_count;

    update public.public_knowledge_nodes n
    set lifecycle_status = 'superseded', updated_at = now()
    where n.id = any(obsolete_node_ids);
    get diagnostics node_count = row_count;
  end if;

  return jsonb_build_object(
    'nodesRebound', rebound_count,
    'nodesSuperseded', node_count,
    'edgesSuperseded', edge_count
  );
end;
$$;

revoke all on function public.supersede_regulatory_knowledge_projection(uuid,uuid)
  from public, anon, authenticated;
grant execute on function public.supersede_regulatory_knowledge_projection(uuid,uuid)
  to service_role;

update public.regulatory_sources
set connector_version = 'leychile-official-json-v3',
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'parserVersion', 'leychile-official-json-v3',
      'hashMode', 'section_key_and_normalized_text'
    ),
    updated_at = now()
where canonical_url = 'https://www.bcn.cl/leychile/';

update public.scraper_connectors
set connector_version = 'leychile-official-json-v3',
    user_agent = 'KUMPLIO-Regulatory-Connector/3.0 (+https://www.kumplio.app/regulatory)',
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'parserVersion', 'leychile-official-json-v3',
      'hashMode', 'section_key_and_normalized_text'
    ),
    updated_at = now()
where connector_key = 'leychile-official-json';

commit;
