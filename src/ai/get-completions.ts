import { ChatOpenAI } from 'langchain/chat_models/openai';
import { BaseMessage, HumanMessage, SystemMessage } from 'langchain/schema';

export async function getCompletions({
  input,
  temperature,
  model,
  maxTokens,
  systemMessage,
  presence_penalty,
  frequency_penalty,
  previous_messages,
}: {
  input: string;
  temperature: number;
  model: 'text-davinci-003' | 'gpt-3.5-turbo' | 'gpt-3.5-turbo-16k' | 'gpt-4' | 'gpt-4-turbo-preview';
  maxTokens: number;
  systemMessage?: string;
  presence_penalty?: number;
  frequency_penalty?: number;
  previous_messages?: BaseMessage[];
}): Promise<BaseMessage /* | { error: any }*/> {
  let response: BaseMessage;
  try {
    const chat = new ChatOpenAI({
      temperature: temperature,
      modelName:
        process.env.USE_FASTER_MODEL_FOR_DEBUG_SPEEDUP === 'true' ? 'gpt-3.5-turbo' : model,
      openAIApiKey: process.env.OPENAI_KEY,
      maxTokens: maxTokens,
      presencePenalty: presence_penalty ?? 0.0,
      frequencyPenalty: frequency_penalty ?? 0.0,
    });

    if (previous_messages && previous_messages.length > 0) {
      response = await chat.call([
        new SystemMessage(systemMessage ?? 'You are a helpful assistant.'),
        ...previous_messages,
        new HumanMessage(input),
      ]);
    } else {
      response = await chat.call([
        new SystemMessage(systemMessage ?? 'You are a helpful assistant.'),
        new HumanMessage(input),
      ]);
    }
  } catch (e) {
    throw e;
    /* return {
      error: e,
    };*/
  }

  return response;
}
