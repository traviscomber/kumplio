import { PDFParse } from 'pdf-parse'

export async function extractPDFText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer })

  try {
    const result = await parser.getText()
    return result.text
  } catch (error) {
    console.error('[pdf-extraction]', error instanceof Error ? error.message : 'unknown_error')
    throw new Error('Failed to extract PDF text')
  } finally {
    await parser.destroy()
  }
}

export async function extractDOCXText(_buffer: Buffer): Promise<string> {
  throw new Error('DOCX extraction is not available yet. Upload a PDF or TXT file.')
}

export async function extractTXTText(buffer: Buffer): Promise<string> {
  try {
    return buffer.toString('utf-8')
  } catch (error) {
    console.error('[txt-extraction]', error instanceof Error ? error.message : 'unknown_error')
    throw new Error('Failed to extract TXT text')
  }
}

export async function extractDocumentText(
  buffer: Buffer,
  fileType: string,
): Promise<string> {
  switch (fileType.trim().toLowerCase()) {
    case 'pdf':
    case 'application/pdf':
      return extractPDFText(buffer)
    case 'docx':
    case 'doc':
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    case 'application/msword':
      return extractDOCXText(buffer)
    case 'txt':
    case 'text/plain':
      return extractTXTText(buffer)
    default:
      throw new Error(`Unsupported file type: ${fileType}`)
  }
}

export function cleanText(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/[\t ]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function chunkText(text: string, chunkSize = 3000): string[] {
  if (!Number.isFinite(chunkSize) || chunkSize < 100) {
    throw new Error('chunkSize must be at least 100 characters')
  }

  const chunks: string[] = []
  let currentChunk = ''
  const segments = text.split(/(?<=[.!?])\s+/)

  for (const segment of segments) {
    if (segment.length > chunkSize) {
      if (currentChunk.trim()) chunks.push(currentChunk.trim())
      currentChunk = ''
      for (let index = 0; index < segment.length; index += chunkSize) {
        chunks.push(segment.slice(index, index + chunkSize).trim())
      }
      continue
    }

    const candidate = currentChunk ? `${currentChunk} ${segment}` : segment
    if (candidate.length > chunkSize) {
      if (currentChunk.trim()) chunks.push(currentChunk.trim())
      currentChunk = segment
    } else {
      currentChunk = candidate
    }
  }

  if (currentChunk.trim()) chunks.push(currentChunk.trim())
  return chunks.filter(Boolean)
}
