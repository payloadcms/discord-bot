import { createOpenAI, OpenAIProvider } from '@ai-sdk/openai';
import { generateText } from 'ai';

type OpenAIModel = Parameters<OpenAIProvider['chat']>[0];

export async function getCompletions({
  input,
  temperature,
  model,
  maxTokens,
  systemMessage,
  presence_penalty,
  frequency_penalty,
}: {
  input: string;
  temperature: number;
  model: OpenAIModel;
  maxTokens: number;
  systemMessage?: string;
  presence_penalty?: number;
  frequency_penalty?: number;
}): Promise<string> {
  const openai = createOpenAI({
    compatibility: 'strict',
    apiKey: process.env.OPENAI_KEY,
  });

  const openaiModel = openai(
    process.env.USE_FASTER_MODEL_FOR_DEBUG_SPEEDUP === 'true' ? 'gpt-3.5-turbo' : model,
    {},
  );

  const { text } = await generateText({
    model: openaiModel,
    prompt: input,
    temperature: temperature,
    maxTokens: maxTokens,
    system: systemMessage,
    presencePenalty: presence_penalty ?? 0.0,
    frequencyPenalty: frequency_penalty ?? 0.0,
  });

  return text;
}
