begin;

update public.regulatory_sources
set connector_version = 'direccion-trabajo-doctrina-v2',
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'parserVersion', 'direccion-trabajo-doctrina-v2',
      'parserFix', 'mat_alias_compact_dates_relation_identity',
      'sourceVersionsPreserved', true
    ),
    updated_at = now()
where canonical_url = 'https://www.dt.gob.cl/legislacion/1624/w3-channel.html';

update public.scraper_connectors
set connector_version = 'direccion-trabajo-doctrina-v2',
    status = 'manual',
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'parserVersion', 'direccion-trabajo-doctrina-v2',
      'parserFix', 'mat_alias_compact_dates_relation_identity',
      'schedulingReadiness', 'first_capture_requires_v2_reparse',
      'schedulingStatus', 'manual_until_two_verified_captures'
    ),
    updated_at = now()
where connector_key = 'direccion-trabajo-doctrina';

commit;
