import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  deriveSstOutcomeSignals,
  parseDtDs44LandingPage,
  parseSusesoCircularPage,
  sha256,
} from "./core.mjs";

const USER_AGENT = "KUMPLIO-Government-Intelligence/1.0 (+https://kumplio.app/regulatory)";
const DT_DS44_URL = "https://www.dt.gob.cl/portal/1626/w3-article-127643.html";
const SUSESO_URLS = [
  "https://www.suseso.cl/612/w3-article-744080.html",
  "https://www.suseso.cl/612/w3-article-776436.html",
] as const;
const MAX_BYTES = 4 * 1024 * 1024;

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
    return { html, byteSize, contentHash: await sha256(html), finalUrl: response.url || url };
  } finally {
    clearTimeout(timer);
  }
}

Deno.serve(async (request) => {
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceKey) return json({ error: "missing_configuration" }, 500);
  if (!authorized(request, serviceKey)) return json({ error: "service_role_required" }, 403);

  try {
    const dtCapture = await fetchOfficialHtml(DT_DS44_URL);
    const dt = parseDtDs44LandingPage(dtCapture.html, DT_DS44_URL);

    const suseso = [];
    const sourceTrace = [{
      authority: "Dirección del Trabajo",
      url: DT_DS44_URL,
      contentHash: dtCapture.contentHash,
      byteSize: dtCapture.byteSize,
    }];

    for (const url of SUSESO_URLS) {
      const capture = await fetchOfficialHtml(url);
      suseso.push(parseSusesoCircularPage(capture.html, url));
      sourceTrace.push({
        authority: "SUSESO",
        url,
        contentHash: capture.contentHash,
        byteSize: capture.byteSize,
      });
    }

    const signals = deriveSstOutcomeSignals({ dt, suseso });
    const snapshot = {
      parserVersion: "sst-ds44-suseso-v1",
      capturedAt: new Date().toISOString(),
      dt,
      suseso,
      signals,
      sourceTrace,
    };

    return json({
      ok: true,
      snapshotHash: await sha256(JSON.stringify(snapshot)),
      snapshot,
    });
  } catch (error) {
    console.error("[sst-ds44-bootstrap] capture failed", error instanceof Error ? error.message : "unknown");
    return json({ error: "sst_capture_failed" }, 502);
  }
});
