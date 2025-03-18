import type {
  AnyThreadChannel,
  ChatInputCommandInteraction,
  Client,
  ForumChannel,
  GuildMember,
} from 'discord.js'

import { EmbedBuilder, SlashCommandBuilder } from 'discord.js'

import type { Command } from '../types'

import { isCommunityHelpThread } from '../helpers/is-community-help'
import { hasThreadManagePermission } from './hasThreadManagePermission'

export const ThreadUnSolve: Command = {
  data: new SlashCommandBuilder().setName('unsolve').setDescription('Unolves a thread'),
  run: async (client: Client, interaction: ChatInputCommandInteraction) => {
    if (!interaction.channel || !isCommunityHelpThread(interaction.channel)) {
      await interaction.followUp({
        content: 'You can only use this command in a community-help thread.',
        ephemeral: true,
      })
      return
    }

    // mark forum post thread as unsolved with unsolved tag
    const forumThread: AnyThreadChannel = interaction.channel as AnyThreadChannel
    const forumChannel: ForumChannel = (await client.channels.fetch(
      forumThread.parentId as string,
    )) as ForumChannel

    // check if user has permission to unsolve the thread
    if (
      !interaction.inCachedGuild() ||
      !(await hasThreadManagePermission(interaction.member, forumThread))
    ) {
      await interaction.followUp({
        content:
          'You do not have permission to mark this thread as unsolved. Only thread creators, contributors and payload team members can mark a thread as unsolved.',
        ephemeral: true,
      })
      return
    }

    const availableTags = forumChannel.availableTags
    const solvedTagID: string | undefined = availableTags.find(
      (tag) =>
        // check if includes "solve" or equals "answered"
        tag.name.toLowerCase().includes('solve') || tag.name.toLowerCase() === 'answered',
    )?.id
    const unansweredTagID: string | undefined = availableTags.find(
      (tag) =>
        // check if includes "solve" or equals "answered"
        tag.name.toLowerCase().includes('unsolve') || tag.name.toLowerCase() === 'unanswered',
    )?.id

    if (!solvedTagID || !unansweredTagID) {
      await interaction.followUp({
        content: 'Bot error: Could not find tags.',
        ephemeral: true,
      })
      return
    }
    if (forumThread.appliedTags.includes(unansweredTagID)) {
      await interaction.followUp({
        content: 'This thread is already marked as unanswered.',
        ephemeral: true,
      })
      return
    }

    let appliedTags = [...forumThread.appliedTags]
    // remove "unanswered tag"
    appliedTags = appliedTags.filter((tag) => tag !== solvedTagID)

    forumThread.setAppliedTags([...appliedTags, unansweredTagID])

    const starEmbed = new EmbedBuilder()
      .setColor(0xffffff)
      .setTitle('Thread Unsolved!')
      .setURL('https://github.com/payloadcms/payload')
      .setAuthor({
        name: 'Payload Bot',
        iconURL: 'https://l4wlsi8vxy8hre4v.public.blob.vercel-storage.com/discord-bot-logo.png',
        url: 'https://payloadcms.com/community-help',
      })
      .setDescription('This thread has been marked as unsolved. Help is on the way!')
    await interaction.followUp({
      embeds: [starEmbed],
      ephemeral: false,
    })
  },
}
