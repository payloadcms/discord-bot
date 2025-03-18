import type { ChatInputCommandInteraction, Client } from 'discord.js'

import { EmbedBuilder, SlashCommandBuilder } from 'discord.js'

import type { Command } from '../types'

import { searchCommunityHelp } from '../search/search-community-help'
import { searchDocs } from '../search/search-docs'

export const SearchCommunityHelp: Command = {
  data: new SlashCommandBuilder()
    .setName('search')
    .setDescription('Searches Docs and Community Help')
    .addStringOption((option) =>
      option.setName('query').setDescription('The search query').setRequired(true),
    ) as SlashCommandBuilder,
  run: async (client: Client, interaction: ChatInputCommandInteraction) => {
    if (!interaction.channel) {
      await interaction.followUp({
        content: 'You can only use this command in a channel.',
        ephemeral: true,
      })
      return
    }

    const searchQuery: string = interaction.options.getString('query', true)

    const communityHelpResults = await searchCommunityHelp(searchQuery)
    const docResults = await searchDocs(searchQuery)

    if (communityHelpResults.length === 0 && docResults.length === 0) {
      await interaction.followUp({
        embeds: [
          new EmbedBuilder()
            .setColor(0xffffff)
            .setAuthor({
              name: 'Community-Help Search',
              iconURL:
                'https://l4wlsi8vxy8hre4v.public.blob.vercel-storage.com/discord-bot-logo.png',
              url: 'https://payloadcms.com/community-help',
            })
            .setDescription('No results for `' + searchQuery + '` found.'),
        ],
      })
      return
    }

    let communityHelpLinks: { name: string; url: string }[] = communityHelpResults
      ? communityHelpResults.map((m: any) => {
          return {
            name: m.name,
            url: `https://payloadcms.com/community-help/${m.platform.toLowerCase()}/${m.slug}`,
          }
        })
      : []
    let docLinks: { name: string; url: string }[] = docResults
      ? docResults.map((m: any) => {
          const headers: string[] = Object.values(m.hierarchy).filter(
            (header) => header,
          ) as string[]
          const title = headers.join(' - ') || m.anchor

          return {
            name: title,
            url: m.url,
          }
        })
      : []

    const helpEmbed = new EmbedBuilder()
      .setColor(0xffffff)
      .setAuthor({
        name: 'Community-Help Search',
        iconURL: 'https://l4wlsi8vxy8hre4v.public.blob.vercel-storage.com/discord-bot-logo.png',
        url: 'https://payloadcms.com/community-help',
      })
      .setTitle('Results for `' + searchQuery + '`')

    let description = ''
    let counter = 0

    // Add each thread as a field. Max. 6 fields in total and balanced, so 50/50 docs and community help.
    if (docLinks.length > 0) {
      docLinks = docLinks.slice(0, 6 - Math.min(communityHelpLinks.length, 3))
      description += '## Documentation:\n'
      docLinks.forEach((thread) => {
        description += `- [${thread.name}](${thread.url})\n`
        ++counter
      })
    }
    if (communityHelpLinks.length > 0) {
      communityHelpLinks = communityHelpLinks.slice(0, 6 - counter)
      description += '## Community-Help:\n'

      communityHelpLinks.forEach((thread) => {
        description += `- [${thread.name}](${thread.url})\n`
      })
    }

    helpEmbed.setDescription(description)
    await interaction.followUp({ embeds: [helpEmbed] })
  },
}
