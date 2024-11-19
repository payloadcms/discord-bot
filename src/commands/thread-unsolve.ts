import {
  ChatInputCommandInteraction,
  Client,
  SlashCommandBuilder,
  AnyThreadChannel,
  ForumChannel,
  EmbedBuilder,
  GuildMember,
} from 'discord.js';
import { Command } from '../types';
import { isCommunityHelpThread } from '../helpers/is-community-help';
import { hasThreadManagePermission } from './hasThreadManagePermission';

export const ThreadUnSolve: Command = {
  data: new SlashCommandBuilder().setName('unsolve').setDescription('Unolves a thread'),
  run: async (client: Client, interaction: ChatInputCommandInteraction) => {
    if (!interaction.channel || !isCommunityHelpThread(interaction.channel)) {
      await interaction.followUp({
        ephemeral: true,
        content: 'You can only use this command in a community-help thread.',
      });
      return;
    }

    // mark forum post thread as unsolved with unsolved tag
    const forumThread: AnyThreadChannel = interaction.channel as AnyThreadChannel;
    const forumChannel: ForumChannel = (await client.channels.fetch(
      forumThread.parentId as string,
    )) as ForumChannel;

    // check if user has permission to unsolve the thread
    if (
      !interaction.inCachedGuild() ||
      !(await hasThreadManagePermission(interaction.member as GuildMember, forumThread))
    ) {
      await interaction.followUp({
        ephemeral: true,
        content:
          'You do not have permission to mark this thread as unsolved. Only thread creators, contributors and payload team members can mark a thread as unsolved.',
      });
      return;
    }

    const availableTags = forumChannel.availableTags;
    const solvedTagID: string | undefined = availableTags.find(
      (tag) =>
        // check if includes "solve" or equals "answered"
        tag.name.toLowerCase().includes('solve') || tag.name.toLowerCase() === 'answered',
    )?.id;
    const unansweredTagID: string | undefined = availableTags.find(
      (tag) =>
        // check if includes "solve" or equals "answered"
        tag.name.toLowerCase().includes('unsolve') || tag.name.toLowerCase() === 'unanswered',
    )?.id;

    if (!solvedTagID || !unansweredTagID) {
      await interaction.followUp({
        ephemeral: true,
        content: 'Bot error: Could not find tags.',
      });
      return;
    }
    if (forumThread.appliedTags.includes(unansweredTagID)) {
      await interaction.followUp({
        ephemeral: true,
        content: 'This thread is already marked as unanswered.',
      });
      return;
    }

    let appliedTags = [...forumThread.appliedTags];
    // remove "unanswered tag"
    appliedTags = appliedTags.filter((tag) => tag !== solvedTagID);

    forumThread.setAppliedTags([...appliedTags, unansweredTagID]);

    const starEmbed = new EmbedBuilder()
      .setColor(0xffffff)
      .setTitle('Thread Unsolved!')
      .setURL('https://github.com/payloadcms/payload')
      .setAuthor({
        name: 'Payload Bot',
        iconURL: 'https://l4wlsi8vxy8hre4v.public.blob.vercel-storage.com/discord-bot-logo.png',
        url: 'https://payloadcms.com/community-help',
      })
      .setDescription('This thread has been marked as unsolved. Help is on the way!');
    await interaction.followUp({
      ephemeral: false,
      embeds: [starEmbed],
    });
  },
};

