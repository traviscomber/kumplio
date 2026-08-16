-- Read-only verification for Block 16 lifecycle V2 (N3uralia, 3 real activities).
-- This script must not mutate production data.

DO $$
DECLARE
  v_count integer;
BEGIN
  WITH target(process_id) AS (
    VALUES
      ('26233189-3335-43e6-b382-99fcf2cc4090'::uuid),
      ('a1c53fdb-d8c3-42aa-a31b-1429ab5ae7d1'::uuid),
      ('f3cd212a-3e27-4f27-a722-545e4c44c8b1'::uuid)
  ), latest AS (
    SELECT DISTINCT ON (r.process_id) r.*
    FROM public.processing_activity_lifecycle_reviews r
    JOIN target t ON t.process_id = r.process_id
    WHERE r.organization_id = 'ab928c42-b8f0-44f8-bcf0-d8267398f9b1'::uuid
    ORDER BY r.process_id, r.version DESC
  )
  SELECT count(*) INTO v_count
  FROM latest l
  JOIN public.processing_activity_lifecycle_reviews previous ON previous.id = l.supersedes_id
  JOIN public.evidence e ON e.id = l.evidence_id AND e.organization_id = l.organization_id
  JOIN public.organization_processes p ON p.id = l.process_id AND p.organization_id = l.organization_id
  WHERE l.version = 2
    AND previous.version = 1
    AND l.decision = 'changes_requested'
    AND l.basis_status = 'pending_evidence'
    AND l.retention_status = 'needs_changes'
    AND l.recipients_status = 'pending_evidence'
    AND l.subprocessors_status = 'pending_evidence'
    AND l.transfers_status = 'pending_evidence'
    AND e.validation_status = 'accepted'
    AND e.integrity_status = 'verified'
    AND e.integrity_hash = l.snapshot_hash
    AND p.attributes ->> 'latestLifecycleReviewId' = l.id::text;

  IF v_count <> 3 THEN
    RAISE EXCEPTION 'Lifecycle V2 verification failed: expected 3 valid latest reviews, observed %', v_count;
  END IF;

  WITH target(process_id) AS (
    VALUES
      ('26233189-3335-43e6-b382-99fcf2cc4090'::uuid),
      ('a1c53fdb-d8c3-42aa-a31b-1429ab5ae7d1'::uuid),
      ('f3cd212a-3e27-4f27-a722-545e4c44c8b1'::uuid)
  ), latest AS (
    SELECT DISTINCT ON (r.process_id) r.*
    FROM public.processing_activity_lifecycle_reviews r
    JOIN target t ON t.process_id = r.process_id
    WHERE r.organization_id = 'ab928c42-b8f0-44f8-bcf0-d8267398f9b1'::uuid
    ORDER BY r.process_id, r.version DESC
  )
  SELECT count(*) INTO v_count
  FROM latest
  WHERE decision = 'approved'
     OR basis_status = 'validated'
     OR retention_status = 'validated'
     OR recipients_status = 'validated'
     OR subprocessors_status = 'validated'
     OR transfers_status = 'validated';

  IF v_count <> 0 THEN
    RAISE EXCEPTION 'Lifecycle V2 overstatement detected: % latest reviews contain approved/validated state', v_count;
  END IF;
END $$;

WITH target(process_id) AS (
  VALUES
    ('26233189-3335-43e6-b382-99fcf2cc4090'::uuid),
    ('a1c53fdb-d8c3-42aa-a31b-1429ab5ae7d1'::uuid),
    ('f3cd212a-3e27-4f27-a722-545e4c44c8b1'::uuid)
), latest AS (
  SELECT DISTINCT ON (r.process_id) r.*
  FROM public.processing_activity_lifecycle_reviews r
  JOIN target t ON t.process_id = r.process_id
  WHERE r.organization_id = 'ab928c42-b8f0-44f8-bcf0-d8267398f9b1'::uuid
  ORDER BY r.process_id, r.version DESC
)
SELECT
  p.name,
  l.version,
  l.id AS review_id,
  l.supersedes_id,
  l.decision,
  l.basis_status,
  l.retention_status,
  l.recipients_status,
  l.subprocessors_status,
  l.transfers_status,
  cardinality(l.unknowns) AS unknown_count,
  l.snapshot_hash,
  e.id AS evidence_id,
  e.validation_status,
  e.integrity_status,
  e.integrity_hash = l.snapshot_hash AS hash_matches,
  p.attributes ->> 'latestLifecycleReviewId' = l.id::text AS process_points_to_latest
FROM latest l
JOIN public.organization_processes p ON p.id = l.process_id AND p.organization_id = l.organization_id
JOIN public.evidence e ON e.id = l.evidence_id
ORDER BY p.name;
