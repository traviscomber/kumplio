/**
 * Vera Chatbot Streaming API
 * Real-time compliance questions & answers with AI SDK 6
 */

import { createAgentUIStreamResponse, convertToModelMessages } from 'ai'
import { veraAgent } from '@/lib/agents/vera-chatbot'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: 'Invalid messages format' }, { status: 400 })
    }

    // Convert UIMessage format to ModelMessage format
    const convertedMessages = await convertToModelMessages(messages)

    // Create streaming response with Vera agent
    return createAgentUIStreamResponse({
      agent: veraAgent,
      uiMessages: messages,
    })
  } catch (error) {
    console.error('[Vera API] Error:', error)

    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Chat failed',
      },
      { status: 500 }
    )
  }
}
