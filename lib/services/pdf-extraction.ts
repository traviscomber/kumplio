// PDF extraction service for KUMPLIO
// Extracts text from PDF and DOCX files

import * as pdfParse from 'pdf-parse';
import { DocumentFormat } from '@/lib/types/documents';

/**
 * Extract text from a PDF buffer
 */
export async function extractPDFText(buffer: Buffer): Promise<string> {
  try {
    console.log('[v0] Starting PDF extraction');
    
    const data = await pdfParse(buffer);
    const text = data.text;
    
    console.log('[v0] PDF extracted:', text.length, 'characters');
    return text;
  } catch (error) {
    console.error('[v0] PDF extraction error:', error);
    throw new Error('Failed to extract PDF text');
  }
}

/**
 * Extract text from DOCX file
 * Note: For now, we'll use a simple approach. 
 * Consider using mammoth.js for better DOCX support
 */
export async function extractDOCXText(buffer: Buffer): Promise<string> {
  try {
    console.log('[v0] Starting DOCX extraction');
    
    // TODO: Implement proper DOCX parsing with mammoth.js
    // For MVP, convert to text via simple parsing
    const text = buffer.toString('utf-8');
    
    console.log('[v0] DOCX extracted:', text.length, 'characters');
    return text;
  } catch (error) {
    console.error('[v0] DOCX extraction error:', error);
    throw new Error('Failed to extract DOCX text');
  }
}

/**
 * Extract text from TXT file
 */
export async function extractTXTText(buffer: Buffer): Promise<string> {
  try {
    const text = buffer.toString('utf-8');
    console.log('[v0] TXT extracted:', text.length, 'characters');
    return text;
  } catch (error) {
    console.error('[v0] TXT extraction error:', error);
    throw new Error('Failed to extract TXT text');
  }
}

/**
 * Main extraction function that handles all formats
 */
export async function extractDocumentText(
  buffer: Buffer,
  fileType: string
): Promise<string> {
  console.log('[v0] Extracting document text, format:', fileType);

  switch (fileType.toLowerCase()) {
    case 'pdf':
      return extractPDFText(buffer);
    case 'docx':
    case 'doc':
      return extractDOCXText(buffer);
    case 'txt':
      return extractTXTText(buffer);
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

/**
 * Clean and normalize extracted text
 */
export function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ') // Replace multiple spaces
    .replace(/\n+/g, '\n') // Replace multiple newlines
    .trim();
}

/**
 * Split text into chunks for AI processing
 * Avoids token limits by splitting large documents
 */
export function chunkText(text: string, chunkSize: number = 3000): string[] {
  const chunks: string[] = [];
  let currentChunk = '';

  const sentences = text.split(/([.!?]+)/);

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > chunkSize) {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = sentence;
    } else {
      currentChunk += sentence;
    }
  }

  if (currentChunk) chunks.push(currentChunk);

  return chunks.filter((chunk) => chunk.trim().length > 0);
}
