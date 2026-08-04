import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  parseDtDetailPage,
  parseDtIndexPage,
  sha256,
} from "./core.mjs";

const CONNECTOR_KEY = "direccion-trabajo-doctrina";
const CONNECTOR_VERSION = "direccion-trabajo-doctrina-v2";
const USER_AGENT = "KUMPLIO-Regulatory-Connector/1.0 (+https://kumplio.app/regulatory)";
const MAX_BYTES = 3 * 1024 * 1024;
const REQUEST_DELAY_MS = 350;
const INDEX_URLS = {
  dictamen: "https://www.dt.gob.cl/legislacion/1624/w3-multipropertyvalues-22762-193891.html",
  ordinario: "https://www.dt.gob.cl/legislacion/1624/w3-multipropertyvalues-147182-193891.html",
} as const;

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

function normalizeCaptureUrl(input: string) {
  const url = new URL(input);
  if (url.protocol !== "https:") throw new Error("dt_https_required");
  if (!["www.dt.gob.cl", "dt.gob.cl"].includes(url.hostname.toLowerCase())) {
    throw new Error("dt_host_not_allowed");
  }
  if (!/^\/legislacion\/1624\/(?:w3-multipropertyvalues-[0-9-]+|w3-article-[0-9]+)[.]html$/.test(url.pathname)) {
    throw new Error("dt_path_not_allowed");
  }
  url.hostname = "www.dt.gob.cl";
  url.search = "";
  url.hash = "";
  return url.toString();
}

async function fetchOfficialHtml(input: string) {
  const url = normalizeCaptureUrl(input);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "error",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml;q=0.9",
        "Accept-Language": "es-CL,es;q=0.9",
        "User-Agent": USER_AGENT,
      },
    });

    if (!response.ok) throw new Error(`dt_http_error:${response.status}`);
    const mimeType = (response.headers.get("content-type") || "")
      .split(";")[0]
      .trim()
      .toLowerCase();
    if (!["text/html", "application/xhtml+xml"].includes(mimeType)) {
      throw new Error(`dt_mime_not_allowed:${mimeType}`);
    }

    const rawHtml = await response.text();
    const byteSize = new TextEncoder().encode(rawHtml).byteLength;
    if (!rawHtml.trim()) throw new Error("dt_empty_response");
    if (byteSize > MAX_BYTES) throw new Error("dt_response_too_large");

    return {
      url,
      status: response.status,
      mimeType,
      byteSize,
      rawHtml,
      contentHash: await sha256(rawHtml),
      responseHeaders: Object.fromEntries(response.headers.entries()),
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("dt_timeout");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function recordIndexFetch(
  admin: ReturnType<typeof createClient>,
  sourceId: string,
  capture: Awaited<ReturnType<typeof fetchOfficialHtml>>,
  indexType: "dictamen" | "ordinario",
  year: number,
  month: number,
  discoveredCount: number,
) {
  const { data: previous } = await admin
    .from("regulatory_source_fetches")
    .select("id, content_hash")
    .eq("source_id", sourceId)
    .eq("requested_url", capture.url)
    .in("status", ["succeeded", "unchanged"])
    .order("fetched_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const status = previous?.content_hash === capture.contentHash ? "unchanged" : "succeeded";
  const { data, error } = await admin
    .from("regulatory_source_fetches")
    .insert({
      source_id: sourceId,
      previous_fetch_id: previous?.id || null,
      requested_url: capture.url,
      final_url: capture.url,
      fetched_at: new Date().toISOString(),
      status,
      http_status: capture.status,
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

  if (error || !data) throw new Error(`dt_index_persistence_failed:${error?.message || "unknown"}`);
  return {
    id: data.id as string,
    status,
    indexType,
    year,
    month,
    discoveredCount,
    contentHash: capture.contentHash,
    byteSize: capture.byteSize,
  };
}

Deno.serve(async (request) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return json({ error: "missing_configuration" }, 500);
  if (!serviceRoleAuthorized(request, serviceKey)) {
    return json({ error: "service_role_required" }, 403);
  }

  const input = await request.json().catch(() => null) as Record<string, unknown> | null;
  const year = Number(input?.year);
  const month = Number(input?.month);
  const triggerType = input?.triggerType === "schedule" ? "schedule" : "manual";

  if (year !== 2026 || !Number.isInteger(month) || month < 1 || month > 12) {
    return json({ error: "invalid_capture_period" }, 400);
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let runId: string | null = null;

  try {
    const { data: source, error: sourceError } = await admin
      .from("regulatory_sources")
      .select("id, metadata")
      .eq("canonical_url", "https://www.dt.gob.cl/legislacion/1624/w3-channel.html")
      .single();
    if (sourceError || !source) throw new Error("dt_source_not_registered");

    const { data: connector, error: connectorError } = await admin
      .from("scraper_connectors")
      .select("id, metadata")
      .eq("connector_key", CONNECTOR_KEY)
      .single();
    if (connectorError || !connector) throw new Error("dt_connector_not_registered");

    const requestedUrl = `${INDEX_URLS.dictamen}#period=${year}-${String(month).padStart(2, "0")}`;
    const { data: queuedRun, error: enqueueError } = await admin.rpc("enqueue_scraper_run", {
      target_connector_key: CONNECTOR_KEY,
      target_organization: null,
      target_requested_by: null,
      target_trigger_type: triggerType,
      target_requested_url: requestedUrl,
      target_canonical_url: INDEX_URLS.dictamen,
      target_idempotency_key: `direccion-trabajo:${year}-${String(month).padStart(2, "0")}:edge-v2`,
      target_parent_run: null,
    });
    if (enqueueError || !queuedRun) {
      throw new Error(`dt_enqueue_failed:${enqueueError?.message || "unknown"}`);
    }
    runId = String(queuedRun);

    const { error: claimError } = await admin.rpc("claim_scraper_run", {
      target_run: runId,
      worker_id: `edge:${crypto.randomUUID()}`,
      lease_seconds: 300,
    });
    if (claimError) throw new Error(`dt_claim_failed:${claimError.message}`);

    const dictamenIndex = await fetchOfficialHtml(INDEX_URLS.dictamen);
    const dictamenEntries = parseDtIndexPage(dictamenIndex.rawHtml, {
      year,
      month,
      pronouncementType: "dictamen",
    });
    await delay(REQUEST_DELAY_MS);

    const ordinarioIndex = await fetchOfficialHtml(INDEX_URLS.ordinario);
    const ordinarioEntries = parseDtIndexPage(ordinarioIndex.rawHtml, {
      year,
      month,
      pronouncementType: "ordinario",
    });

    const discoveries = [...dictamenEntries, ...ordinarioEntries]
      .sort((a, b) => a.publicationDate.localeCompare(b.publicationDate) || a.canonicalIdentifier.localeCompare(b.canonicalIdentifier));
    const uniqueUrls = new Set(discoveries.map((entry) => entry.detailUrl));
    if (uniqueUrls.size !== discoveries.length) throw new Error("dt_discovery_duplicate_urls");
    if (year === 2026 && month === 7 && discoveries.length !== 15) {
      throw new Error(`dt_initial_discovery_count_mismatch:${discoveries.length}`);
    }

    const indexFetches = [
      await recordIndexFetch(admin, source.id, dictamenIndex, "dictamen", year, month, dictamenEntries.length),
      await recordIndexFetch(admin, source.id, ordinarioIndex, "ordinario", year, month, ordinarioEntries.length),
    ];

    let captured = 0;
    let reparsed = 0;
    let unchanged = 0;
    let totalBlocks = 0;
    let totalTopics = 0;
    let totalReferences = 0;
    let totalRelations = 0;
    const documents: Array<Record<string, unknown>> = [];

    for (const discovery of discoveries) {
      await delay(REQUEST_DELAY_MS);
      const detailCapture = await fetchOfficialHtml(discovery.detailUrl);
      const parsed = await parseDtDetailPage(detailCapture.rawHtml, discovery);

      const { data: captureData, error: captureError } = await admin.rpc("record_regulatory_source_capture", {
        p_source_id: source.id,
        p_requested_url: detailCapture.url,
        p_final_url: detailCapture.url,
        p_status: "succeeded",
        p_http_status: detailCapture.status,
        p_mime_type: detailCapture.mimeType,
        p_content_hash: detailCapture.contentHash,
        p_raw_content: detailCapture.rawHtml,
        p_storage_path: null,
        p_response_headers: detailCapture.responseHeaders,
        p_connector_version: CONNECTOR_VERSION,
        p_error_code: null,
        p_error_message: null,
        p_document_identifier: parsed.canonicalIdentifier,
        p_document_title: parsed.title,
        p_document_type: `dt_${parsed.pronouncementType}`,
        p_document_url: parsed.sourcePageUrl,
        p_external_reference: parsed.officialNumber,
        p_publication_date: parsed.publicationDate,
        p_effective_from: parsed.publicationDate,
        p_effective_to: null,
        p_document_status: "published",
        p_version_label: `${parsed.officialNumber} — ${parsed.publicationDate}`,
        p_version_date: parsed.publicationDate,
        p_normalized_content: parsed.normalizedContent,
        p_parser_version: CONNECTOR_VERSION,
      });
      if (captureError || !captureData?.documentId || !captureData?.versionId || !captureData?.fetchId) {
        throw new Error(`dt_document_persistence_failed:${captureError?.message || "missing_capture_identity"}`);
      }

      const sectionHash = await sha256(`document|${parsed.normalizedContent}`);
      const { data: parserData, error: parserError } = await admin.rpc("record_regulatory_parser_revision", {
        p_document_id: captureData.documentId,
        p_source_fetch_id: captureData.fetchId,
        p_source_content_hash: detailCapture.contentHash,
        p_parser_version: CONNECTOR_VERSION,
        p_normalized_content: parsed.normalizedContent,
        p_sections: [{
          key: "document",
          type: "article",
          ordinal: 1,
          referenceLabel: parsed.officialNumber,
          heading: parsed.title,
          bodyText: parsed.normalizedContent,
          normalizedText: parsed.normalizedContent,
          hash: sectionHash,
          metadata: {
            source: "direccion-trabajo",
            parserVersion: CONNECTOR_VERSION,
          },
        }],
      });
      if (parserError || !parserData?.versionId) {
        throw new Error(`dt_parser_revision_failed:${parserError?.message || "missing_parser_version"}`);
      }

      const { data: metadataData, error: metadataError } = await admin.rpc("record_dt_pronouncement_metadata", {
        p_version_id: parserData.versionId,
        p_details: {
          pronouncementType: parsed.pronouncementType,
          officialNumber: parsed.officialNumber,
          normalizedNumber: parsed.normalizedNumber,
          internalReference: parsed.internalReference,
          issuingUnit: parsed.issuingUnit,
          actionText: parsed.actionText,
          summary: parsed.summary,
          pdfUrl: parsed.pdfUrl,
          sourcePageUrl: parsed.sourcePageUrl,
          hash: parsed.hash,
          metadata: parsed.metadata,
        },
        p_blocks: parsed.blocks,
        p_topics: parsed.topics,
        p_legal_references: parsed.legalReferences,
        p_relations: parsed.relations,
      });
      if (metadataError) {
        throw new Error(`dt_metadata_persistence_failed:${metadataError.message}`);
      }

      const isUnchanged = captureData.status === "unchanged"
        && parserData.status === "unchanged"
        && metadataData?.status === "unchanged";
      const isReparsed = parserData.status === "reparsed";
      if (isUnchanged) unchanged += 1;
      else if (isReparsed) reparsed += 1;
      else captured += 1;

      totalBlocks += parsed.blocks.length;
      totalTopics += parsed.topics.length;
      totalReferences += parsed.legalReferences.length;
      totalRelations += parsed.relations.length;
      documents.push({
        identifier: parsed.canonicalIdentifier,
        number: parsed.officialNumber,
        type: parsed.pronouncementType,
        publicationDate: parsed.publicationDate,
        status: isUnchanged ? "unchanged" : isReparsed ? "reparsed" : "captured",
        versionId: parserData.versionId,
        versionNumber: parserData.versionNumber,
        parserStatus: parserData.status,
        parserVersion: CONNECTOR_VERSION,
        topics: parsed.topics.length,
        legalReferences: parsed.legalReferences.length,
        relations: parsed.relations.length,
      });
    }

    const changes = captured + reparsed;
    const completionStatus = changes === 0 ? "unchanged" : "requires_review";
    const { error: completionError } = await admin.rpc("complete_scraper_run", {
      target_run: runId,
      target_status: completionStatus,
      target_http_status: 200,
      target_mime: "text/html",
      target_bytes: indexFetches.reduce((total, item) => total + Number(item.byteSize || 0), 0),
      target_hash: await sha256(indexFetches.map((item) => `${item.indexType}:${item.contentHash}`).sort().join("\n")),
      target_document: null,
      target_version: null,
      target_change: null,
      target_sections: discoveries.length,
      target_changes: changes,
      target_metrics: {
        year,
        month,
        discovered: discoveries.length,
        dictamenes: dictamenEntries.length,
        ordinarios: ordinarioEntries.length,
        captured,
        reparsed,
        unchanged,
        blocks: totalBlocks,
        topics: totalTopics,
        legalReferences: totalReferences,
        relations: totalRelations,
        parserVersion: CONNECTOR_VERSION,
        indexFetches,
        documents,
        humanReviewRequired: true,
      },
    });
    if (completionError) throw new Error(`dt_completion_failed:${completionError.message}`);

    const capturePeriod = `${year}-${String(month).padStart(2, "0")}`;
    await admin
      .from("scraper_connectors")
      .update({
        connector_version: CONNECTOR_VERSION,
        metadata: {
          ...(connector.metadata || {}),
          initialPeriod: capturePeriod,
          lastCapturedPeriod: capturePeriod,
          verifiedCaptureCount: Number(connector.metadata?.verifiedCaptureCount || 0) + (captured > 0 ? 1 : 0),
          lastDocumentCount: discoveries.length,
          lastParserRevisionCount: reparsed,
          parserVersion: CONNECTOR_VERSION,
          schedulingReadiness: "first_capture_verified",
          schedulingStatus: "manual_until_two_verified_captures",
          humanReviewRequired: true,
        },
      })
      .eq("id", connector.id);

    await admin
      .from("regulatory_sources")
      .update({
        connector_version: CONNECTOR_VERSION,
        metadata: {
          ...(source.metadata || {}),
          lastCapturedPeriod: capturePeriod,
          lastDocumentCount: discoveries.length,
          lastCaptureRunId: runId,
          parserVersion: CONNECTOR_VERSION,
          humanReviewRequired: true,
        },
      })
      .eq("id", source.id);

    return json({
      ok: true,
      runId,
      status: completionStatus,
      period: capturePeriod,
      discovered: discoveries.length,
      dictamenes: dictamenEntries.length,
      ordinarios: ordinarioEntries.length,
      captured,
      reparsed,
      unchanged,
      blocks: totalBlocks,
      topics: totalTopics,
      legalReferences: totalReferences,
      relations: totalRelations,
      parserVersion: CONNECTOR_VERSION,
      documents,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "dt_capture_failed";
    const retryable = /^(dt_timeout|dt_http_error|dt_enqueue_failed)/.test(message);
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
