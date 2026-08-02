-- KUMPLIO official Chilean source registry seed
-- Catalog metadata only. No source content, claims or legal conclusions are seeded.

begin;

insert into public.regulatory_sources (
  authority_name,
  source_name,
  canonical_url,
  domain,
  jurisdiction,
  source_type,
  authority_level,
  ingestion_method,
  terms_review_status,
  health_status,
  metadata
) values
  (
    'Biblioteca del Congreso Nacional de Chile',
    'LeyChile',
    'https://www.bcn.cl/leychile/',
    'bcn.cl',
    'CL',
    'law',
    'primary',
    'manual',
    'pending',
    'unknown',
    jsonb_build_object(
      'foundation', true,
      'initialDocument', 'LEY-21719',
      'captureRequired', true
    )
  ),
  (
    'Ministerio del Interior y Seguridad Pública',
    'Diario Oficial de la República de Chile',
    'https://www.diariooficial.interior.gob.cl/',
    'diariooficial.interior.gob.cl',
    'CL',
    'law',
    'primary',
    'manual',
    'pending',
    'unknown',
    jsonb_build_object(
      'foundation', true,
      'captureRequired', true
    )
  )
on conflict (canonical_url) do update
  set authority_name = excluded.authority_name,
      source_name = excluded.source_name,
      domain = excluded.domain,
      source_type = excluded.source_type,
      authority_level = excluded.authority_level,
      metadata = public.regulatory_sources.metadata || excluded.metadata,
      updated_at = now();

commit;
