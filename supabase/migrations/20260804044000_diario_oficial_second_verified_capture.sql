begin;

update public.scraper_connectors connector
set metadata = (coalesce(connector.metadata, '{}'::jsonb) - 'initialStatus') || jsonb_build_object(
      'verifiedCaptureCount', 2,
      'verifiedEditions', jsonb_build_array(
        jsonb_build_object(
          'edition', 44476,
          'publicationDate', '2026-06-16',
          'publicationCount', 30
        ),
        jsonb_build_object(
          'edition', 44496,
          'publicationDate', '2026-07-10',
          'publicationCount', 18
        )
      ),
      'schedulingReadiness', 'ready',
      'schedulingStatus', 'manual_until_explicit_activation',
      'secondVerifiedCaptureAt', now()
    ),
    updated_at = now()
where connector.connector_key = 'diario-oficial-summary'
  and connector.status = 'manual'
  and exists (
    select 1
    from public.diario_oficial_editions edition
    where edition.edition_number = 44476
      and edition.publication_date = date '2026-06-16'
      and edition.is_current
      and edition.publication_count = 30
  )
  and exists (
    select 1
    from public.diario_oficial_editions edition
    where edition.edition_number = 44496
      and edition.publication_date = date '2026-07-10'
      and edition.is_current
      and edition.publication_count = 18
  );

update public.regulatory_sources source
set metadata = coalesce(source.metadata, '{}'::jsonb) || jsonb_build_object(
      'verifiedCaptureCount', 2,
      'verifiedEditionNumbers', jsonb_build_array(44476, 44496),
      'lastVerifiedEdition', 44496,
      'lastVerifiedEditionDate', '2026-07-10',
      'schedulingReadiness', 'ready'
    ),
    updated_at = now()
where source.canonical_url = 'https://www.diariooficial.interior.gob.cl/'
  and exists (
    select 1
    from public.diario_oficial_editions edition
    where edition.source_id = source.id
      and edition.edition_number = 44496
      and edition.publication_date = date '2026-07-10'
      and edition.is_current
      and edition.publication_count = 18
  );

commit;
