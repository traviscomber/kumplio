-- Register SST sources separately from DT doctrine so provenance and authority roles remain explicit.
insert into public.regulatory_sources (
  authority_name, source_name, canonical_url, domain, jurisdiction,
  source_type, authority_level, ingestion_method, terms_review_status,
  health_status, connector_version, is_active, metadata
)
values
  (
    'Dirección del Trabajo',
    'Decreto 44 — gestión preventiva y fiscalización',
    'https://www.dt.gob.cl/portal/1626/w3-article-127643.html',
    'dt.gob.cl', 'CL', 'guidance', 'official_guidance', 'html', 'pending',
    'unknown', 'sst-ds44-suseso-v3', true,
    jsonb_build_object(
      'governmentIntelligenceKey', 'direccion-trabajo-ds44',
      'scope', 'occupational_safety',
      'sourceRole', 'official_material_and_inspection_guidance',
      'legalEffectPolicy', 'technical_guidance_not_automatically_legal_obligation'
    )
  ),
  (
    'Superintendencia de Seguridad Social',
    'SUSESO — circulares SST y Compendio Ley 16.744',
    'https://www.suseso.cl/612/w3-propertyvalue-69181.html',
    'suseso.cl', 'CL', 'guidance', 'official_guidance', 'html', 'pending',
    'unknown', 'sst-ds44-suseso-v3', true,
    jsonb_build_object(
      'governmentIntelligenceKey', 'suseso-sst',
      'scope', 'occupational_safety',
      'sourceRole', 'supervisory_instruction',
      'legalEffectPolicy', 'preserve_explicit_sources_and_review_state'
    )
  )
on conflict (canonical_url) do update
set connector_version = excluded.connector_version,
    metadata = coalesce(public.regulatory_sources.metadata, '{}'::jsonb) || excluded.metadata,
    is_active = true,
    updated_at = now();
