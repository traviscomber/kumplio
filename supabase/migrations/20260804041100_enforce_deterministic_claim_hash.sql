begin;

alter table public.regulatory_claims
  drop constraint if exists regulatory_claims_deterministic_metadata_check;

alter table public.regulatory_claims
  add constraint regulatory_claims_deterministic_metadata_check
    check (
      extraction_method <> 'deterministic'
      or (
        claim_hash is not null
        and claim_hash ~ '^[a-f0-9]{64}$'
        and nullif(btrim(extractor_version), '') is not null
        and nullif(btrim(extraction_rule), '') is not null
      )
    );

commit;
