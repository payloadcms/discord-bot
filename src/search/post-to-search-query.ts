import { getCompletions } from '../ai/get-completions'

export async function postToSearchQuery(title: string, message: string): Promise<string> {
  const message_to_use = message.includes('Original message from')
    ? message.split('Original message from')[0]
    : message

  const prompt = `
Title: ${title}

Message:
${message_to_use?.trim()}

###

Based on the title and the message of the post, generate a short, concise search query (max. 6 words) for our algolia search endpoints, which might find related posts. Focus on the title
`

  console.log('Post-to-search-query LLM prompt:\n\n', prompt)

  try {
    const completion = await getCompletions({
      input: prompt,
      maxTokens: 100,
      model: 'gpt-4o',
      systemMessage: 'You only output short, concise, plain search queries',
      temperature: 0.9,
    })
    console.log('Post-to-search-query LLM completion:', completion?.trim())
    return completion?.trim()?.replace(/['"]+/g, '') || title.replace(/['"]+/g, '')
  } catch (e) {
    console.log('Error transforming searchQuery with OpenAI. Returning title instead\n', e)
  }
  return title.replace(/['"]+/g, '')
}
