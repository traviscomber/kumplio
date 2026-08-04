create or replace function public.generate_ley21719_candidate_rules_v1()
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  inserted_count integer := 0;
  existing_count integer := 0;
begin
  with candidates(section_key, rule_key, title, conditions, outcome) as (
    values
      ('part:10527466:article:1°:inciso:2', 'ley21719.general.processing.scope', 'Respetar la Ley 21.719 en todo tratamiento de datos personales', '{"attributes_contains":{"processes_personal_data":true}}'::jsonb, '{"applies":true,"priority":"high"}'::jsonb),
      ('part:10527466:article:3°:inciso:4', 'ley21719.principle.purpose', 'Definir y limitar el tratamiento a fines específicos, explícitos y lícitos', '{"attributes_contains":{"processes_personal_data":true}}'::jsonb, '{"applies":true,"priority":"high"}'::jsonb),
      ('part:10527466:article:3°:inciso:6', 'ley21719.principle.proportionality', 'Limitar los datos a lo necesario, adecuado y pertinente', '{"attributes_contains":{"processes_personal_data":true}}'::jsonb, '{"applies":true,"priority":"high"}'::jsonb),
      ('part:10527466:article:3°:inciso:8', 'ley21719.principle.quality', 'Mantener datos exactos, completos, actuales y pertinentes', '{"attributes_contains":{"processes_personal_data":true}}'::jsonb, '{"applies":true,"priority":"high"}'::jsonb),
      ('part:10527466:article:14-bis:inciso:1', 'ley21719.duty.confidentiality', 'Mantener secreto y confidencialidad sobre los datos personales', '{"attributes_contains":{"processes_personal_data":true}}'::jsonb, '{"applies":true,"priority":"critical"}'::jsonb),
      ('part:10527466:article:10:inciso:3', 'ley21719.rights.mechanisms', 'Implementar mecanismos ágiles para el ejercicio de derechos', '{"attributes_contains":{"processes_personal_data":true}}'::jsonb, '{"applies":true,"priority":"high"}'::jsonb),
      ('part:10527466:article:14-ter:inciso:1', 'ley21719.transparency.public_information', 'Mantener información de tratamiento disponible al público', '{"attributes_contains":{"processes_personal_data":true}}'::jsonb, '{"applies":true,"priority":"high"}'::jsonb),
      ('part:10527466:article:14-quater:inciso:2', 'ley21719.privacy.by_default', 'Aplicar protección de datos por defecto', '{"attributes_contains":{"processes_personal_data":true}}'::jsonb, '{"applies":true,"priority":"high"}'::jsonb),
      ('part:10527466:article:14-quinquies:inciso:1', 'ley21719.security.measures', 'Adoptar medidas técnicas y organizativas de seguridad', '{"attributes_contains":{"processes_personal_data":true}}'::jsonb, '{"applies":true,"priority":"critical"}'::jsonb),
      ('part:10527466:article:15-bis:inciso:4', 'ley21719.processor.security_report', 'Exigir confidencialidad, seguridad y reporte a encargados', '{"all":[{"attributes_contains":{"processes_personal_data":true}},{"attributes_contains":{"uses_data_processors":true}}]}'::jsonb, '{"applies":true,"priority":"critical"}'::jsonb),
      ('part:10527466:article:15-ter:inciso:1', 'ley21719.dpia.high_risk', 'Realizar evaluación de impacto antes de tratamientos de alto riesgo', '{"all":[{"attributes_contains":{"processes_personal_data":true}},{"attributes_contains":{"high_risk_processing":true}}]}'::jsonb, '{"applies":true,"priority":"critical"}'::jsonb),
      ('part:10527466:article:14-ter:inciso:9', 'ley21719.transfer.international_information', 'Informar transferencias internacionales y sus garantías', '{"all":[{"attributes_contains":{"processes_personal_data":true}},{"attributes_contains":{"international_data_transfers":true}}]}'::jsonb, '{"applies":true,"priority":"high"}'::jsonb)
  ), selected as (
    select rc.id claim_id, c.rule_key, c.title, c.conditions, c.outcome,
           rc.effective_from, rc.claim_hash,
           rc.conditions ->> 'referenceLabel' reference_label
    from candidates c
    join public.regulatory_claims rc on rc.conditions ->> 'sectionKey' = c.section_key
    join public.regulatory_document_versions v on v.id = rc.version_id
    join public.regulatory_documents d on d.id = v.document_id
    where d.canonical_identifier = 'LEY-21719'
      and rc.claim_type = 'obligation'
      and rc.validation_status = 'pending'
  ), ins as (
    insert into public.compliance_applicability_rules (
      rule_key, rule_version, claim_id, source_kind, title, description,
      conditions, outcome, validation_status, requires_human_review,
      effective_from, content_hash
    )
    select s.rule_key, 1, s.claim_id, 'regulatory_claim', s.title,
      concat('Regla candidata derivada de ', coalesce(s.reference_label, 'Ley 21.719'), '. Requiere validación jurídica antes de uso productivo.'),
      s.conditions, s.outcome, 'pending', true, s.effective_from,
      encode(extensions.digest(convert_to(concat_ws('|', s.rule_key, '1', s.claim_id::text, s.conditions::text, s.outcome::text, coalesce(s.claim_hash,'')), 'UTF8'), 'sha256'), 'hex')
    from selected s
    on conflict (rule_key, rule_version) do nothing
    returning 1
  )
  select count(*) into inserted_count from ins;

  select count(*) into existing_count
  from public.compliance_applicability_rules
  where rule_key like 'ley21719.%' and rule_version = 1;

  return jsonb_build_object('inserted', inserted_count, 'total_candidates', existing_count, 'validation_status', 'pending', 'requires_human_review', true);
end;
$$;

revoke all on function public.generate_ley21719_candidate_rules_v1() from public, anon, authenticated;
grant execute on function public.generate_ley21719_candidate_rules_v1() to service_role;

create or replace function public.preview_organization_applicability_v1(p_profile_id uuid)
returns table (
  rule_id uuid,
  rule_key text,
  title text,
  claim_id uuid,
  result text,
  reason jsonb,
  priority text,
  effective_from date
)
language sql
security invoker
set search_path = ''
as $$
  select
    r.id,
    r.rule_key,
    r.title,
    r.claim_id,
    e.evaluation ->> 'status',
    coalesce(e.evaluation -> 'reasons', '[]'::jsonb),
    coalesce(r.outcome ->> 'priority', 'medium'),
    r.effective_from
  from public.organization_compliance_profiles p
  join public.compliance_applicability_rules r
    on r.validation_status = 'pending'
   and r.requires_human_review = true
   and r.rule_key like 'ley21719.%'
   and (r.effective_to is null or r.effective_to >= current_date)
  cross join lateral (
    select private.evaluate_compliance_conditions(
      jsonb_build_object(
        'industry_codes', to_jsonb(p.industry_codes),
        'regions', to_jsonb(p.regions),
        'employee_count', p.employee_count,
        'annual_revenue_clp', p.annual_revenue_clp,
        'activities', p.activities,
        'processes', p.processes,
        'permits', p.permits,
        'attributes', p.attributes
      ),
      r.conditions
    ) evaluation
  ) e
  where p.id = p_profile_id
  order by case e.evaluation ->> 'status' when 'match' then 1 when 'needs_review' then 2 else 3 end,
           r.rule_key;
$$;

revoke all on function public.preview_organization_applicability_v1(uuid) from public, anon, authenticated;
grant execute on function public.preview_organization_applicability_v1(uuid) to service_role;
