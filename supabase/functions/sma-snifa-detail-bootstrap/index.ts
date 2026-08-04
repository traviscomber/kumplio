import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { parseSnifaSanctioningDetail } from "./parser.mjs";
import { sha256 } from "./core.mjs";

const CONNECTOR_KEY = "sma-snifa-detail";
const CONNECTOR_VERSION = "sma-snifa-detail-v1";
const SOURCE_URL = "https://snifa.sma.gob.cl/DatosAbiertos";
const BASE_DETAIL_URL = "https://snifa.sma.gob.cl/Sancionatorio/Ficha/";
const MAX_BYTES = 512 * 1024;
const MAX_BATCH_SIZE = 20;
const REQUEST_DELAY_MS = 250;

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

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function parseProcessIds(value: unknown) {
  if (!Array.isArray(value) || value.length < 1 || value.length > MAX_BATCH_SIZE) {
    throw new Error("sma_detail_invalid_process_ids");
  }
  const ids = value.map((item) => Number(item));
  if (ids.some((id) => !Number.isSafeInteger(id) || id <= 0)) {
    throw new Error("sma_detail_invalid_process_ids");
  }
  const unique = [...new Set(ids)];
  if (unique.length !== ids.length) throw new Error("sma_detail_duplicate_process_ids");
  return unique;
}

async function fetchOfficialDetail(processId: number) {
  const url = `${BASE_DETAIL_URL}${processId}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "error",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: "text/html",
      },
    });

    if (!response.ok) throw new Error(`sma_detail_http_error:${response.status}`);
    const mimeType = (response.headers.get("content-type") || "")
      .split(";")[0]
      .trim()
      .toLowerCase();
    if (mimeType !== "text/html") throw new Error(`sma_detail_mime_not_allowed:${mimeType}`);

    const rawHtml = await response.text();
    const byteSize = new TextEncoder().encode(rawHtml).byteLength;
    if (!rawHtml.trim()) throw new Error("sma_detail_empty_response");
    if (byteSize > MAX_BYTES) throw new Error("sma_detail_response_too_large");
    if (!rawHtml.includes("SNIFA - Sistema Nacional de Información de Fiscalización Ambiental")) {
      throw new Error("sma_detail_signature_missing");
    }

    return {
      url,
      httpStatus: response.status,
      mimeType,
      byteSize,
      rawHtml,
      contentHash: await sha256(rawHtml),
      responseHeaders: Object.fromEntries(response.headers.entries()),
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("sma_detail_timeout");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

Deno.serve(async (request) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return json({ error: "missing_configuration" }, 500);
  if (!serviceRoleAuthorized(request, serviceKey)) return json({ error: "service_role_required" }, 403);

  let processIds: number[];
  try {
    const input = await request.json().catch(() => null) as Record<string, unknown> | null;
    processIds = parseProcessIds(input?.processIds);
  } catch (error) {
    const message = error instanceof Error ? error.message : "sma_detail_invalid_request";
    return json({ ok: false, error: message }, 400);
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  let runId: string | null = null;

  try {
    const { data: proceedings, error: proceedingsError } = await admin
      .from("sma_sanctioning_proceedings")
      .select("sma_process_id, expediente, start_date, end_date, process_state, proceeding_url")
      .in("sma_process_id", processIds)
      .eq("is_current", true);
    if (proceedingsError) throw new Error(`sma_detail_discovery_failed:${proceedingsError.message}`);
    if (!proceedings || proceedings.length !== processIds.length) {
      throw new Error(`sma_detail_processes_not_found:${processIds.length}:${proceedings?.length || 0}`);
    }

    const proceedingMap = new Map(proceedings.map((item) => [Number(item.sma_process_id), item]));
    for (const processId of processIds) {
      const proceeding = proceedingMap.get(processId);
      if (!proceeding || proceeding.proceeding_url !== `${BASE_DETAIL_URL}${processId}`) {
        throw new Error(`sma_detail_discovery_url_mismatch:${processId}`);
      }
    }

    const cohortHash = await sha256(processIds.slice().sort((a, b) => a - b).join(","));
    const { data: queuedRun, error: enqueueError } = await admin.rpc("enqueue_scraper_run", {
      target_connector_key: CONNECTOR_KEY,
      target_organization: null,
      target_requested_by: null,
      target_trigger_type: "manual",
      target_requested_url: `${SOURCE_URL}#detail-cohort=${cohortHash.slice(0, 16)}`,
      target_canonical_url: SOURCE_URL,
      target_idempotency_key: `sma-snifa-detail:${crypto.randomUUID()}`,
      target_parent_run: null,
    });
    if (enqueueError || !queuedRun) {
      throw new Error(`sma_detail_enqueue_failed:${enqueueError?.message || "unknown"}`);
    }
    runId = String(queuedRun);

    const { error: claimError } = await admin.rpc("claim_scraper_run", {
      target_run: runId,
      worker_id: `edge:${crypto.randomUUID()}`,
      lease_seconds: 300,
    });
    if (claimError) throw new Error(`sma_detail_claim_failed:${claimError.message}`);

    let captured = 0;
    let unchanged = 0;
    let totalDocuments = 0;
    let totalFacts = 0;
    let totalInspections = 0;
    let totalMeasures = 0;
    let totalSanctions = 0;
    let totalBytes = 0;
    const results: Array<Record<string, unknown>> = [];

    for (const processId of processIds) {
      const proceeding = proceedingMap.get(processId)!;
      await delay(REQUEST_DELAY_MS);
      const capture = await fetchOfficialDetail(processId);
      totalBytes += capture.byteSize;

      const parsed = await parseSnifaSanctioningDetail(capture.rawHtml, {
        smaProcessId: processId,
        expediente: proceeding.expediente,
        startDate: proceeding.start_date,
        processState: proceeding.process_state,
      });

      const { data: previousFetch } = await admin
        .from("regulatory_source_fetches")
        .select("id, content_hash")
        .eq("source_id", (await admin.from("regulatory_sources").select("id").eq("canonical_url", SOURCE_URL).single()).data?.id)
        .eq("requested_url", capture.url)
        .in("status", ["succeeded", "unchanged"])
        .order("fetched_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: source } = await admin
        .from("regulatory_sources")
        .select("id")
        .eq("canonical_url", SOURCE_URL)
        .single();
      if (!source) throw new Error("sma_detail_source_not_registered");

      const fetchStatus = previousFetch?.content_hash === capture.contentHash ? "unchanged" : "succeeded";
      const { data: sourceFetch, error: fetchError } = await admin
        .from("regulatory_source_fetches")
        .insert({
          source_id: source.id,
          previous_fetch_id: previousFetch?.id || null,
          requested_url: capture.url,
          final_url: capture.url,
          fetched_at: new Date().toISOString(),
          status: fetchStatus,
          http_status: capture.httpStatus,
          mime_type: capture.mimeType,
          byte_size: capture.byteSize,
          content_hash: capture.contentHash,
          raw_content: capture.rawHtml,
          response_headers: capture.responseHeaders,
          connector_version: CONNECTOR_VERSION,
          error_code: null,
          error_message: null,
        })
        .select("id")
        .single();
      if (fetchError || !sourceFetch) {
        throw new Error(`sma_detail_fetch_persistence_failed:${processId}:${fetchError?.message || "unknown"}`);
      }

      const associations = [...parsed.inspections, ...parsed.provisionalMeasures];
      const { data: persisted, error: persistenceError } = await admin.rpc(
        "record_sma_sanctioning_detail",
        {
          p_sma_process_id: processId,
          p_source_fetch_id: sourceFetch.id,
          p_content_hash: capture.contentHash,
          p_payload_hash: parsed.payloadHash,
          p_parser_version: CONNECTOR_VERSION,
          p_expediente: parsed.expediente,
          p_start_date: parsed.startDate,
          p_end_date: parsed.endDate,
          p_process_state: parsed.processState,
          p_counts: parsed.counts,
          p_units: parsed.units,
          p_holders: parsed.holders,
          p_documents: parsed.documents,
          p_facts: parsed.facts,
          p_associations: associations,
          p_sanctions: parsed.sanctions,
          p_metadata: parsed.metadata,
        },
      );
      if (persistenceError || !persisted) {
        throw new Error(`sma_detail_persistence_failed:${processId}:${persistenceError?.message || "unknown"}`);
      }

      if (persisted.status === "unchanged") unchanged += 1;
      else captured += 1;
      totalDocuments += parsed.counts.documents;
      totalFacts += parsed.counts.facts;
      totalInspections += parsed.counts.inspections;
      totalMeasures += parsed.counts.provisionalMeasures;
      totalSanctions += parsed.counts.sanctions;
      results.push({
        processId,
        expediente: parsed.expediente,
        status: persisted.status,
        versionId: persisted.versionId,
        counts: parsed.counts,
        payloadHash: parsed.payloadHash,
        contentHash: capture.contentHash,
      });
    }

    const completionStatus = captured > 0 ? "requires_review" : "unchanged";
    const combinedHash = await sha256(results.map((item) => item.contentHash).sort().join("\n"));
    const { error: completionError } = await admin.rpc("complete_scraper_run", {
      target_run: runId,
      target_status: completionStatus,
      target_http_status: 200,
      target_mime: "text/html",
      target_bytes: totalBytes,
      target_hash: combinedHash,
      target_document: null,
      target_version: null,
      target_change: null,
      target_sections: processIds.length,
      target_changes: captured,
      target_metrics: {
        parserVersion: CONNECTOR_VERSION,
        cohortHash,
        processIds,
        captured,
        unchanged,
        totalDocuments,
        totalFacts,
        totalInspections,
        totalMeasures,
        totalSanctions,
        results,
        humanReviewRequired: true,
      },
    });
    if (completionError) throw new Error(`sma_detail_completion_failed:${completionError.message}`);

    const { count: hydratedCount } = await admin
      .from("sma_sanctioning_detail_heads")
      .select("sma_process_id", { count: "exact", head: true });

    await admin
      .from("scraper_connectors")
      .update({
        status: "manual",
        parser_health: "healthy",
        parser_health_checked_at: new Date().toISOString(),
        circuit_state: "closed",
        consecutive_failures: 0,
        last_succeeded_at: new Date().toISOString(),
        last_error_code: null,
        metadata: {
          parserVersion: CONNECTOR_VERSION,
          lastCohortHash: cohortHash,
          lastProcessIds: processIds,
          lastCaptured: captured,
          lastUnchanged: unchanged,
          hydratedProcessCount: hydratedCount || 0,
          schedulingReadiness: "first_cohort_verified",
          schedulingStatus: "manual_until_two_verified_cohorts",
          humanReviewRequired: true,
          claimsAreNotAutoValidated: true,
          userAgentRejectedByOrigin: true,
        },
      })
      .eq("connector_key", CONNECTOR_KEY);

    return json({
      ok: true,
      runId,
      status: completionStatus,
      parserVersion: CONNECTOR_VERSION,
      captured,
      unchanged,
      hydratedProcessCount: hydratedCount || 0,
      totals: {
        documents: totalDocuments,
        facts: totalFacts,
        inspections: totalInspections,
        provisionalMeasures: totalMeasures,
        sanctions: totalSanctions,
      },
      results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "sma_detail_capture_failed";
    const retryable = /^(sma_detail_timeout|sma_detail_http_error|sma_detail_enqueue_failed)/.test(message);
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
