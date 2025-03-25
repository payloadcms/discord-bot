import type {
  AnyThreadChannel,
  ChatInputCommandInteraction,
  Client,
  ForumChannel,
} from 'discord.js'

import { EmbedBuilder, SlashCommandBuilder } from 'discord.js'

import type { Command } from '../types'

import { isCommunityHelpThread } from '../helpers/is-community-help'
import { hasThreadManagePermission } from './hasThreadManagePermission'

export const ThreadSolve: Command = {
  data: new SlashCommandBuilder().setName('solve').setDescription('Solves a thread'),
  run: async (client: Client, interaction: ChatInputCommandInteraction) => {
    if (!interaction.channel || !isCommunityHelpThread(interaction.channel)) {
      await interaction.followUp({
        content: 'You can only use this command in a community-help thread.',
        ephemeral: true,
      })
      return
    }

    // mark forum post thread as solved with solved tag
    const forumThread: AnyThreadChannel = interaction.channel as AnyThreadChannel
    const forumChannel: ForumChannel = (await client.channels.fetch(
      forumThread.parentId as string,
    )) as ForumChannel

    // check if user has permission to solve the thread
    if (
      !interaction.inCachedGuild() ||
      !(await hasThreadManagePermission(interaction.member, forumThread))
    ) {
      await interaction.followUp({
        content:
          'You do not have permission to mark this thread as solved. Only thread creators, contributors and payload team members can mark a thread as solved.',
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
    if (forumThread.appliedTags.includes(solvedTagID)) {
      await interaction.followUp({
        content: 'This thread is already marked as solved.',
        ephemeral: true,
      })
      return
    }

    let appliedTags = [...forumThread.appliedTags]
    // remove "unanswered tag"
    appliedTags = appliedTags.filter((tag) => tag !== unansweredTagID)

    await forumThread.setAppliedTags([...appliedTags, solvedTagID])

    const starEmbed = new EmbedBuilder()
      .setColor(0xffffff)
      .setTitle('Thread Solved!')
      .setURL('https://github.com/payloadcms/payload')
      .setAuthor({
        name: 'Payload Bot',
        iconURL: 'https://l4wlsi8vxy8hre4v.public.blob.vercel-storage.com/discord-bot-logo.png',
        url: 'https://payloadcms.com/community-help',
      })
      .setDescription(
        'Glad your issue was resolved! :tada: If you want to help make payload better, please give us a :star: on GitHub and review us - It helps us a lot.',
      )
      //.setThumbnail('https://l4wlsi8vxy8hre4v.public.blob.vercel-storage.com/discord-bot-logo.png')
      .addFields({
        name: '🌟 Star Us on GitHub',
        value: '**[Click here to star us on GitHub](https://github.com/payloadcms/payload)**',
      })
      // review us field
      .addFields({
        name: '👍 Review Us',
        value:
          '**[Click here to review us on G2](https://www.g2.com/products/payload-cms/take_survey)**',
      })

    await interaction.followUp({
      embeds: [starEmbed],
      ephemeral: false,
    })
  },
}
