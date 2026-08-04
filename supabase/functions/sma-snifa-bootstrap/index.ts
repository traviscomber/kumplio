import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  chunkRows,
  decodeWindows1252,
  parseSmaSanctioningCsv,
  sha256Bytes,
} from "./core.mjs";

const CONNECTOR_KEY = "sma-snifa-sanctioning";
const CONNECTOR_VERSION = "sma-snifa-sanctioning-v1";
const SOURCE_URL = "https://snifa.sma.gob.cl/DatosAbiertos";
const SOURCE_FILE_ID = "1hPEwmUFZpmD7xFbJy-kjhhzjplnUB1mH";
const DOWNLOAD_URL = `https://drive.usercontent.google.com/download?id=${SOURCE_FILE_ID}&export=download&confirm=t`;
const USER_AGENT = "KUMPLIO-Regulatory-Connector/1.0 (+https://kumplio.app/regulatory)";
const MAX_BYTES = 5 * 1024 * 1024;
const BATCH_SIZE = 400;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function serviceRoleAuthorized(request: Request, serviceKey: string) {
  return request.headers.get("authorization") === `Bearer ${serviceKey}`;
}

async function fetchOfficialCsv() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(DOWNLOAD_URL, {
      method: "GET",
      redirect: "error",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: "text/csv,application/octet-stream,application/binary;q=0.9",
        "Accept-Language": "es-CL,es;q=0.9",
        "User-Agent": USER_AGENT,
      },
    });

    if (!response.ok) throw new Error(`sma_http_error:${response.status}`);

    const mimeType = (response.headers.get("content-type") || "")
      .split(";")[0]
      .trim()
      .toLowerCase();
    if (![
      "text/csv",
      "application/octet-stream",
      "application/binary",
    ].includes(mimeType)) {
      throw new Error(`sma_mime_not_allowed:${mimeType}`);
    }

    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength < 1000) throw new Error("sma_response_too_small");
    if (bytes.byteLength > MAX_BYTES) throw new Error("sma_response_too_large");

    const decoded = decodeWindows1252(bytes);
    if (!decoded.startsWith("ProcesoSancionId;Expediente;")) {
      throw new Error("sma_csv_signature_mismatch");
    }

    const contentDisposition = response.headers.get("content-disposition") || "";
    if (contentDisposition && !/filename="?Sancionatorios[.]csv"?/i.test(contentDisposition)) {
      throw new Error("sma_unexpected_filename");
    }

    const lastModifiedRaw = response.headers.get("last-modified");
    const sourceModifiedAt = lastModifiedRaw
      ? new Date(lastModifiedRaw).toISOString()
      : null;

    return {
      requestedUrl: DOWNLOAD_URL,
      finalUrl: DOWNLOAD_URL,
      httpStatus: response.status,
      mimeType,
      byteSize: bytes.byteLength,
      bytes,
      decoded,
      contentHash: await sha256Bytes(bytes),
      sourceModifiedAt,
      responseHeaders: Object.fromEntries(response.headers.entries()),
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("sma_timeout");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

Deno.serve(async (request) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return json({ error: "missing_configuration" }, 500);
  }
  if (!serviceRoleAuthorized(request, serviceKey)) {
    return json({ error: "service_role_required" }, 403);
  }

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const triggerType = body?.triggerType === "schedule" ? "schedule" : "manual";

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let runId: string | null = null;

  try {
    const { data: source, error: sourceError } = await admin
      .from("regulatory_sources")
      .select("id")
      .eq("canonical_url", SOURCE_URL)
      .single();
    if (sourceError || !source) throw new Error("sma_source_not_registered");

    const runDay = new Date().toISOString().slice(0, 10);
    const { data: queuedRun, error: enqueueError } = await admin.rpc(
      "enqueue_scraper_run",
      {
        target_connector_key: CONNECTOR_KEY,
        target_organization: null,
        target_requested_by: null,
        target_trigger_type: triggerType,
        target_requested_url: DOWNLOAD_URL,
        target_canonical_url: SOURCE_URL,
        target_idempotency_key: `sma-snifa:${runDay}:edge-v1`,
        target_parent_run: null,
      },
    );
    if (enqueueError || !queuedRun) {
      throw new Error(`sma_enqueue_failed:${enqueueError?.message || "unknown"}`);
    }
    runId = String(queuedRun);

    const { error: claimError } = await admin.rpc("claim_scraper_run", {
      target_run: runId,
      worker_id: `edge:${crypto.randomUUID()}`,
      lease_seconds: 300,
    });
    if (claimError) throw new Error(`sma_claim_failed:${claimError.message}`);

    const capture = await fetchOfficialCsv();
    const parsed = parseSmaSanctioningCsv(capture.decoded, { minimumRows: 3000 });

    const { data: previousFetch } = await admin
      .from("regulatory_source_fetches")
      .select("id, content_hash")
      .eq("source_id", source.id)
      .eq("requested_url", DOWNLOAD_URL)
      .in("status", ["succeeded", "unchanged"])
      .order("fetched_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const fetchStatus = previousFetch?.content_hash === capture.contentHash
      ? "unchanged"
      : "succeeded";

    const { data: sourceFetch, error: fetchError } = await admin
      .from("regulatory_source_fetches")
      .insert({
        source_id: source.id,
        previous_fetch_id: previousFetch?.id || null,
        requested_url: capture.requestedUrl,
        final_url: capture.finalUrl,
        fetched_at: new Date().toISOString(),
        status: fetchStatus,
        http_status: capture.httpStatus,
        mime_type: capture.mimeType,
        byte_size: capture.byteSize,
        content_hash: capture.contentHash,
        raw_content: capture.decoded,
        response_headers: capture.responseHeaders,
        connector_version: CONNECTOR_VERSION,
        error_code: null,
        error_message: null,
      })
      .select("id")
      .single();
    if (fetchError || !sourceFetch) {
      throw new Error(`sma_fetch_persistence_failed:${fetchError?.message || "unknown"}`);
    }

    const { data: snapshotStart, error: snapshotStartError } = await admin.rpc(
      "begin_sma_sanctioning_snapshot",
      {
        p_source_id: source.id,
        p_source_fetch_id: sourceFetch.id,
        p_source_file_id: SOURCE_FILE_ID,
        p_source_modified_at: capture.sourceModifiedAt,
        p_source_updated_date: parsed.metrics.sourceUpdateDate,
        p_content_hash: capture.contentHash,
        p_byte_size: capture.byteSize,
        p_raw_row_count: parsed.metrics.rawRowCount,
        p_parser_version: CONNECTOR_VERSION,
        p_metadata: {
          headers: parsed.headers,
          metrics: parsed.metrics,
          sourceEncoding: "windows-1252",
          sourceDelimiter: ";",
          rawBytesHash: capture.contentHash,
          detailHydrationRequired: true,
          humanReviewRequired: true,
        },
      },
    );
    if (snapshotStartError || !snapshotStart?.snapshotId) {
      throw new Error(
        `sma_snapshot_start_failed:${snapshotStartError?.message || "missing_snapshot"}`,
      );
    }

    if (snapshotStart.status === "unchanged") {
      const { error: completionError } = await admin.rpc("complete_scraper_run", {
        target_run: runId,
        target_status: "unchanged",
        target_http_status: capture.httpStatus,
        target_mime: capture.mimeType,
        target_bytes: capture.byteSize,
        target_hash: capture.contentHash,
        target_document: null,
        target_version: null,
        target_change: null,
        target_sections: parsed.metrics.rawRowCount,
        target_changes: 0,
        target_metrics: {
          snapshotId: snapshotStart.snapshotId,
          parserVersion: CONNECTOR_VERSION,
          fetchStatus,
          ...parsed.metrics,
          batches: 0,
          snapshotStatus: "unchanged",
          detailHydrationRequired: true,
          humanReviewRequired: true,
        },
      });
      if (completionError) {
        throw new Error(`sma_run_completion_failed:${completionError.message}`);
      }

      return json({
        ok: true,
        runId,
        snapshotId: snapshotStart.snapshotId,
        status: "unchanged",
        parserVersion: CONNECTOR_VERSION,
        ...parsed.metrics,
      });
    }

    const batches = chunkRows(parsed.rows, BATCH_SIZE);
    let insertedRows = 0;

    for (const batch of batches) {
      const { data: batchResult, error: batchError } = await admin.rpc(
        "record_sma_sanctioning_batch",
        {
          p_snapshot_id: snapshotStart.snapshotId,
          p_rows: batch,
        },
      );
      if (batchError) {
        throw new Error(`sma_batch_failed:${batchError.message}`);
      }
      insertedRows += Number(batchResult?.inserted || 0);
    }

    const { data: snapshotResult, error: snapshotError } = await admin.rpc(
      "complete_sma_sanctioning_snapshot",
      { p_snapshot_id: snapshotStart.snapshotId },
    );
    if (snapshotError || !snapshotResult) {
      throw new Error(
        `sma_snapshot_completion_failed:${snapshotError?.message || "unknown"}`,
      );
    }

    const { error: completionError } = await admin.rpc("complete_scraper_run", {
      target_run: runId,
      target_status: "requires_review",
      target_http_status: capture.httpStatus,
      target_mime: capture.mimeType,
      target_bytes: capture.byteSize,
      target_hash: capture.contentHash,
      target_document: null,
      target_version: null,
      target_change: null,
      target_sections: parsed.metrics.rawRowCount,
      target_changes: parsed.metrics.proceedingCount,
      target_metrics: {
        snapshotId: snapshotStart.snapshotId,
        parserVersion: CONNECTOR_VERSION,
        fetchStatus,
        insertedRows,
        batches: batches.length,
        ...parsed.metrics,
        snapshotResult,
        detailHydrationRequired: true,
        humanReviewRequired: true,
      },
    });
    if (completionError) {
      throw new Error(`sma_run_completion_failed:${completionError.message}`);
    }

    return json({
      ok: true,
      runId,
      snapshotId: snapshotStart.snapshotId,
      status: "requires_review",
      parserVersion: CONNECTOR_VERSION,
      insertedRows,
      batches: batches.length,
      ...parsed.metrics,
      snapshotResult,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "sma_capture_failed";
    const retryable = /^(sma_timeout|sma_http_error|sma_enqueue_failed)/.test(message);

    if (runId) {
      try {
        await admin.rpc("fail_scraper_run", {
          target_run: runId,
          target_error_code: message.split(":")[0],
          target_error_message: message,
          target_retryable: retryable,
        });
      } catch {
        // Best effort only.
      }
    }

    return json({ ok: false, runId, error: message }, 502);
  }
});
