begin;

create or replace function private.infer_regulatory_claim_subject_v1(
  p_text text,
  p_claim_type text
) returns text
language plpgsql
immutable
security invoker
set search_path = ''
as $$
declare
  actor text;
begin
  if p_claim_type = 'right' then
    return 'titular de datos';
  end if;

  if p_text ~* '^\s*todo\s+tratamiento\s+de\s+datos\s+personales' then
    return null;
  end if;

  if p_claim_type = 'sanction' then
    if p_text ~* 'las\s+infracciones\s+leves\s+serán\s+sancionadas' then return 'infracciones leves'; end if;
    if p_text ~* 'las\s+infracciones\s+graves\s+serán\s+sancionadas' then return 'infracciones graves'; end if;
    if p_text ~* 'las\s+infracciones\s+gravísimas\s+serán\s+sancionadas' then return 'infracciones gravísimas'; end if;
  end if;

  select (pg_catalog.regexp_match(
    p_text,
    '(los responsables de datos|el responsable de datos|el responsable del tratamiento|los responsables|el responsable|el tercero mandatario o encargado|el encargado|el delegado de protección de datos|el jefe superior del órgano público|los órganos públicos|el órgano público|los funcionarios|el titular de datos|el titular|la Agencia)[^.;:]{0,160}[[:space:]](debe|deben|deberá|deberán|está obligado|están obligados|no podrá|no podrán|será sancionado|serán sancionadas)',
    'i'
  ))[1] into actor;

  if actor is null then
    return null;
  end if;

  actor := lower(btrim(actor));

  return case
    when actor = 'los responsables de datos' then 'responsables de datos'
    when actor = 'el responsable de datos' then 'responsable de datos'
    when actor = 'el responsable del tratamiento' then 'responsable del tratamiento'
    when actor = 'los responsables' then 'responsables'
    when actor = 'el responsable' then 'responsable'
    when actor = 'el tercero mandatario o encargado' then 'tercero mandatario o encargado'
    when actor = 'el encargado' then 'encargado'
    when actor = 'el delegado de protección de datos' then 'delegado de protección de datos'
    when actor = 'el jefe superior del órgano público' then 'jefe superior del órgano público'
    when actor = 'los órganos públicos' then 'órganos públicos'
    when actor = 'el órgano público' then 'órgano público'
    when actor = 'los funcionarios' then 'funcionarios'
    when actor = 'el titular de datos' then 'titular de datos'
    when actor = 'el titular' then 'titular'
    when actor = 'la agencia' then 'Agencia de Protección de Datos Personales'
    else null
  end;
end;
$$;

revoke all on function private.infer_regulatory_claim_subject_v1(text,text)
  from public, anon, authenticated;
grant execute on function private.infer_regulatory_claim_subject_v1(text,text)
  to service_role;

update public.regulatory_claims c
set subject = private.infer_regulatory_claim_subject_v1(c.claim_text,c.claim_type)
where c.extraction_method='deterministic'
  and c.extractor_version='ley21719-claims-v1'
  and c.subject is distinct from private.infer_regulatory_claim_subject_v1(c.claim_text,c.claim_type);

commit;
