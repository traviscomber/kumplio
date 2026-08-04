import { parseSnifaSanctioningDetail as parseCore } from './core.mjs'

function normalizeDeclaredMeasureLabel(html) {
  return String(html).replace(
    /Medidas\s+provisionales(?:\s*<br\s*\/?>\s*|\s+)asociadas/gi,
    'Medidas provisionales asociadas',
  )
}

function normalizeFineCells(html) {
  return String(html).replace(
    /<td([^>]*data-label=["']Multa["'][^>]*)>([\s\S]*?)<\/td>/gi,
    (_cell, attributes, body) => {
      const normalizedBody = String(body)
        .replace(/(<i[^>]*>)\s*(?:No aplica|N\/?A|-)?\s*(<\/i>)/gi, '$1$2')
        .replace(/(<i[^>]*>\s*)(\d+)\.(\d+)(\s*<\/i>)/gi, '$1$2,$3$4')
      return `<td${attributes}>${normalizedBody}</td>`
    },
  )
}

export async function parseSnifaSanctioningDetail(html, expected) {
  const normalizedHtml = normalizeFineCells(normalizeDeclaredMeasureLabel(html))
  return parseCore(normalizedHtml, expected)
}
