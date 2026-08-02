import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import {
  captureLeyChileDocument,
  type LeyChileCaptureAuthorization,
} from '@/lib/regulatory/connectors/leychile'

export type LeyChileDocumentIdentity = {
  canonicalIdentifier: string
  title: string
  documentType: string
  canonicalUrl: string
  externalReference?: string | null
  publicationDate?: string | null
  effectiveFrom?: string | null
  effectiveTo?: string | null
  status: 'draft' | 'published' | 'in_force' | 'repealed' | 'pending' | 'unknown'
  versionLabel?: string | null
  versionDate?: string | null
}

export async function recordControlledLeyChileCapture(input: {
  sourceId: string
  url: string
  authorization: LeyChileCaptureAuthorization
  document: LeyChileDocumentIdentity
}) {
  const capture = await captureLeyChileDocument({
    url: input.url,
    authorization: input.authorization,
  })

  const admin = createAdminClient()
  const { data, error } = await admin.rpc('record_regulatory_source_capture', {
    p_source_id: input.sourceId,
    p_requested_url: capture.requestedUrl,
    p_final_url: capture.finalUrl,
    p_status: 'succeeded',
    p_http_status: capture.status,
    p_mime_type: capture.mimeType,
    p_content_hash: capture.contentHash,
    p_raw_content: capture.rawHtml,
    p_storage_path: null,
    p_response_headers: {},
    p_connector_version: capture.connectorVersion,
    p_error_code: null,
    p_error_message: null,
    p_document_identifier: input.document.canonicalIdentifier,
    p_document_title: input.document.title,
    p_document_type: input.document.documentType,
    p_document_url: input.document.canonicalUrl,
    p_external_reference: input.document.externalReference || null,
    p_publication_date: input.document.publicationDate || null,
    p_effective_from: input.document.effectiveFrom || null,
    p_effective_to: input.document.effectiveTo || null,
    p_document_status: input.document.status,
    p_version_label: input.document.versionLabel || null,
    p_version_date: input.document.versionDate || null,
    p_normalized_content: capture.parsed.normalizedDocument,
    p_parser_version: capture.parsed.parserVersion,
  })

  if (error || !data) {
    throw new Error(`leychile_capture_persistence_failed:${error?.code || 'unknown'}`)
  }

  return {
    capture: {
      requestedUrl: capture.requestedUrl,
      finalUrl: capture.finalUrl,
      contentHash: capture.contentHash,
      byteSize: capture.byteSize,
      articleCount: capture.parsed.articleCount,
      sectionCount: capture.parsed.sectionCount,
      parserVersion: capture.parsed.parserVersion,
    },
    record: data,
    sections: capture.parsed.sections,
  }
}
