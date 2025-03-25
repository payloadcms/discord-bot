import type {
  Attachment,
  Client,
  GuildMember,
  Message,
  MessageContextMenuCommandInteraction,
  ThreadChannel,
} from 'discord.js'

import { ApplicationCommandType, AttachmentBuilder, ContextMenuCommandBuilder } from 'discord.js'

import type { ContextMenuCommand } from '../types'

import { getCommunityHelpChannel } from '../helpers/get-community-help-channel'
import { isCommunityHelpThread } from '../helpers/is-community-help'
import { messageToTitle } from '../search/message-to-title'

export const MoveToCommunityHelpContext: ContextMenuCommand = {
  data: new ContextMenuCommandBuilder()
    .setName('[C] Move to Community-Help')
    .setType(ApplicationCommandType.Message),
  run: async (client: Client, interaction: MessageContextMenuCommandInteraction) => {
    if (!interaction.channel || !interaction.guild || isCommunityHelpThread(interaction.channel)) {
      await interaction.followUp({
        content: 'You cannot use this command in a community-help thread.',
        ephemeral: true,
      })
      return
    }
    if (!interaction.member || !interaction.inCachedGuild() || !hasPermission(interaction.member)) {
      await interaction.followUp({
        content: 'You do not have permission to move this message to community-help.',
        ephemeral: true,
      })
      return
    }

    // create new thread in community help
    const communityHelpChannel = getCommunityHelpChannel(interaction.guild)
    const availableTags = communityHelpChannel.availableTags
    const unansweredTagID: string | undefined = availableTags.find(
      (tag) =>
        // check if includes "solve" or equals "answered"
        tag.name.toLowerCase().includes('unsolve') || tag.name.toLowerCase() === 'unanswered',
    )?.id
    if (!unansweredTagID) {
      await interaction.followUp({
        content: 'Could not find the unanswered tag.',
        ephemeral: true,
      })
      return
    }

    const _messageContent: string = interaction.targetMessage.content
    if (!_messageContent && !interaction.targetMessage.attachments.size) {
      await interaction.followUp({
        content: 'You cannot use this command on a message without content.',
        ephemeral: true,
      })
      return
    }
    const allMessagesBefore: Message[] = []
    const allMessagesAfter: Message[] = []
    const allMessages: Message[] = []

    // Now check the messages BEFORE and AFTER the messages and add all messages by the same user to a list, until it finds a message from a different user or bot

    const messagesBefore = await interaction.channel.messages.fetch({
      before: interaction.targetMessage.id,
      limit: 10,
    })
    for (const [key, value] of messagesBefore) {
      if (value.author.id === interaction.targetMessage.author.id) {
        allMessagesBefore.push(value)
      } else {
        break
      }
    }
    const messagesAfter = (
      await interaction.channel.messages.fetch({ after: interaction.targetMessage.id, limit: 10 })
    ).reverse()

    for (const [key, value] of messagesAfter) {
      if (value.author.id === interaction.targetMessage.author.id) {
        allMessagesAfter.push(value)
      } else {
        if (!value.content?.trim()?.length) {
          break
        }
        break
      }
    }
    allMessages.push(...allMessagesBefore.reverse(), interaction.targetMessage, ...allMessagesAfter)

    //Handle attachments
    const attachmentFiles: Attachment[] = []

    for (const message of allMessages) {
      if (message.attachments) {
        const attachments = message.attachments.toJSON()
        attachmentFiles.push(...attachments)
      }
    }

    // Download all attachments
    const attachments: AttachmentBuilder[] = []

    for (const a of attachmentFiles) {
      const attachmentURL = a.url
      const response = await fetch(attachmentURL)
      if (response.ok) {
        // Check if the HTTP status code is 200-299
        const arrayBuffer = await response.arrayBuffer() // Get an ArrayBuffer
        // Convert to  BufferResolvable | Stream
        const buffer = Buffer.from(arrayBuffer)

        const attachment = new AttachmentBuilder(buffer, {
          name: a.name,
        })

        attachments.push(attachment)
      } else {
        console.error('Failed to fetch:', response.statusText)
      }
    }

    const avatarURL =
      interaction.targetMessage.author.id && interaction.targetMessage.author.avatar
        ? `https://cdn.discordapp.com/avatars/${interaction.targetMessage.author.id}/${interaction.targetMessage.author.avatar}.png`
        : interaction.targetMessage.author.defaultAvatarURL

    const webhooks = await communityHelpChannel.fetchWebhooks()
    const webhook = webhooks?.size
      ? webhooks.first()
      : await communityHelpChannel.createWebhook({
          name: interaction.targetMessage.author.displayName,
          avatar: avatarURL,
        })

    if (!webhook) {
      await interaction.followUp({
        content: 'Could not create webhook.',
      })
      return
    }

    const messageContent = allMessages
      .filter((message) => message.content && message.content.trim().length > 0)
      .map((message) => message.content)
      .join('\n\n')

    const threadName = await messageToTitle(messageContent)

    // make webhook open thread
    const threadMessage: Message = await webhook.send({
      appliedTags: [unansweredTagID],
      avatarURL,
      content: messageContent,
      files: attachments,
      threadName,
      username: interaction.targetMessage.author.displayName,
    })

    const thread: ThreadChannel = communityHelpChannel.threads.cache.get(
      threadMessage.channelId,
    ) as ThreadChannel
    //await thread.members.add(interaction.targetMessage.author); // Tagging the user already adds them as a member

    // Delete original question if it's not in a thread
    if (!interaction.targetMessage.thread) {
      for (const message of allMessages) {
        await message.delete()
      }
    } else {
      // has thread - send message to thread
      await interaction.targetMessage.thread.send({
        content:
          '**This question has been moved to <#' +
          thread.id +
          ">** so it doesn't get lost. Please continue the conversation there",
      })
    }

    const followUpMessage = await interaction.followUp({
      content:
        '<@' +
        interaction.targetMessage.author.id +
        '>' +
        ' - Your question has been moved to <#' +
        thread.id +
        "> so it doesn't get lost. Please continue the conversation there",
    })

    await thread.send({
      content:
        'Original message from <@' +
        interaction.targetMessage.author.id +
        '>' +
        ' - Moved from ' +
        followUpMessage.url,
    })

    // get reaction message
    //const message = await interaction.channel.messages.fetch(interaction.replied as string);
    return
  },
}

function hasPermission(commandExecutor: GuildMember): boolean {
  if (commandExecutor.permissions.has('ManageMessages')) {
    return true
  }

  if (commandExecutor.roles.cache.find((role) => role.name.toLowerCase() === 'contributor mod')) {
    return true
  }

  return false
}
