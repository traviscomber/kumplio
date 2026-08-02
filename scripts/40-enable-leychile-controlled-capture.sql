-- Enable the controlled LeyChile connector using BCN public/open documentation.

begin;

update public.regulatory_sources
set ingestion_method = 'html',
    terms_review_status = 'approved',
    connector_version = 'leychile-controlled-html-v2',
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'captureEnabled', true,
      'approvalBasis', 'BCN LeyChile interoperability documentation and BCN linked open data dataset',
      'approvedMethod', 'controlled_html',
      'initialNormId', '1209272',
      'initialVersion', '2026-12-01'
    ),
    updated_at = now()
where canonical_url = 'https://www.bcn.cl/leychile/';

commit;
