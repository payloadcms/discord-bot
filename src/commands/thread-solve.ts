import {
  ChatInputCommandInteraction,
  Client,
  SlashCommandBuilder,
  AnyThreadChannel,
  ForumChannel,
  EmbedBuilder,
  GuildMember,
  ThreadMember,
} from 'discord.js';
import { Command } from '../types';
import { isCommunityHelpThread } from '../helpers/is-community-help';

export const ThreadSolve: Command = {
  data: new SlashCommandBuilder().setName('solve').setDescription('Solves a thread'),
  run: async (client: Client, interaction: ChatInputCommandInteraction) => {
    if (!interaction.channel || !isCommunityHelpThread(interaction.channel)) {
      await interaction.followUp({
        ephemeral: true,
        content: 'You can only use this command in a community-help thread.',
      });
      return;
    }

    // mark forum post thread as solved with solved tag
    const forumThread: AnyThreadChannel = interaction.channel as AnyThreadChannel;
    const forumChannel: ForumChannel = (await client.channels.fetch(
      forumThread.parentId as string,
    )) as ForumChannel;

    // check if user has permission to solve the thread
    if (
      !interaction.inCachedGuild() ||
      !(await hasPermission(interaction.member as GuildMember, forumThread))
    ) {
      await interaction.followUp({
        ephemeral: true,
        content: 'You do not have permission to mark this thread as solved.',
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
    if (forumThread.appliedTags.includes(solvedTagID)) {
      await interaction.followUp({
        ephemeral: true,
        content: 'This thread is already marked as solved.',
      });
      return;
    }

    let appliedTags = [...forumThread.appliedTags];
    // remove "unanswered tag"
    appliedTags = appliedTags.filter((tag) => tag !== unansweredTagID);

    forumThread.setAppliedTags([...appliedTags, solvedTagID]);

    const starEmbed = new EmbedBuilder()
      .setColor(0xffffff)
      .setTitle('Thread Solved!')
      .setURL('https://github.com/payloadcms/payload')
      .setAuthor({
        name: 'Payload Bot',
        iconURL: 'https://cms.payloadcms.com/media/payload-logo-icon-square-v2.png',
        url: 'https://payloadcms.com/community-help',
      })
      .setDescription(
        'Glad your issue was resolved! :tada: If you want to help make payload better, please give us a :star: on GitHub and review us - It helps us a lot.',
      )
      //.setThumbnail('https://cms.payloadcms.com/media/payload-logo-icon-square-v2.png')
      .addFields({
        name: '🌟 Star Us on GitHub',
        value: '**[Click here to star us on GitHub](https://github.com/payloadcms/payload)**',
      })
      // review us field
      .addFields({
        name: '👍 Review Us',
        value:
          '**[Click here to review us on G2](https://www.g2.com/products/payload-cms/take_survey)**',
      });
    await interaction.followUp({
      ephemeral: false,
      embeds: [starEmbed],
    });
  },
};

// check if user has manage threads permission or the "contributor" role
async function hasPermission(
  commandExecutor: GuildMember,
  forumThread: AnyThreadChannel,
): Promise<boolean> {
  const threadCreator = await forumThread.fetchOwner();
  if (!threadCreator) {
    return false;
  }
  // check if user created the thread
  if (threadCreator.id === commandExecutor.user.id) {
    return true;
  }
  if (!commandExecutor) {
    return false;
  }

  // check if the threadCreator is a bot
  if (threadCreator.user && threadCreator.user.bot) {
    // check if the initial message in the forum thread mentions the command executor
    const initialMessage = (await forumThread.messages.fetch()).first();
    if (initialMessage && initialMessage.mentions.users.has(commandExecutor.user.id)) {
      return true;
    }
  }

  // check if the user has has the "contributor" role or manage threads permission (= is from the payload team)
  if (commandExecutor.permissions.has('ManageThreads')) {
    return true;
  }
  if (commandExecutor.roles.cache.find((role) => role.name.toLowerCase() === 'contributor')) {
    return true;
  }

  return false;
}
