-- Verifica claims determinísticos y citas exactas de la Ley 21.719.

do $$
declare
  target_version uuid;
  claim_total integer;
  citation_total integer;
  missing_citations integer;
  quote_mismatches integer;
  quote_hash_mismatches integer;
  duplicate_hashes integer;
  non_pending integer;
  invalid_claim_hashes integer;
  invalid_offsets integer;
begin
  select v.id into target_version
  from public.regulatory_document_versions v
  join public.regulatory_documents d on d.id=v.document_id
  where d.canonical_identifier='LEY-21719'
    and v.parser_version='leychile-official-json-v3'
  order by v.version_number desc
  limit 1;

  if target_version is null then
    raise exception 'ley_21719_v3_not_found';
  end if;

  select count(*) into claim_total
  from public.regulatory_claims c
  where c.version_id=target_version
    and c.extractor_version='ley21719-claims-v1';

  select count(*) into citation_total
  from public.regulatory_claim_citations cc
  join public.regulatory_claims c on c.id=cc.claim_id
  where c.version_id=target_version
    and c.extractor_version='ley21719-claims-v1';

  select count(*) into missing_citations
  from public.regulatory_claims c
  where c.version_id=target_version
    and c.extractor_version='ley21719-claims-v1'
    and not exists (
      select 1 from public.regulatory_claim_citations cc where cc.claim_id=c.id
    );

  select count(*) into quote_mismatches
  from public.regulatory_claim_citations cc
  join public.regulatory_claims c on c.id=cc.claim_id
  join public.regulatory_document_sections s on s.id=cc.section_id
  where c.version_id=target_version
    and c.extractor_version='ley21719-claims-v1'
    and cc.exact_quote is distinct from s.body_text;

  select count(*) into quote_hash_mismatches
  from public.regulatory_claim_citations cc
  join public.regulatory_claims c on c.id=cc.claim_id
  where c.version_id=target_version
    and c.extractor_version='ley21719-claims-v1'
    and cc.quote_hash <> encode(
      extensions.digest(pg_catalog.convert_to(cc.exact_quote,'UTF8'),'sha256'),
      'hex'
    );

  select count(*) into duplicate_hashes
  from (
    select c.claim_hash
    from public.regulatory_claims c
    where c.version_id=target_version
      and c.extractor_version='ley21719-claims-v1'
    group by c.claim_hash
    having count(*) > 1
  ) duplicates;

  select count(*) into non_pending
  from public.regulatory_claims c
  where c.version_id=target_version
    and c.extractor_version='ley21719-claims-v1'
    and c.validation_status <> 'pending';

  select count(*) into invalid_claim_hashes
  from public.regulatory_claims c
  where c.version_id=target_version
    and c.extractor_version='ley21719-claims-v1'
    and (c.claim_hash is null or c.claim_hash !~ '^[a-f0-9]{64}$');

  select count(*) into invalid_offsets
  from public.regulatory_claim_citations cc
  join public.regulatory_claims c on c.id=cc.claim_id
  where c.version_id=target_version
    and c.extractor_version='ley21719-claims-v1'
    and (cc.start_offset <> 0 or cc.end_offset <> char_length(cc.exact_quote));

  if claim_total <> 186 then raise exception 'unexpected_claim_count:%', claim_total; end if;
  if citation_total <> claim_total then raise exception 'citation_count_mismatch:%/%', citation_total,claim_total; end if;
  if missing_citations <> 0 then raise exception 'claims_without_citations:%',missing_citations; end if;
  if quote_mismatches <> 0 then raise exception 'citation_quote_mismatches:%',quote_mismatches; end if;
  if quote_hash_mismatches <> 0 then raise exception 'citation_hash_mismatches:%',quote_hash_mismatches; end if;
  if duplicate_hashes <> 0 then raise exception 'duplicate_claim_hashes:%',duplicate_hashes; end if;
  if non_pending <> 0 then raise exception 'claims_not_pending:%',non_pending; end if;
  if invalid_claim_hashes <> 0 then raise exception 'invalid_claim_hashes:%',invalid_claim_hashes; end if;
  if invalid_offsets <> 0 then raise exception 'invalid_citation_offsets:%',invalid_offsets; end if;
end $$;

select
  c.claim_type,
  count(*) as claims,
  count(*) filter (where c.validation_status='pending') as pending,
  count(distinct c.section_id) as cited_sections
from public.regulatory_claims c
join public.regulatory_document_versions v on v.id=c.version_id
join public.regulatory_documents d on d.id=v.document_id
where d.canonical_identifier='LEY-21719'
  and v.parser_version='leychile-official-json-v3'
  and c.extractor_version='ley21719-claims-v1'
group by c.claim_type
order by c.claim_type;

select
  r.id,
  r.status,
  r.candidate_count,
  r.inserted_claims,
  r.existing_claims,
  r.inserted_citations,
  r.counts,
  r.started_at,
  r.completed_at
from public.regulatory_claim_extraction_runs r
join public.regulatory_document_versions v on v.id=r.version_id
join public.regulatory_documents d on d.id=v.document_id
where d.canonical_identifier='LEY-21719'
  and r.extractor_version='ley21719-claims-v1'
order by r.created_at desc;
