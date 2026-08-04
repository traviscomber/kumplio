import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { parsePayload, sha256 } from "./parser.mjs";

const API_URL = "https://servicios-leychile.bcn.cl/Navegar/get_norma_json?idNorma=1209272&idVersion=2026-12-01&idLey=&tipoVersion=&cve=&agrupa_partes=1&r=";
const PUBLIC_URL = "https://www.bcn.cl/leychile/navegar?idNorma=1209272&idVersion=2026-12-01";
const MAX_BYTES = 5 * 1024 * 1024;
const CONNECTOR_VERSION = "leychile-official-json-v2";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function decodeJwtRole(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  const payload = token.split(".")[1];
  if (!payload) return null;

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const claims = JSON.parse(atob(padded)) as Record<string, unknown>;
    return typeof claims.role === "string" ? claims.role : null;
  } catch {
    return null;
  }
}

Deno.serve(async (request) => {
  try {
    if (decodeJwtRole(request) !== "service_role") {
      return json({ error: "service_role_required" }, 403);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceKey) {
      return json({ error: "missing_supabase_configuration" }, 500);
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: source, error: sourceError } = await supabase
      .from("regulatory_sources")
      .select("id")
      .eq("canonical_url", "https://www.bcn.cl/leychile/")
      .single();

    if (sourceError || !source) {
      return json({ error: "source_not_registered" }, 500);
    }

    const response = await fetch(API_URL, {
      headers: {
        accept: "application/json",
        "user-agent": "KUMPLIO-Regulatory-Connector/2.0 (+https://www.kumplio.app/regulatory)",
      },
    });

    if (!response.ok) {
      return json({ error: "http_error", status: response.status }, 502);
    }

    const rawJson = await response.text();
    const byteSize = new TextEncoder().encode(rawJson).byteLength;

    if (byteSize > MAX_BYTES) {
      return json({ error: "response_too_large", byteSize }, 413);
    }

    const payload = JSON.parse(rawJson) as Record<string, unknown>;
    const parsed = await parsePayload(payload);
    const rawHash = await sha256(rawJson);
    const metadata = (payload.metadatos || {}) as Record<string, unknown>;

    const { data, error } = await supabase.rpc("record_leychile_capture_bundle", {
      p_source_id: source.id,
      p_requested_url: API_URL,
      p_final_url: API_URL,
      p_http_status: response.status,
      p_mime_type: "application/json",
      p_content_hash: rawHash,
      p_raw_content: rawJson,
      p_connector_version: CONNECTOR_VERSION,
      p_document_identifier: "LEY-21719",
      p_document_title: String(
        metadata.titulo_norma || "Ley 21.719 — Protección y tratamiento de datos personales",
      ),
      p_document_type: "law",
      p_document_url: PUBLIC_URL,
      p_external_reference: "1209272",
      p_publication_date: String(metadata.fecha_publicacion || "2024-12-13"),
      p_effective_from: "2026-12-01",
      p_effective_to: null,
      p_document_status: "published",
      p_version_label: "Con vigencia diferida por fecha — 01-DIC-2026",
      p_version_date: "2026-12-01",
      p_normalized_content: parsed.normalizedDocument,
      p_parser_version: CONNECTOR_VERSION,
      p_sections: parsed.sections,
    });

    if (error) {
      return json({ error: "capture_bundle_failed", code: error.code, detail: error.message }, 500);
    }

    return json({
      ok: true,
      status: String(data?.status || "captured"),
      byteSize,
      sourceParts: parsed.parts.length,
      articleSections: parsed.sections.filter((section) => section.type === "article").length,
      incisoSections: parsed.sections.filter((section) => section.type === "inciso").length,
      totalSections: parsed.sections.length,
      rawHash,
      documentHash: parsed.documentHash,
      parserVersion: CONNECTOR_VERSION,
      record: data,
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "capture_failed" }, 500);
  }
});
