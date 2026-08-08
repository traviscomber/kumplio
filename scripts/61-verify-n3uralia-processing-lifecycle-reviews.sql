-- Read-only verification for the three N3uralia lifecycle reviews.

begin;
set transaction read only;

do $verify$
declare
  v_organization_id uuid;
  v_count integer;
begin
  select organization.id
  into v_organization_id
  from public.organizations organization
  where lower(btrim(organization.name)) = 'n3uralia'
  limit 1;

  if v_organization_id is null then
    raise exception 'N3uralia organization not found.';
  end if;

  select count(*)
  into v_count
  from public.processing_activity_lifecycle_reviews review
  join public.organization_processes process on process.id = review.process_id
  where review.organization_id = v_organization_id
    and process.name in (
      'Gestión de contactos comerciales y solicitudes de demostración',
      'Gestión de cuentas, autenticación y acceso al workspace',
      'Gestión de expedientes y análisis asistido por especialistas IA'
    );

  if v_count <> 3 then
    raise exception 'Expected exactly three lifecycle reviews, found %.', v_count;
  end if;

  if exists (
    select 1
    from public.processing_activity_lifecycle_reviews review
    join public.organization_processes process on process.id = review.process_id
    where review.organization_id = v_organization_id
      and process.name in (
        'Gestión de contactos comerciales y solicitudes de demostración',
        'Gestión de cuentas, autenticación y acceso al workspace',
        'Gestión de expedientes y análisis asistido por especialistas IA'
      )
      and (
        review.version <> 1
        or review.decision <> 'changes_requested'
        or review.basis_status <> 'pending_evidence'
        or review.retention_status <> 'needs_changes'
        or review.recipients_status <> 'pending_evidence'
        or review.subprocessors_status <> 'pending_evidence'
        or review.transfers_status <> 'pending_evidence'
        or cardinality(review.unknowns) < 7
        or jsonb_array_length(review.recipients) < 1
        or jsonb_array_length(review.subprocessors) < 1
        or jsonb_array_length(review.transfers) < 1
        or jsonb_array_length(review.source_refs) < 2
        or review.snapshot_hash !~ '^[0-9a-f]{64}$'
      )
  ) then
    raise exception 'A lifecycle review overstates its conclusion or lost required evidence and unknowns.';
  end if;

  if exists (
    select 1
    from public.processing_activity_lifecycle_reviews review
    join public.evidence evidence on evidence.id = review.evidence_id
    where review.organization_id = v_organization_id
      and (
        evidence.organization_id <> review.organization_id
        or evidence.project_id <> review.project_id
        or evidence.validation_status <> 'accepted'
        or evidence.integrity_status <> 'verified'
        or evidence.integrity_hash <> review.snapshot_hash
        or evidence.metadata ->> 'scope' <> 'processing_activity_lifecycle_review'
      )
  ) then
    raise exception 'Lifecycle evidence is not accepted, verified and tenant-scoped.';
  end if;

  if (
    select count(*)
    from public.processing_activity_evidence link
    join public.processing_activity_lifecycle_reviews review
      on review.process_id = link.process_id
     and review.evidence_id = link.evidence_id
     and review.organization_id = link.organization_id
    where review.organization_id = v_organization_id
      and link.relationship_type = 'supporting'
  ) <> 3 then
    raise exception 'Expected exactly three lifecycle evidence links.';
  end if;

  if exists (
    select 1
    from public.processing_activity_lifecycle_reviews review
    where review.organization_id = v_organization_id
      and (review.project_id is null or review.process_id is null or review.reviewed_by is null)
  ) then
    raise exception 'Lifecycle review lost project, process or reviewer accountability.';
  end if;

  if (
    select count(*)
    from public.compliance_case_events event
    where event.organization_id = v_organization_id
      and event.event_type = 'processing_activity_lifecycle_reviewed'
  ) <> 3 then
    raise exception 'Expected exactly three lifecycle review case events.';
  end if;
end;
$verify$;

with n3uralia as (
  select organization.id
  from public.organizations organization
  where lower(btrim(organization.name)) = 'n3uralia'
  limit 1
)
select jsonb_build_object(
  'status', 'passed',
  'organizationId', (select id from n3uralia),
  'reviews', (
    select jsonb_agg(jsonb_build_object(
      'process', process.name,
      'version', review.version,
      'decision', review.decision,
      'basis', review.basis_status,
      'retention', review.retention_status,
      'recipients', review.recipients_status,
      'subprocessors', review.subprocessors_status,
      'transfers', review.transfers_status,
      'unknowns', cardinality(review.unknowns),
      'snapshotHash', review.snapshot_hash,
      'evidenceAccepted', evidence.validation_status = 'accepted',
      'integrityVerified', evidence.integrity_status = 'verified'
    ) order by process.name)
    from public.processing_activity_lifecycle_reviews review
    join public.organization_processes process on process.id = review.process_id
    join public.evidence evidence on evidence.id = review.evidence_id
    where review.organization_id = (select id from n3uralia)
  )
) as verification;

rollback;
