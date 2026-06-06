import OpenAI from 'openai'

let clientInstance: OpenAI | null = null

export function getOpenAIClient(): OpenAI {
  if (!clientInstance) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set')
    }

    clientInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  return clientInstance
}

export function resetOpenAIClient(): void {
  clientInstance = null
}
