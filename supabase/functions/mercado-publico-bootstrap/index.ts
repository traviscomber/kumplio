import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  canonicalApiUrl,
  formatApiDate,
  parsePurchaseOrderPayload,
  parseTenderPayload,
  sha256,
} from "./core.mjs";

const CONNECTOR_KEY = "mercado-publico";
const CONNECTOR_VERSION = "mercado-publico-v1";
const USER_AGENT = "KUMPLIO-Government-Intelligence/1.0 (+https://kumplio.app)";
const API_BASE = "https://api.mercadopublico.cl/servicios/v1/publico";
const MAX_BYTES = 12 * 1024 * 1024;

type CaptureKind = "licitaciones" | "ordenesdecompra";

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

function publicApiUrl(kind: CaptureKind, date: string) {
  const url = new URL(`${API_BASE}/${kind}.json`);
  url.searchParams.set("fecha", formatApiDate(date));
  return canonicalApiUrl(url.toString());
}

function providerApiUrl(kind: CaptureKind, date: string, ticket: string) {
  const url = new URL(publicApiUrl(kind, date));
  url.searchParams.set("ticket", ticket);
  return canonicalApiUrl(url.toString());
}

async function fetchOfficialJson(kind: CaptureKind, date: string, ticket: string) {
  const providerUrl = providerApiUrl(kind, date, ticket);
  const publicUrl = publicApiUrl(kind, date);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(providerUrl, {
      method: "GET",
      redirect: "error",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Accept-Language": "es-CL,es;q=0.9",
        "User-Agent": USER_AGENT,
      },
    });
    if (!response.ok) throw new Error(`mercado_publico_http_error:${response.status}`);

    const mimeType = (response.headers.get("content-type") || "")
      .split(";")[0]
      .trim()
      .toLowerCase();
    if (!["application/json", "text/json", "text/plain"].includes(mimeType)) {
      throw new Error(`mercado_publico_mime_not_allowed:${mimeType}`);
    }

    const raw = await response.text();
    const byteSize = new TextEncoder().encode(raw).byteLength;
    if (!raw.trim()) throw new Error("mercado_publico_empty_response");
    if (byteSize > MAX_BYTES) throw new Error("mercado_publico_response_too_large");

    let payload: unknown;
    try {
      payload = JSON.parse(raw);
    } catch {
      throw new Error("mercado_publico_invalid_json");
    }

    return {
      publicUrl,
      httpStatus: response.status,
      mimeType,
      byteSize,
      raw,
      payload,
      contentHash: await sha256(raw),
      responseHeaders: Object.fromEntries(response.headers.entries()),
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("mercado_publico_timeout");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

Deno.serve(async (request) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const apiTicket = Deno.env.get("MERCADO_PUBLICO_API_TICKET");

  if (!supabaseUrl || !serviceKey) return json({ error: "missing_configuration" }, 500);
  if (!serviceRoleAuthorized(request, serviceKey)) return json({ error: "service_role_required" }, 403);
  if (!apiTicket) return json({ error: "mercado_publico_ticket_missing" }, 503);

  const input = await request.json().catch(() => null) as Record<string, unknown> | null;
  const kind: CaptureKind = input?.kind === "ordenesdecompra" ? "ordenesdecompra" : "licitaciones";
  const date = typeof input?.date === "string" ? input.date : new Date().toISOString().slice(0, 10);
  const triggerType = input?.triggerType === "schedule" ? "schedule" : "manual";

  try {
    formatApiDate(date);
  } catch {
    return json({ error: "invalid_capture_date" }, 400);
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let runId: string | null = null;

  try {
    const { data: source, error: sourceError } = await admin
      .from("regulatory_sources")
      .select("id")
      .eq("canonical_url", "https://www.mercadopublico.cl/")
      .single();
    if (sourceError || !source) throw new Error("mercado_publico_source_not_registered");

    const { data: connector, error: connectorError } = await admin
      .from("scraper_connectors")
      .select("id")
      .eq("connector_key", CONNECTOR_KEY)
      .single();
    if (connectorError || !connector) throw new Error("mercado_publico_connector_not_registered");

    const requestedUrl = publicApiUrl(kind, date);
    const { data: queuedRun, error: enqueueError } = await admin.rpc("enqueue_scraper_run", {
      target_connector_key: CONNECTOR_KEY,
      target_organization: null,
      target_requested_by: null,
      target_trigger_type: triggerType,
      target_requested_url: requestedUrl,
      target_canonical_url: requestedUrl,
      target_idempotency_key: `mercado-publico:${kind}:${date}:v1`,
      target_parent_run: null,
    });
    if (enqueueError || !queuedRun) throw new Error(`mercado_publico_enqueue_failed:${enqueueError?.message || "unknown"}`);
    runId = String(queuedRun);

    const { error: claimError } = await admin.rpc("claim_scraper_run", {
      target_run: runId,
      worker_id: `edge:${crypto.randomUUID()}`,
      lease_seconds: 180,
    });
    if (claimError) throw new Error(`mercado_publico_claim_failed:${claimError.message}`);

    const capture = await fetchOfficialJson(kind, date, apiTicket);
    const records = kind === "licitaciones"
      ? parseTenderPayload(capture.payload)
      : parsePurchaseOrderPayload(capture.payload);

    const { data: fetchData, error: captureError } = await admin.rpc("record_regulatory_source_capture", {
      p_source_id: source.id,
      p_requested_url: capture.publicUrl,
      p_final_url: capture.publicUrl,
      p_status: "succeeded",
      p_http_status: capture.httpStatus,
      p_mime_type: capture.mimeType,
      p_content_hash: capture.contentHash,
      p_raw_content: capture.raw,
      p_storage_path: null,
      p_response_headers: capture.responseHeaders,
      p_connector_version: CONNECTOR_VERSION,
      p_error_code: null,
      p_error_message: null,
      p_document_identifier: `mercadopublico:${kind}:${date}`,
      p_document_title: `Mercado Público ${kind} ${date}`,
      p_document_type: `mercado_publico_${kind}`,
      p_document_url: capture.publicUrl,
      p_external_reference: date,
      p_publication_date: date,
      p_effective_from: date,
      p_effective_to: null,
      p_document_status: "published",
      p_version_label: `${kind} ${date}`,
      p_version_date: date,
      p_normalized_content: JSON.stringify(records),
      p_parser_version: CONNECTOR_VERSION,
    });
    if (captureError || !fetchData?.documentId || !fetchData?.versionId || !fetchData?.fetchId) {
      throw new Error(`mercado_publico_persistence_failed:${captureError?.message || "missing_capture_identity"}`);
    }

    const { data: parserData, error: parserError } = await admin.rpc("record_regulatory_parser_revision", {
      p_document_id: fetchData.documentId,
      p_source_fetch_id: fetchData.fetchId,
      p_source_content_hash: capture.contentHash,
      p_parser_version: CONNECTOR_VERSION,
      p_normalized_content: JSON.stringify(records),
      p_sections: records.map((record: Record<string, unknown>, index: number) => ({
        key: String(record.canonicalIdentifier),
        type: kind === "licitaciones" ? "tender" : "purchase_order",
        ordinal: index + 1,
        referenceLabel: String(record.code || ""),
        heading: String(record.name || record.code || "Mercado Público"),
        bodyText: JSON.stringify(record),
        normalizedText: JSON.stringify(record),
        hash: null,
        metadata: {
          source: "mercado-publico",
          parserVersion: CONNECTOR_VERSION,
          captureDate: date,
        },
      })),
    });
    if (parserError || !parserData?.versionId) {
      throw new Error(`mercado_publico_parser_revision_failed:${parserError?.message || "missing_parser_version"}`);
    }

    const changed = !(fetchData.status === "unchanged" && parserData.status === "unchanged");
    const { error: completionError } = await admin.rpc("complete_scraper_run", {
      target_run: runId,
      target_status: changed ? "requires_review" : "unchanged",
      target_http_status: 200,
      target_mime: capture.mimeType,
      target_bytes: capture.byteSize,
      target_hash: capture.contentHash,
      target_document: fetchData.documentId,
      target_version: parserData.versionId,
      target_change: null,
      target_sections: records.length,
      target_changes: changed ? records.length : 0,
      target_metrics: {
        date,
        kind,
        records: records.length,
        connectorVersion: CONNECTOR_VERSION,
        credentialMaterialPersisted: false,
      },
    });
    if (completionError) throw new Error(`mercado_publico_complete_failed:${completionError.message}`);

    return json({
      ok: true,
      runId,
      date,
      kind,
      records: records.length,
      status: changed ? "requires_review" : "unchanged",
      contentHash: capture.contentHash,
      sourceUrl: capture.publicUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "mercado_publico_unknown_error";
    if (runId) {
      await admin.rpc("fail_scraper_run", {
        target_run: runId,
        target_error_code: message.split(":")[0],
        target_error_message: message.slice(0, 800),
        target_http_status: null,
        target_mime: null,
        target_bytes: null,
        target_metrics: { connectorVersion: CONNECTOR_VERSION },
      }).catch(() => null);
    }
    console.error("[mercado-publico-bootstrap]", message);
    return json({ error: message.split(":")[0] }, 500);
  }
});
