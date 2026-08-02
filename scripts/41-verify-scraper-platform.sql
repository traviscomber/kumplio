-- Read-only verifier for KUMPLIO Scraper Platform
DO $$
DECLARE
  missing text[];
BEGIN
  SELECT array_agg(name) INTO missing
  FROM (VALUES
    ('scraper_connectors'),('scraper_runs'),('scraper_run_events')
  ) expected(name)
  WHERE to_regclass('public.' || name) IS NULL;
  IF missing IS NOT NULL THEN RAISE EXCEPTION 'Missing scraper tables: %', missing; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname='enqueue_scraper_run' AND NOT p.prosecdef
  ) THEN RAISE EXCEPTION 'enqueue_scraper_run missing or not SECURITY INVOKER'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname='claim_scraper_run' AND NOT p.prosecdef
  ) THEN RAISE EXCEPTION 'claim_scraper_run missing or not SECURITY INVOKER'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname='complete_scraper_run' AND NOT p.prosecdef
  ) THEN RAISE EXCEPTION 'complete_scraper_run missing or not SECURITY INVOKER'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname='fail_scraper_run' AND NOT p.prosecdef
  ) THEN RAISE EXCEPTION 'fail_scraper_run missing or not SECURITY INVOKER'; END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.role_routine_grants
    WHERE routine_schema='public'
      AND routine_name IN ('enqueue_scraper_run','claim_scraper_run','complete_scraper_run','fail_scraper_run')
      AND grantee IN ('anon','authenticated','PUBLIC')
  ) THEN RAISE EXCEPTION 'Scraper transition functions exposed outside service_role'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='scraper_runs_active_idempotency_uidx'
  ) THEN RAISE EXCEPTION 'Active idempotency index missing'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='scraper_runs_queue_idx'
  ) THEN RAISE EXCEPTION 'Queue index missing'; END IF;

  IF (SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename IN ('scraper_connectors','scraper_runs','scraper_run_events')) < 3 THEN
    RAISE EXCEPTION 'Expected scraper RLS policies missing';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.table_privileges
    WHERE table_schema='public'
      AND table_name IN ('scraper_connectors','scraper_runs','scraper_run_events')
      AND grantee='anon'
  ) THEN RAISE EXCEPTION 'Anon has scraper table privileges'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.scraper_connectors
    WHERE connector_key='leychile-controlled-html'
      AND status='manual'
      AND circuit_state='closed'
  ) THEN RAISE EXCEPTION 'LeyChile connector not registered in scraper platform'; END IF;
END $$;

SELECT connector_key,status,circuit_state,parser_health,max_attempts,failure_threshold
FROM public.scraper_connectors
ORDER BY connector_key;
