import {
  ActionRowBuilder,
  AnyThreadChannel,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  Client,
  EmbedBuilder,
  ForumChannel,
} from 'discord.js';
import { isCommunityHelpThread } from '../helpers/is-community-help';
import { searchCommunityHelp } from '../search/search-community-help';
import { postToSearchQuery } from '../search/post-to-search-query';
import { searchDocs } from '../search/search-docs';

export default (client: Client): void => {
  // when send message in thread
  client.on('messageCreate', async (message) => {
    if (isCommunityHelpThread(message.channel)) {
      const thread: AnyThreadChannel = message.channel as AnyThreadChannel;

      // send message to the forum channel
      const channel = await client.channels.fetch(thread.id);
      if (channel !== null && channel.isTextBased()) {
        const threadMessages = await thread.messages.fetch();
        // check if it's the first message
        if (threadMessages.size !== 1) {
          return;
        }

        const forumChannel: ForumChannel = (await client.channels.fetch(
          thread.parentId as string,
        )) as ForumChannel;

        // First: mark as unanswered
        const availableTags = forumChannel.availableTags;
        const unansweredTagID: string | undefined = availableTags.find(
          (tag) =>
            // check if includes "solve" or equals "answered"
            tag.name.toLowerCase().includes('unsolve') || tag.name.toLowerCase() === 'unanswered',
        )?.id;

        if (unansweredTagID) {
          let appliedTags = [...thread.appliedTags];
          // remove "unanswered tag"
          appliedTags = appliedTags.filter((tag) => tag !== unansweredTagID);

          thread.setAppliedTags([...appliedTags, unansweredTagID]);
        } else {
          console.error('unansweredTagID not found!');
        }

        let searchQuery = await postToSearchQuery(thread.name, message.content);
        console.log('thread name', thread.name);
        console.log('searchquery', searchQuery);

        const solvedButton = new ButtonBuilder()
          .setCustomId('solved')
          .setLabel('Mark post as solved')
          .setStyle(ButtonStyle.Success);
        const row = new ActionRowBuilder<any>().addComponents(solvedButton);

        const communityHelpResults = await searchCommunityHelp(searchQuery);
        const docResults = await searchDocs(searchQuery);
        if (communityHelpResults.length === 0 && docResults.length === 0) {
          channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor(0xffffff)
                .setAuthor({
                  name: 'New Community-Help Thread Created!',
                  iconURL: 'https://cms.payloadcms.com/media/payload-logo-icon-square-v2.png',
                  url: 'https://payloadcms.com/community-help',
                })
                .setDescription(
                  'Help is on the way! To mark it as solved, use the `/solve` command.',
                ),
            ],
            components: [row],
          });
          return;
        }

        let communityHelpLinks: { name: string; url: string }[] = communityHelpResults
          ? communityHelpResults.map((m: any) => {
              return {
                name: m.name,
                url: `https://payloadcms.com/community-help/${m.platform.toLowerCase()}/${m.slug}`,
              };
            })
          : [];
        let docLinks: { name: string; url: string }[] = docResults
          ? docResults.map((m: any) => {
            const title = m?.hierarchy?.lvl0 ?? m?.hierarchy?.lvl1 ?? m?.hierarchy?.lvl2 ?? m.anchor

            return {
                name: title,
                url: m.url,
              };
            })
          : [];

        const helpEmbed = new EmbedBuilder().setColor(0xffffff).setAuthor({
          name: 'New Community-Help Thread Created!',
          iconURL: 'https://cms.payloadcms.com/media/payload-logo-icon-square-v2.png',
          url: 'https://payloadcms.com/community-help',
        });

        let description =
          'Help is on the way! To mark it as solved, use the `/solve` command. In the meantime, here are some existing threads that may help you:';
        let counter = 0;

        // Add each thread as a field. Max. 6 fields in total and balanced, so 50/50 docs and community help.
        if (docLinks.length > 0) {
          const maxLength = 6 - Math.min(communityHelpLinks.length, 3);
          if (docLinks.length > maxLength) {
            docLinks = docLinks.slice(0, maxLength);
          }
          description += '\n## Documentation:\n';
          docLinks.forEach((thread) => {
            description += `- [${thread.name}](${thread.url})\n`;
            ++counter;
          });
        }
        if (communityHelpLinks.length > 0) {
          const maxLength = 7 - counter;
          if (communityHelpLinks.length > maxLength) {
            communityHelpLinks = communityHelpLinks.slice(0, maxLength);
          }
          description += '## Community-Help:\n';

          communityHelpLinks.forEach((thread) => {
            description += `- [${thread.name}](${thread.url})\n`;
          });
        }

        helpEmbed.setDescription(description);

        // Now you can send this embed
        channel.send({ embeds: [helpEmbed], components: [row] });
      }
    }
  });
};
