import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const API_URL = "https://servicios-leychile.bcn.cl/Navegar/get_norma_json?idNorma=1209272&idVersion=2026-12-01&idLey=&tipoVersion=&cve=&agrupa_partes=1&r=";
const PUBLIC_URL = "https://www.bcn.cl/leychile/navegar?idNorma=1209272&idVersion=2026-12-01";
const MAX_BYTES = 5 * 1024 * 1024;
const ARTICLE_PATTERN = /^[\s"“”'«»]*(art[ií]culo\s+((?:\d+|[ivxlcdm]+)(?:\s*(?:bis|ter|qu[aá]ter|[a-z]))?[°º]?|primero|segundo|tercero|cuarto|quinto|sexto|s[eé]ptimo|octavo|noveno|d[eé]cimo)(?:\s+transitorio)?)\s*(?:\.|-|–|—|:)*\s*(.*)$/i;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function normalizeText(value: string) {
  return value.normalize("NFC").replace(/\s+/g, " ").trim();
}

function decodeEntities(value: string) {
  const named: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
    ndash: "–",
    mdash: "—",
    deg: "°",
  };

  return value
    .replace(/&#(\d+);/g, (_, number) => String.fromCodePoint(Number(number)))
    .replace(/&#x([0-9a-f]+);/gi, (_, number) => String.fromCodePoint(Number.parseInt(number, 16)))
    .replace(/&([a-z]+);/gi, (entity, name) => named[name.toLowerCase()] ?? entity);
}

function htmlToParagraphs(html: string) {
  const cleaned = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<br\s*\/?\s*>/gi, "\n\n")
    .replace(/<\/(p|div|li|tr|section|article|h1|h2|h3|h4|h5|h6)>/gi, "\n\n")
    .replace(/<(p|div|li|tr|section|article|h1|h2|h3|h4|h5|h6)\b[^>]*>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ");

  return decodeEntities(cleaned)
    .replace(/\r/g, "")
    .split(/\n\s*\n+/)
    .map((paragraph) => paragraph.replace(/[\t ]+/g, " ").replace(/\n+/g, " ").trim())
    .filter(Boolean);
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function canonical(value: string) {
  return normalizeText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^articulo\s+/, "")
    .replace(/º/g, "°")
    .replace(/[^a-z0-9°]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type SourcePart = {
  id: number;
  name: string;
  html: string;
};

function structureNames(structure: unknown) {
  const names = new Map<number, string>();

  const visit = (items: unknown) => {
    if (!Array.isArray(items)) return;

    for (const item of items) {
      if (!item || typeof item !== "object") continue;
      const object = item as Record<string, unknown>;
      const id = Number(object.i);
      if (Number.isFinite(id)) names.set(id, String(object.n || `Parte ${id}`));
      if (Array.isArray(object.h)) visit(object.h);
    }
  };

  visit(structure);
  return names;
}

function flattenHtml(entries: unknown, names: Map<number, string>) {
  const parts: SourcePart[] = [];

  const visit = (items: unknown) => {
    if (!Array.isArray(items)) return;

    for (const item of items) {
      if (!item || typeof item !== "object") continue;
      const object = item as Record<string, unknown>;
      const id = Number(object.i);
      if (!Number.isFinite(id)) continue;

      parts.push({
        id,
        name: names.get(id) || `Parte ${id}`,
        html: String(object.t || ""),
      });

      if (Array.isArray(object.h)) visit(object.h);
    }
  };

  visit(entries);
  return parts;
}

async function parsePayload(payload: Record<string, unknown>) {
  const names = structureNames(payload.estructura);
  const parts = flattenHtml(payload.html, names);
  const sections: Array<Record<string, unknown>> = [];
  const normalizedParts: string[] = [];
  let ordinal = 0;

  for (const part of parts) {
    const paragraphs = htmlToParagraphs(part.html);
    if (!paragraphs.length) continue;

    normalizedParts.push(`${part.name}\n${paragraphs.join("\n\n")}`);

    const articleStarts: Array<{
      index: number;
      label: string;
      reference: string;
      opening: string;
    }> = [];

    paragraphs.forEach((paragraph, index) => {
      const match = paragraph.match(ARTICLE_PATTERN);
      if (!match) return;

      articleStarts.push({
        index,
        label: normalizeText(match[1]),
        reference: normalizeText(match[2]),
        opening: normalizeText(match[3] || ""),
      });
    });

    const keyOccurrences = new Map<string, number>();

    for (let startPosition = 0; startPosition < articleStarts.length; startPosition += 1) {
      const start = articleStarts[startPosition];
      const end = articleStarts[startPosition + 1]?.index ?? paragraphs.length;
      const articleParagraphs = [start.opening, ...paragraphs.slice(start.index + 1, end)].filter(Boolean);
      const bodyText = articleParagraphs.join("\n\n");
      const normalizedText = normalizeText(bodyText);
      if (!normalizedText) continue;

      const isPrimaryPartArticle = startPosition === 0 && /^art[ií]culo/i.test(part.name);
      const referenceLabel = isPrimaryPartArticle ? part.name : start.label;
      const baseKey = `part:${part.id}:article:${canonical(referenceLabel || start.reference)}`;
      const occurrence = (keyOccurrences.get(baseKey) || 0) + 1;
      keyOccurrences.set(baseKey, occurrence);
      const articleKey = occurrence === 1 ? baseKey : `${baseKey}:occurrence:${occurrence}`;

      ordinal += 1;
      sections.push({
        key: articleKey,
        type: "article",
        ordinal,
        referenceLabel,
        heading: part.name,
        bodyText,
        normalizedText,
        hash: await sha256(normalizedText),
        parentKey: null,
      });

      for (let index = 0; index < articleParagraphs.length; index += 1) {
        const paragraph = articleParagraphs[index];
        const incisoText = normalizeText(paragraph);
        if (!incisoText) continue;

        ordinal += 1;
        sections.push({
          key: `${articleKey}:inciso:${index + 1}`,
          type: "inciso",
          ordinal,
          referenceLabel: `${referenceLabel}, inciso ${index + 1}`,
          heading: null,
          bodyText: paragraph,
          normalizedText: incisoText,
          hash: await sha256(incisoText),
          parentKey: articleKey,
        });
      }
    }
  }

  if (!sections.some((section) => section.type === "article")) {
    throw new Error("leychile_parse_no_articles");
  }

  const normalizedDocument = normalizedParts.join("\n\n");

  return {
    parts,
    sections,
    normalizedDocument,
    documentHash: await sha256(normalizedDocument),
  };
}

Deno.serve(async () => {
  try {
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
        "user-agent": "KUMPLIO-Regulatory-Connector/1.0 (+https://www.kumplio.app/regulatory)",
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
      p_connector_version: "leychile-official-json-v1",
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
      p_parser_version: "leychile-official-json-v1",
      p_sections: parsed.sections,
    });

    if (error) {
      return json({ error: "capture_bundle_failed", code: error.code, detail: error.message }, 500);
    }

    return json({
      ok: true,
      status: "captured",
      sourceParts: parsed.parts.length,
      articleSections: parsed.sections.filter((section) => section.type === "article").length,
      incisoSections: parsed.sections.filter((section) => section.type === "inciso").length,
      totalSections: parsed.sections.length,
      rawHash,
      documentHash: parsed.documentHash,
      record: data,
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "capture_failed" }, 500);
  }
});
