import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  canonicalDiarioOficialEditionUrl,
  hashDiarioOficial,
  parseDiarioOficialEdition,
} from "./core.mjs";

const CONNECTOR_VERSION = "diario-oficial-summary-v1";
const MAX_BYTES = 8 * 1024 * 1024;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function jwtRole(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  const encoded = token.split(".")[1];
  if (!encoded) return null;

  try {
    const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const claims = JSON.parse(atob(padded)) as Record<string, unknown>;
    return typeof claims.role === "string" ? claims.role : null;
  } catch {
    return null;
  }
}

Deno.serve(async (request) => {
  if (jwtRole(request) !== "service_role") {
    return json({ error: "service_role_required" }, 403);
  }

  const input = await request.json().catch(() => null) as Record<string, unknown> | null;
  const date = typeof input?.date === "string" ? input.date : "";
  const edition = typeof input?.edition === "string" ? input.edition : "";
  const triggerType = input?.triggerType === "schedule" ? "schedule" : "manual";

  if (!/^\d{2}-\d{2}-\d{4}$/.test(date) || !/^\d{4,6}$/.test(edition)) {
    return json({ error: "invalid_capture_request" }, 400);
  }

  let editionUrl: string;
  try {
    editionUrl = canonicalDiarioOficialEditionUrl(date, edition);
  } catch {
    return json({ error: "invalid_capture_request" }, 400);
  }

  const [day, month, year] = date.split("-");
  const expectedDate = `${year}-${month}-${day}`;
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceKey) {
    return json({ error: "missing_configuration" }, 500);
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let runId: string | null = null;

  try {
    const { data: queuedRun, error: enqueueError } = await admin.rpc("enqueue_scraper_run", {
      target_connector_key: "diario-oficial-summary",
      target_organization: null,
      target_requested_by: null,
      target_trigger_type: triggerType,
      target_requested_url: editionUrl,
      target_canonical_url: editionUrl,
      target_idempotency_key: `diario-oficial:${date}:${edition}:edge-v1`,
      target_parent_run: null,
    });

    if (enqueueError || !queuedRun) {
      throw new Error(`enqueue_failed:${enqueueError?.message || "unknown"}`);
    }

    runId = String(queuedRun);

    const { error: claimError } = await admin.rpc("claim_scraper_run", {
      target_run: runId,
      worker_id: `edge:${crypto.randomUUID()}`,
      lease_seconds: 120,
    });

    if (claimError) {
      throw new Error(`claim_failed:${claimError.message}`);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60000);
    let response: Response;

    try {
      response = await fetch(editionUrl, {
        method: "GET",
        redirect: "error",
        cache: "no-store",
        signal: controller.signal,
        headers: {
          Accept: "text/html,application/xhtml+xml;q=0.9",
          "Accept-Language": "es-CL,es;q=0.9",
          "User-Agent": "KUMPLIO-Regulatory-Connector/1.0 (+https://kumplio.app/regulatory)",
        },
      });
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      throw new Error(`http_error:${response.status}`);
    }

    const mimeType = (response.headers.get("content-type") || "")
      .split(";")[0]
      .trim()
      .toLowerCase();

    if (!["text/html", "application/xhtml+xml"].includes(mimeType)) {
      throw new Error(`mime_not_allowed:${mimeType}`);
    }

    const rawHtml = await response.text();
    const byteSize = new TextEncoder().encode(rawHtml).byteLength;

    if (!rawHtml.trim()) throw new Error("empty_response");
    if (byteSize > MAX_BYTES) throw new Error("response_too_large");

    const parsed = parseDiarioOficialEdition(rawHtml, {
      parserVersion: CONNECTOR_VERSION,
    });

    if (parsed.editionNumber !== edition.replace(/^0+/, "")) {
      throw new Error("edition_mismatch");
    }

    if (parsed.publicationDateIso !== expectedDate) {
      throw new Error("date_mismatch");
    }

    const contentHash = hashDiarioOficial(rawHtml);

    const { data: source, error: sourceError } = await admin
      .from("regulatory_sources")
      .select("id")
      .eq("canonical_url", "https://www.diariooficial.interior.gob.cl/")
      .single();

    if (sourceError || !source) {
      throw new Error("source_not_registered");
    }

    const { data: previousFetch } = await admin
      .from("regulatory_source_fetches")
      .select("id")
      .eq("source_id", source.id)
      .order("fetched_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: fetchRecord, error: fetchError } = await admin
      .from("regulatory_source_fetches")
      .insert({
        source_id: source.id,
        previous_fetch_id: previousFetch?.id || null,
        requested_url: editionUrl,
        final_url: editionUrl,
        fetched_at: new Date().toISOString(),
        status: "succeeded",
        http_status: response.status,
        mime_type: mimeType,
        byte_size: byteSize,
        content_hash: contentHash,
        raw_content: rawHtml,
        response_headers: Object.fromEntries(response.headers.entries()),
        connector_version: CONNECTOR_VERSION,
      })
      .select("id")
      .single();

    if (fetchError || !fetchRecord) {
      throw new Error(`fetch_persistence_failed:${fetchError?.message || "unknown"}`);
    }

    const { data: recordData, error: recordError } = await admin.rpc(
      "record_diario_oficial_edition",
      {
        target_source: source.id,
        target_fetch: fetchRecord.id,
        target_edition: Number(edition),
        target_date: parsed.publicationDateIso,
        target_url: editionUrl,
        target_summary_pdf_url: parsed.summaryPdfUrl,
        target_content_hash: contentHash,
        target_parser_version: CONNECTOR_VERSION,
        target_publications: parsed.publications,
      },
    );

    if (recordError) {
      throw new Error(`edition_persistence_failed:${recordError.message}`);
    }

    const record = (recordData || {}) as Record<string, unknown>;
    const completionStatus = record.status === "unchanged"
      ? "unchanged"
      : record.status === "requires_review"
        ? "requires_review"
        : "succeeded";

    if (completionStatus === "unchanged") {
      await admin
        .from("regulatory_source_fetches")
        .update({ status: "unchanged" })
        .eq("id", fetchRecord.id);
    }

    const { error: completionError } = await admin.rpc("complete_scraper_run", {
      target_run: runId,
      target_status: completionStatus,
      target_http_status: response.status,
      target_mime: mimeType,
      target_bytes: byteSize,
      target_hash: contentHash,
      target_document: null,
      target_version: null,
      target_change: null,
      target_sections: parsed.publicationCount,
      target_changes: completionStatus === "unchanged" ? 0 : parsed.publicationCount,
      target_metrics: {
        edition: Number(edition),
        publicationDate: parsed.publicationDateIso,
        publicationCount: parsed.publicationCount,
        revisionNumber: Number(record.revisionNumber || 1),
        execution: "supabase_edge_service_role",
      },
    });

    if (completionError) {
      throw new Error(`completion_failed:${completionError.message}`);
    }

    return json({
      ok: true,
      runId,
      status: completionStatus,
      editionId: record.editionId,
      edition: Number(edition),
      publicationDate: parsed.publicationDateIso,
      publicationCount: parsed.publicationCount,
      contentHash,
      byteSize,
      summaryPdfUrl: parsed.summaryPdfUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "capture_failed";

    if (runId) {
      try {
        await admin.rpc("fail_scraper_run", {
          target_run: runId,
          target_error_code: message.split(":")[0],
          target_error_message: message,
          target_retryable: /^(timeout|network_error|http_error)/.test(message),
        });
      } catch {
        // Best effort only.
      }
    }

    return json({ ok: false, runId, error: message }, 502);
  }
});
