#!/usr/bin/env bash
set -eu

EXPECTED_BRANCH='agent/artifact-lineage-review-chain'
EXPECTED_PROJECT_REF='qhhybqfuenxojboymrsd'

if [ "${VERCEL_GIT_COMMIT_REF:-}" != "$EXPECTED_BRANCH" ]; then
  echo 'Skipping migration runner outside the controlled preview branch.'
  exit 0
fi

DATABASE_URL_VALUE="${POSTGRES_URL_NON_POOLING:-${POSTGRES_URL:-}}"
if [ -z "$DATABASE_URL_VALUE" ]; then
  echo 'Migration runner failed: no PostgreSQL connection variable is available.' >&2
  exit 1
fi

case "$DATABASE_URL_VALUE" in
  *"$EXPECTED_PROJECT_REF"*) ;;
  *)
    echo 'Migration runner failed: the database connection does not match the expected Supabase project.' >&2
    exit 1
    ;;
esac

if ! command -v psql >/dev/null 2>&1; then
  echo 'Migration runner failed: psql is not installed in the Vercel build image.' >&2
  exit 1
fi

echo 'Applying migration 10 to the expected Supabase project.'
psql "$DATABASE_URL_VALUE" -v ON_ERROR_STOP=1 -q -f scripts/10-agent-artifact-integrity.sql

VALIDATION_RESULT="$(psql "$DATABASE_URL_VALUE" -v ON_ERROR_STOP=1 -Atq <<'SQL'
select json_build_object(
  'artifact_columns', (
    select count(*)
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'agent_artifacts'
      and column_name in ('lineage_id', 'supersedes_artifact_id', 'content_hash', 'integrity_version')
  ),
  'review_columns', (
    select count(*)
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'agent_reviews'
      and column_name in ('previous_review_id', 'decision_hash', 'integrity_version', 'signed_at', 'reviewer_snapshot')
  ),
  'functions', (
    select count(*)
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('prepare_agent_artifact_integrity', 'prepare_agent_review_integrity', 'prevent_agent_review_mutation', 'record_agent_review')
  ),
  'triggers', (
    select count(*)
    from pg_trigger
    where not tgisinternal
      and tgname in ('agent_artifact_integrity_guard', 'agent_review_integrity_guard', 'agent_review_append_only')
  ),
  'missing_artifact_hashes', (
    select count(*) from public.agent_artifacts where content_hash is null or lineage_id is null
  ),
  'missing_review_hashes', (
    select count(*) from public.agent_reviews where decision_hash is null or signed_at is null
  )
)::text;
SQL
)"

echo "Migration validation: $VALIDATION_RESULT"

case "$VALIDATION_RESULT" in
  *'"artifact_columns" : 4'*'"review_columns" : 5'*'"functions" : 4'*'"triggers" : 3'*'"missing_artifact_hashes" : 0'*'"missing_review_hashes" : 0'*)
    echo 'Migration 10 applied and validated.'
    ;;
  *)
    echo 'Migration runner failed: schema validation did not return the expected result.' >&2
    exit 1
    ;;
esac
