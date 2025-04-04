import { getCompletions } from '../ai/get-completions'

export async function messageToTitle(message: string): Promise<string> {
  const message_to_use = message.includes('Original message from')
    ? message.split('Original message from')[0]
    : message

  const prompt = `
Message:
${message_to_use?.trim()}

###

Based on the message of the post, generate a post title (max. 8 words)
`

  console.log('messageToTitle LLM prompt:\n\n', prompt)

  try {
    const completion = await getCompletions({
      input: prompt,
      maxTokens: 100,
      model: 'gpt-4o',
      systemMessage: 'You only output plain search queries',
      temperature: 0.9,
    })
    console.log('Post-to-search-query LLM completion:', completion?.trim())
    return (
      completion?.trim()?.replace(/['"]+/g, '') ||
      (message.length > 50 ? message.substring(0, 50) + '...' : message)
    )
  } catch (e) {
    console.log('Error transforming searchQuery with OpenAI. Returning title instead\n', e)
  }
  return message.length > 50 ? message.substring(0, 50) + '...' : message
}
