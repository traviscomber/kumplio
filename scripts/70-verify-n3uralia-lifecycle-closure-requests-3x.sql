-- Read-only verification for Block 16 Lifecycle V2 closure packages.

DO $$
DECLARE
  v_count integer;
BEGIN
  SELECT count(*) INTO v_count
  FROM public.evidence_requests r
  WHERE r.organization_id = 'ab928c42-b8f0-44f8-bcf0-d8267398f9b1'::uuid
    AND r.id IN (
      '2fceba00-20fa-4ed9-bfeb-ac1b7b5bf42c'::uuid,
      'ec63fc76-9045-485a-a4ce-3eb63dfda4f7'::uuid,
      'c943358b-b23c-4374-97d9-fc42f7e09518'::uuid
    )
    AND r.status = 'open'
    AND r.requested_from = '05a0536f-2f8b-438f-b945-e685f40af447'::uuid
    AND r.due_at = '2026-08-30T23:59:00-04:00'::timestamptz
    AND r.submitted_evidence_id IS NULL;

  IF v_count <> 3 THEN
    RAISE EXCEPTION 'Lifecycle closure request verification failed: expected 3 open unsubmitted packages, observed %', v_count;
  END IF;

  SELECT count(*) INTO v_count
  FROM public.evidence_requests r
  WHERE r.organization_id = 'ab928c42-b8f0-44f8-bcf0-d8267398f9b1'::uuid
    AND r.title IN (
      'Paquete de cierre lifecycle — contactos comerciales',
      'Paquete de cierre lifecycle — cuentas y acceso',
      'Paquete de cierre lifecycle — expedientes e IA'
    );

  IF v_count <> 3 THEN
    RAISE EXCEPTION 'Lifecycle closure package title duplication detected: expected exactly 3 records, observed %', v_count;
  END IF;
END $$;

SELECT id,title,status,requested_from,due_at,submitted_evidence_id
FROM public.evidence_requests
WHERE organization_id = 'ab928c42-b8f0-44f8-bcf0-d8267398f9b1'::uuid
  AND id IN (
    '2fceba00-20fa-4ed9-bfeb-ac1b7b5bf42c'::uuid,
    'ec63fc76-9045-485a-a4ce-3eb63dfda4f7'::uuid,
    'c943358b-b23c-4374-97d9-fc42f7e09518'::uuid
  )
ORDER BY title;
