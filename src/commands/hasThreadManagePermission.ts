// check if user has permission to perform thread management tasks like solving or unsolving threads. This includes things a thread creator can do
import type { AnyThreadChannel, GuildMember } from 'discord.js'

export async function hasThreadManagePermission(
  commandExecutor: GuildMember,
  forumThread: AnyThreadChannel,
): Promise<boolean> {
  const threadCreator = await forumThread.fetchOwner()
  let threadCreatorID = threadCreator?.id
  let threadCreatorIsBot = threadCreator?.user?.bot

  if (!threadCreator) {
    // Thread created by webhook (due to move-to-community-help)
    // Fetch user of first message
    const firstMessage = await forumThread.fetchStarterMessage()
    threadCreatorID = firstMessage?.author.id as string
    threadCreatorIsBot = firstMessage?.author.bot as boolean
  }

  if (!threadCreatorIsBot) {
    if (!threadCreator || !commandExecutor) {
      return false
    }

    // check if user created the thread
    if (threadCreator.id === commandExecutor.user.id) {
      return true
    }
  }

  // check if the threadCreator is a bot
  if (threadCreatorIsBot) {
    // check if the initial message in the forum thread mentions the command executor
    const initialMessage = await forumThread.fetchStarterMessage()

    if (initialMessage && initialMessage.mentions.users.has(commandExecutor.user.id)) {
      return true
    }
    // Also check the first 2 messages
    const allMessages = await forumThread.messages.fetch()
    const messages = allMessages.values()
    const messagesReversed = Array.from(messages).reverse()

    let i = 0
    for (const message of messagesReversed) {
      if (i > 1) {
        break
      }

      if (message.mentions.users.has(commandExecutor.user.id)) {
        return true
      }
      i++
    }
  }

  // check if the user has the "contributor" role or manage threads permission (= is from the payload team)
  if (commandExecutor.permissions.has('ManageThreads')) {
    return true
  }
  if (commandExecutor.roles.cache.find((role) => role.name.toLowerCase() === 'contributor')) {
    return true
  }

  return false
}
