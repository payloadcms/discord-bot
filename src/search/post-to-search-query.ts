import { getCompletions } from '../ai/get-completions';

export async function postToSearchQuery(title: string, message: string): Promise<string> {
  const message_to_use = message.includes(
    'Original message from' ? message.split('Original message from')[0] : message,
  );

  const prompt = `
Title: ${title}

Message:
${message_to_use}

###

Based on the title and the message of the post, generate a search query (max. 10 words) for our algolia search endpoints, which might find related posts. Focus on the title
`;

  try {
    const completion = await getCompletions({
      input: prompt,
      systemMessage: 'You output plain search queries',
      model: 'gpt-3.5-turbo',
      maxTokens: 100,
      temperature: 0.9,
    });
    return completion.content;
  } catch (e) {
    console.log('Error transforming searchQuery with OpenAI. Returning title instead\n', e);
  }
  return title;
}
