begin;

alter table public.regulatory_claims
  add column if not exists claim_hash text,
  add column if not exists extractor_version text,
  add column if not exists extraction_rule text;

alter table public.regulatory_claims
  drop constraint if exists regulatory_claims_claim_hash_check,
  drop constraint if exists regulatory_claims_deterministic_metadata_check;

alter table public.regulatory_claims
  add constraint regulatory_claims_claim_hash_check
    check (claim_hash is null or claim_hash ~ '^[a-f0-9]{64}$'),
  add constraint regulatory_claims_deterministic_metadata_check
    check (
      extraction_method <> 'deterministic'
      or (
        claim_hash ~ '^[a-f0-9]{64}$'
        and nullif(btrim(extractor_version), '') is not null
        and nullif(btrim(extraction_rule), '') is not null
      )
    );

create unique index if not exists regulatory_claims_version_hash_uidx
  on public.regulatory_claims(version_id, claim_hash);
create index if not exists regulatory_claims_extractor_idx
  on public.regulatory_claims(extractor_version, claim_type, validation_status);

create table if not exists public.regulatory_claim_extraction_runs (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.regulatory_document_versions(id) on delete restrict,
  extractor_version text not null,
  source_hash text not null check (source_hash ~ '^[a-f0-9]{64}$'),
  status text not null default 'running'
    check (status in ('running','succeeded','unchanged','failed')),
  candidate_count integer not null default 0 check (candidate_count >= 0),
  inserted_claims integer not null default 0 check (inserted_claims >= 0),
  existing_claims integer not null default 0 check (existing_claims >= 0),
  inserted_citations integer not null default 0 check (inserted_citations >= 0),
  counts jsonb not null default '{}'::jsonb,
  error_code text,
  error_message text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists regulatory_claim_extraction_runs_version_idx
  on public.regulatory_claim_extraction_runs(version_id, created_at desc);
create index if not exists regulatory_claim_extraction_runs_status_idx
  on public.regulatory_claim_extraction_runs(status, created_at desc);

alter table public.regulatory_claim_extraction_runs enable row level security;
revoke all on table public.regulatory_claim_extraction_runs from anon, authenticated;
grant select on table public.regulatory_claim_extraction_runs to authenticated;
grant all on table public.regulatory_claim_extraction_runs to service_role;

drop policy if exists regulatory_claim_extraction_runs_read_authenticated
  on public.regulatory_claim_extraction_runs;
create policy regulatory_claim_extraction_runs_read_authenticated
  on public.regulatory_claim_extraction_runs
  for select to authenticated
  using (status in ('succeeded','unchanged'));

create or replace function public.extract_regulatory_claims_deterministic(
  p_version_id uuid,
  p_extractor_version text default 'ley21719-claims-v1'
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
#variable_conflict use_variable
declare
  version_row public.regulatory_document_versions;
  run_id uuid;
  candidate record;
  claim_id uuid;
  citation_id uuid;
  deterministic_hash text;
  exact_quote_hash text;
  inferred_subject text;
  candidate_total integer := 0;
  claims_inserted integer := 0;
  claims_existing integer := 0;
  citations_inserted integer := 0;
  obligation_count integer := 0;
  right_count integer := 0;
  prohibition_count integer := 0;
  deadline_count integer := 0;
  sanction_count integer := 0;
  result_status text;
begin
  if nullif(btrim(p_extractor_version), '') is null then
    raise exception 'extractor_version_required';
  end if;

  select * into version_row
  from public.regulatory_document_versions v
  where v.id = p_version_id;

  if version_row.id is null then
    raise exception 'regulatory_version_not_found';
  end if;

  if version_row.status not in ('parsed','verified') then
    raise exception 'regulatory_version_not_extractable';
  end if;

  if not exists (
    select 1 from public.regulatory_document_sections s
    where s.version_id = p_version_id and s.section_type = 'inciso'
  ) then
    raise exception 'regulatory_sections_not_found';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_version_id::text || ':' || p_extractor_version, 81)
  );

  insert into public.regulatory_claim_extraction_runs(
    version_id, extractor_version, source_hash, status
  ) values (
    p_version_id, btrim(p_extractor_version), version_row.content_hash, 'running'
  ) returning id into run_id;

  for candidate in
    with base as (
      select
        s.id,
        s.section_key,
        s.reference_label,
        s.body_text,
        s.normalized_text
      from public.regulatory_document_sections s
      where s.version_id = p_version_id
        and s.section_type = 'inciso'
        and s.normalized_text !~* '^\s*(?:[0-9]+\)|[a-z]\)|[ivxlcdm]+\.)?\s*(?:en\s+(?:el|la|los|las)\s+art[ií]culo|reempl[aá]z|sustit[uú]y|agr[eé]g|incorp[oó]r|interc[aá]l|supr[ií]m|modif[ií]c|introd[uú]c)'
    ), candidates as (
      select
        b.*, 'obligation'::text as claim_type,
        'explicit_modal_duty_v1'::text as rule_id,
        0.96::numeric as confidence
      from base b
      where b.normalized_text ~* '(\mdebe\M|\mdeben\M|\mdeberá\M|\mdeberán\M|está\s+obligad[oa]|están\s+obligad[oa]s|queda[n]?\s+sujet[oa]s?\s+a\s+la\s+obligación)'

      union all

      select
        b.*, 'right', 'explicit_right_v1', 0.99::numeric
      from base b
      where b.normalized_text ~* '(tiene[n]?\s+derecho|derecho\s+que\s+le\s+asiste|derecho\s+que\s+les\s+asiste)'

      union all

      select
        b.*, 'prohibition', 'explicit_prohibition_v1', 0.99::numeric
      from base b
      where b.normalized_text ~* '(se\s+prohíbe|queda[n]?\s+prohibid[oa]s?|no\s+(?:se\s+)?podrá[n]?)'

      union all

      select
        b.*, 'deadline', 'explicit_deadline_v1', 0.95::numeric
      from base b
      where b.normalized_text ~* '(dentro\s+del\s+plazo|en\s+el\s+plazo\s+de|plazo\s+no\s+mayor\s+a|dispone\s+de\s+un\s+plazo\s+de|dentro\s+de\s+(?:los\s+|un\s+)?[a-záéíóú0-9]+\s+(?:días?|meses?|años?|horas?)|a\s+más\s+tardar|sin\s+dilaciones\s+indebidas|por\s+un\s+término\s+de\s+[a-záéíóú0-9]+\s+(?:días?|meses?|años?)|hasta\s+por\s+[a-záéíóú0-9]+\s+(?:días?|meses?|años?))'

      union all

      select
        b.*, 'sanction', 'explicit_sanction_v1', 0.99::numeric
      from base b
      where b.normalized_text ~* '(será[n]?\s+sancionad[oa]s?|multa\s+de\s+hasta|amonestación\s+escrita|recargo\s+de\s+50%|suspensión\s+de\s+las\s+operaciones)'
    )
    select * from candidates
    order by claim_type, reference_label, section_key
  loop
    candidate_total := candidate_total + 1;

    case candidate.claim_type
      when 'obligation' then obligation_count := obligation_count + 1;
      when 'right' then right_count := right_count + 1;
      when 'prohibition' then prohibition_count := prohibition_count + 1;
      when 'deadline' then deadline_count := deadline_count + 1;
      when 'sanction' then sanction_count := sanction_count + 1;
    end case;

    inferred_subject := case
      when candidate.claim_type = 'right' then 'titular de datos'
      when candidate.normalized_text ~* 'responsables\s+de\s+datos' then 'responsables de datos'
      when candidate.normalized_text ~* 'responsable\s+de\s+datos' then 'responsable de datos'
      when candidate.normalized_text ~* 'responsable\s+del\s+tratamiento' then 'responsable del tratamiento'
      when candidate.normalized_text ~* 'tercero\s+mandatario\s+o\s+encargado' then 'tercero mandatario o encargado'
      when candidate.normalized_text ~* 'delegado\s+de\s+protección\s+de\s+datos' then 'delegado de protección de datos'
      when candidate.normalized_text ~* 'jefe\s+superior\s+del\s+órgano\s+público' then 'jefe superior del órgano público'
      when candidate.normalized_text ~* 'órganos\s+públicos' then 'órganos públicos'
      when candidate.normalized_text ~* 'la\s+agencia' then 'Agencia de Protección de Datos Personales'
      when candidate.normalized_text ~* 'titular\s+de\s+datos' then 'titular de datos'
      when candidate.normalized_text ~* '\mtitular\M' then 'titular'
      else null
    end;

    deterministic_hash := encode(
      extensions.digest(
        pg_catalog.convert_to(
          p_version_id::text || '|' || candidate.id::text || '|' || candidate.claim_type || '|' || candidate.normalized_text,
          'UTF8'
        ),
        'sha256'
      ),
      'hex'
    );

    exact_quote_hash := encode(
      extensions.digest(
        pg_catalog.convert_to(candidate.body_text, 'UTF8'),
        'sha256'
      ),
      'hex'
    );

    claim_id := null;
    citation_id := null;

    insert into public.regulatory_claims(
      version_id,
      section_id,
      parent_claim_id,
      claim_type,
      claim_text,
      subject,
      conditions,
      effective_from,
      effective_to,
      extraction_method,
      confidence,
      validation_status,
      created_by,
      claim_hash,
      extractor_version,
      extraction_rule
    ) values (
      p_version_id,
      candidate.id,
      null,
      candidate.claim_type,
      candidate.normalized_text,
      inferred_subject,
      jsonb_build_object(
        'deterministicKey', deterministic_hash,
        'ruleId', candidate.rule_id,
        'extractorVersion', p_extractor_version,
        'referenceLabel', candidate.reference_label,
        'sectionKey', candidate.section_key,
        'sourceVersionId', p_version_id,
        'quoteScope', 'full_section',
        'exactText', true,
        'requiresHumanReview', true
      ),
      version_row.valid_from,
      version_row.valid_to,
      'deterministic',
      candidate.confidence,
      'pending',
      null,
      deterministic_hash,
      p_extractor_version,
      candidate.rule_id
    )
    on conflict (version_id, claim_hash) do nothing
    returning id into claim_id;

    if claim_id is null then
      select c.id into claim_id
      from public.regulatory_claims c
      where c.version_id = p_version_id
        and c.claim_hash = deterministic_hash;
      claims_existing := claims_existing + 1;
    else
      claims_inserted := claims_inserted + 1;
    end if;

    if claim_id is null then
      raise exception 'deterministic_claim_identity_not_resolved';
    end if;

    insert into public.regulatory_claim_citations(
      claim_id,
      section_id,
      exact_quote,
      quote_hash,
      start_offset,
      end_offset
    ) values (
      claim_id,
      candidate.id,
      candidate.body_text,
      exact_quote_hash,
      0,
      char_length(candidate.body_text)
    )
    on conflict (claim_id, section_id, quote_hash) do nothing
    returning id into citation_id;

    if citation_id is not null then
      citations_inserted := citations_inserted + 1;
    end if;
  end loop;

  result_status := case
    when claims_inserted = 0 and citations_inserted = 0 then 'unchanged'
    else 'succeeded'
  end;

  update public.regulatory_claim_extraction_runs
  set status = result_status,
      candidate_count = candidate_total,
      inserted_claims = claims_inserted,
      existing_claims = claims_existing,
      inserted_citations = citations_inserted,
      counts = jsonb_build_object(
        'obligation', obligation_count,
        'right', right_count,
        'prohibition', prohibition_count,
        'deadline', deadline_count,
        'sanction', sanction_count
      ),
      completed_at = now()
  where id = run_id;

  return jsonb_build_object(
    'runId', run_id,
    'status', result_status,
    'versionId', p_version_id,
    'extractorVersion', p_extractor_version,
    'candidateCount', candidate_total,
    'insertedClaims', claims_inserted,
    'existingClaims', claims_existing,
    'insertedCitations', citations_inserted,
    'counts', jsonb_build_object(
      'obligation', obligation_count,
      'right', right_count,
      'prohibition', prohibition_count,
      'deadline', deadline_count,
      'sanction', sanction_count
    ),
    'validationStatus', 'pending',
    'humanReviewRequired', true
  );
exception when others then
  if run_id is not null then
    update public.regulatory_claim_extraction_runs
    set status = 'failed',
        error_code = sqlstate,
        error_message = left(sqlerrm, 1000),
        completed_at = now()
    where id = run_id;
  end if;
  raise;
end;
$$;

revoke all on function public.extract_regulatory_claims_deterministic(uuid,text)
  from public, anon, authenticated;
grant execute on function public.extract_regulatory_claims_deterministic(uuid,text)
  to service_role;

commit;
