import type { OpenAIProvider } from '@ai-sdk/openai'

import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'

type OpenAIModel = Parameters<OpenAIProvider['chat']>[0]

export async function getCompletions({
  frequency_penalty,
  input,
  maxTokens,
  model,
  presence_penalty,
  systemMessage,
  temperature,
}: {
  frequency_penalty?: number
  input: string
  maxTokens: number
  model: OpenAIModel
  presence_penalty?: number
  systemMessage?: string
  temperature: number
}): Promise<string> {
  const openai = createOpenAI({
    apiKey: process.env.OPENAI_KEY,
    compatibility: 'strict',
  })

  const openaiModel = openai(
    process.env.USE_FASTER_MODEL_FOR_DEBUG_SPEEDUP === 'true' ? 'gpt-3.5-turbo' : model,
    {},
  )

  const { text } = await generateText({
    frequencyPenalty: frequency_penalty ?? 0.0,
    maxTokens,
    model: openaiModel,
    presencePenalty: presence_penalty ?? 0.0,
    prompt: input,
    system: systemMessage,
    temperature,
  })

  return text
}
