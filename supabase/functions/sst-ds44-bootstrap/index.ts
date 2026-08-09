import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  deriveSstOutcomeSignals,
  parseDtDs44LandingPage,
  parseSusesoCircularIndexPage,
  parseSusesoCircularPage,
  sha256,
} from "./core.mjs";

const CONNECTOR_VERSION = "sst-ds44-suseso-v3";
const USER_AGENT = "KUMPLIO-Government-Intelligence/1.0 (+https://kumplio.app/regulatory)";
const DT_DS44_URL = "https://www.dt.gob.cl/portal/1626/w3-article-127643.html";
const SUSESO_INDEX_URL = "https://www.suseso.cl/612/w3-propertyvalue-69181.html";
const SUSESO_ANCHOR_URLS = [
  "https://www.suseso.cl/612/w3-article-744080.html",
  "https://www.suseso.cl/612/w3-article-776436.html",
] as const;
const MAX_SUSESO_DETAILS = 12;
const MAX_BYTES = 4 * 1024 * 1024;

type AdminClient = ReturnType<typeof createClient>;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

function authorized(request: Request, serviceKey: string) {
  return request.headers.get("authorization") === `Bearer ${serviceKey}`;
}

async function fetchOfficialHtml(url: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml;q=0.9",
        "Accept-Language": "es-CL,es;q=0.9",
        "User-Agent": USER_AGENT,
      },
    });
    if (!response.ok) throw new Error(`sst_http_error:${response.status}`);
    const contentType = (response.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if (!["text/html", "application/xhtml+xml"].includes(contentType)) throw new Error(`sst_mime_not_allowed:${contentType}`);
    const html = await response.text();
    const byteSize = new TextEncoder().encode(html).byteLength;
    if (!html.trim()) throw new Error("sst_empty_response");
    if (byteSize > MAX_BYTES) throw new Error("sst_response_too_large");
    return {
      html,
      byteSize,
      contentHash: await sha256(html),
      finalUrl: response.url || url,
      contentType,
      responseHeaders: Object.fromEntries(response.headers.entries()),
    };
  } finally {
    clearTimeout(timer);
  }
}

async function resolveSource(admin: AdminClient, canonicalUrl: string) {
  const { data, error } = await admin
    .from("regulatory_sources")
    .select("id")
    .eq("canonical_url", canonicalUrl)
    .single();
  if (error || !data?.id) throw new Error(`sst_source_not_registered:${canonicalUrl}`);
  return data.id as string;
}

async function persistDocument(admin: AdminClient, options: {
  sourceId: string;
  capture: Awaited<ReturnType<typeof fetchOfficialHtml>>;
  identifier: string;
  title: string;
  documentType: string;
  documentUrl: string;
  externalReference?: string | null;
  publicationDate?: string | null;
  normalizedContent: string;
  sections: Array<Record<string, unknown>>;
}) {
  const { data: captureData, error: captureError } = await admin.rpc("record_regulatory_source_capture", {
    p_source_id: options.sourceId,
    p_requested_url: options.documentUrl,
    p_final_url: options.capture.finalUrl,
    p_status: "succeeded",
    p_http_status: 200,
    p_mime_type: options.capture.contentType,
    p_content_hash: options.capture.contentHash,
    p_raw_content: options.capture.html,
    p_storage_path: null,
    p_response_headers: options.capture.responseHeaders,
    p_connector_version: CONNECTOR_VERSION,
    p_error_code: null,
    p_error_message: null,
    p_document_identifier: options.identifier,
    p_document_title: options.title,
    p_document_type: options.documentType,
    p_document_url: options.documentUrl,
    p_external_reference: options.externalReference || null,
    p_publication_date: options.publicationDate || null,
    p_effective_from: options.publicationDate || null,
    p_effective_to: null,
    p_document_status: "published",
    p_version_label: options.publicationDate ? `${options.externalReference || options.identifier} — ${options.publicationDate}` : options.identifier,
    p_version_date: options.publicationDate || null,
    p_normalized_content: options.normalizedContent,
    p_parser_version: CONNECTOR_VERSION,
  });
  if (captureError || !captureData?.documentId || !captureData?.fetchId) {
    throw new Error(`sst_capture_persistence_failed:${captureError?.message || "missing_identity"}`);
  }

  const enrichedSections = [];
  for (let index = 0; index < options.sections.length; index += 1) {
    const section = options.sections[index];
    const bodyText = String(section.bodyText || section.normalizedText || "");
    enrichedSections.push({
      ...section,
      ordinal: index + 1,
      hash: await sha256(`${section.key || index + 1}|${bodyText}`),
    });
  }

  const { data: parserData, error: parserError } = await admin.rpc("record_regulatory_parser_revision", {
    p_document_id: captureData.documentId,
    p_source_fetch_id: captureData.fetchId,
    p_source_content_hash: options.capture.contentHash,
    p_parser_version: CONNECTOR_VERSION,
    p_normalized_content: options.normalizedContent,
    p_sections: enrichedSections,
  });
  if (parserError || !parserData?.versionId) {
    throw new Error(`sst_parser_persistence_failed:${parserError?.message || "missing_version"}`);
  }
  return {
    documentId: captureData.documentId as string,
    versionId: parserData.versionId as string,
    captureStatus: captureData.status,
    parserStatus: parserData.status,
  };
}

Deno.serve(async (request) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return json({ error: "missing_configuration" }, 500);
  if (!authorized(request, serviceKey)) return json({ error: "service_role_required" }, 403);

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const [dtSourceId, susesoSourceId] = await Promise.all([
      resolveSource(admin, DT_DS44_URL),
      resolveSource(admin, SUSESO_INDEX_URL),
    ]);

    const dtCapture = await fetchOfficialHtml(DT_DS44_URL);
    const dt = parseDtDs44LandingPage(dtCapture.html, DT_DS44_URL);
    const dtNormalized = JSON.stringify({ instruments: dt.instruments, resources: dt.resources });
    const dtPersistence = await persistDocument(admin, {
      sourceId: dtSourceId,
      capture: dtCapture,
      identifier: "dt:ds44:operational-materials",
      title: "Decreto 44 — instrumentos preventivos y materiales de fiscalización",
      documentType: "dt_ds44_operational_materials",
      documentUrl: DT_DS44_URL,
      externalReference: "DS44",
      normalizedContent: dtNormalized,
      sections: [
        ...dt.instruments.map((name: string, index: number) => ({
          key: `instrument:${index + 1}`,
          type: "instrument",
          referenceLabel: `DS44-I${index + 1}`,
          heading: name,
          bodyText: name,
          normalizedText: name,
          metadata: { sourceRole: "official_material", legalEffect: "requires_grounding" },
        })),
        ...dt.resources.map((resource: Record<string, unknown>, index: number) => ({
          key: `resource:${index + 1}`,
          type: "resource",
          referenceLabel: String(resource.resourceType || `resource-${index + 1}`),
          heading: String(resource.title || "Recurso oficial"),
          bodyText: String(resource.url || ""),
          normalizedText: `${String(resource.title || "")} ${String(resource.url || "")}`,
          metadata: {
            sourceRole: resource.authorityRole,
            resourceType: resource.resourceType,
            url: resource.url,
            legalEffect: resource.authorityRole === "technical_guidance" ? "not_automatic_obligation" : "requires_grounding",
          },
        })),
      ],
    });

    const indexCapture = await fetchOfficialHtml(SUSESO_INDEX_URL);
    const discoveries = parseSusesoCircularIndexPage(indexCapture.html, SUSESO_INDEX_URL);
    const discoveredCandidates = discoveries
      .filter((item: { sstRelevant?: boolean; ds44Hint?: boolean }) => item.sstRelevant || item.ds44Hint)
      .slice(0, MAX_SUSESO_DETAILS);
    const detailUrls = Array.from(new Set([
      ...SUSESO_ANCHOR_URLS,
      ...discoveredCandidates.map((item: { detailUrl: string }) => item.detailUrl),
    ])).slice(0, MAX_SUSESO_DETAILS);

    const suseso = [];
    const persistedCirculars = [];
    const sourceTrace = [
      { authority: "Dirección del Trabajo", url: DT_DS44_URL, contentHash: dtCapture.contentHash, byteSize: dtCapture.byteSize },
      { authority: "SUSESO", url: SUSESO_INDEX_URL, contentHash: indexCapture.contentHash, byteSize: indexCapture.byteSize },
    ];

    for (const url of detailUrls) {
      const capture = await fetchOfficialHtml(url);
      const parsed = parseSusesoCircularPage(capture.html, url);
      if (!(parsed.sstRelevant || parsed.ds44Related)) continue;
      suseso.push(parsed);
      const normalizedContent = JSON.stringify(parsed);
      const persisted = await persistDocument(admin, {
        sourceId: susesoSourceId,
        capture,
        identifier: parsed.canonicalIdentifier,
        title: `Circular SUSESO ${parsed.circularNumber} — ${parsed.subject || "SST"}`,
        documentType: "suseso_sst_circular",
        documentUrl: parsed.sourceUrl,
        externalReference: parsed.circularNumber,
        publicationDate: parsed.publicationDate,
        normalizedContent,
        sections: [{
          key: "circular",
          type: "supervisory_instruction",
          referenceLabel: `Circular ${parsed.circularNumber}`,
          heading: parsed.subject || `Circular ${parsed.circularNumber}`,
          bodyText: [parsed.subject, parsed.topic, parsed.observation, parsed.action, parsed.sources].filter(Boolean).join("\n"),
          normalizedText: normalizedContent,
          metadata: {
            sourceRole: "supervisory_instruction",
            ds44Related: parsed.ds44Related,
            sstRelevant: parsed.sstRelevant,
            recipient: parsed.recipient,
            department: parsed.department,
          },
        }],
      });
      persistedCirculars.push({ circularNumber: parsed.circularNumber, ...persisted });
      sourceTrace.push({ authority: "SUSESO", url, contentHash: capture.contentHash, byteSize: capture.byteSize });
    }

    const signals = deriveSstOutcomeSignals({ dt, suseso });
    const snapshot = {
      parserVersion: CONNECTOR_VERSION,
      capturedAt: new Date().toISOString(),
      dt,
      dtPersistence,
      susesoDiscovery: {
        indexUrl: SUSESO_INDEX_URL,
        discovered: discoveries.length,
        relevantCandidates: discoveredCandidates.length,
        fetchedDetails: detailUrls.length,
        explicitDs44Hints: discoveries.filter((item: { ds44Hint?: boolean }) => item.ds44Hint).length,
      },
      suseso,
      persistedCirculars,
      signals,
      sourceTrace,
    };

    return json({ ok: true, snapshotHash: await sha256(JSON.stringify(snapshot)), snapshot });
  } catch (error) {
    console.error("[sst-ds44-bootstrap] capture failed", error instanceof Error ? error.message : "unknown");
    return json({ error: "sst_capture_failed" }, 502);
  }
});
