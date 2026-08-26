-- Reconcile production hardening for two legacy invoice RPCs discovered by
-- Supabase Security Advisor on 2026-08-26.
--
-- Production contained these functions outside the current migration history.
-- The existence guards keep cold-start/replay safe if those legacy functions
-- are absent, while preserving the effective production boundary when present.
-- Browser roles are intentionally denied; trusted server roles remain explicit.

DO $$
BEGIN
  IF to_regprocedure('public.register_invoice_payment(uuid,numeric,text,timestamptz,text,text)') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.register_invoice_payment(uuid, numeric, text, timestamptz, text, text)
      FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.register_invoice_payment(uuid, numeric, text, timestamptz, text, text)
      TO service_role, postgres;
  END IF;

  IF to_regprocedure('public.set_invoice_lifecycle(uuid,text,date)') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.set_invoice_lifecycle(uuid, text, date)
      FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.set_invoice_lifecycle(uuid, text, date)
      TO service_role, postgres;
  END IF;
END
$$;
