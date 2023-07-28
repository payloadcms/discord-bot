import { Client, SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../types';
import { searchCommunityHelp } from '../search/search-community-help';

export const SearchCommunityHelp: Command = {
  data: new SlashCommandBuilder()
    .setName('search')
    .setDescription('Searches Community Help')
    .addStringOption((option) =>
      option.setName('query').setDescription('The search query').setRequired(true),
    ) as SlashCommandBuilder,
  run: async (client: Client, interaction: ChatInputCommandInteraction) => {
    if (!interaction.channel) {
      await interaction.followUp({
        ephemeral: true,
        content: 'You can only use this command in a channel.',
      });
      return;
    }

    const searchQuery: string = interaction.options.getString('query', true);

    const msg = await searchCommunityHelp(searchQuery);

    if (msg.length === 0) {
      await interaction.followUp({
        embeds: [
          new EmbedBuilder()
            .setColor(0x0099ff)
            .setAuthor({
              name: 'Community-Help Search',
              iconURL: 'https://cms.payloadcms.com/media/payload-logo-icon-square-v2.png',
              url: 'https://payloadcms.com/community-help',
            })
            .setDescription(`No results for **${searchQuery}** found.`),
        ],
      });
      return;
    }

    const threadLinks: { name: string; url: string }[] = msg
      ? msg.map((m: any) => {
          return {
            name: m.name,
            url: `https://payloadcms.com/community-help/${m.platform.toLowerCase()}/${m.slug}`,
          };
        })
      : [];

    const helpEmbed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setAuthor({
        name: 'Community-Help Search',
        iconURL: 'https://cms.payloadcms.com/media/payload-logo-icon-square-v2.png',
        url: 'https://payloadcms.com/community-help',
      })
      .setTitle(`Results for **${searchQuery}**:`);

    // Add each thread as a field
    threadLinks.forEach((thread) => {
      helpEmbed.addFields({ name: thread.name, value: thread.url });
    });

    await interaction.followUp({ embeds: [helpEmbed] });
  },
};
