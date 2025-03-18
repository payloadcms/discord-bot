import type {
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

export const MoveToCommunityHelp: ContextMenuCommand = {
  data: new ContextMenuCommandBuilder()
    .setName('Move to Community-Help')
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

    const messageContent: string = interaction.targetMessage.content
    if (!messageContent && !interaction.targetMessage.attachments.size) {
      await interaction.followUp({
        content: 'You cannot use this command on a message without content.',
        ephemeral: true,
      })
      return
    }

    let attachmentFiles: any = []

    if (interaction.targetMessage.attachments) {
      attachmentFiles = interaction.targetMessage.attachments.toJSON()
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
      'https://cdn.discordapp.com/avatars/' +
        interaction.targetMessage.author.id +
        '/' +
        interaction.targetMessage.author.avatar +
        '.png' ?? interaction.targetMessage.author.defaultAvatarURL

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

    const threadName = await messageToTitle(messageContent)

    // make webhook open thread
    const threadMessage: Message = await webhook.send({
      avatarURL,
      username: interaction.targetMessage.author.displayName,
      // @ts-ignore
      appliedTags: [unansweredTagID],
      content: messageContent,
      files: attachments,
      threadName,
    })

    const thread: ThreadChannel = communityHelpChannel.threads.cache.get(
      threadMessage.channelId,
    ) as ThreadChannel
    //await thread.members.add(interaction.targetMessage.author); // Tagging the user already adds them as a member

    // Delete original question if it's not in a thread
    if (!interaction.targetMessage.thread) {
      await interaction.targetMessage.delete()
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
