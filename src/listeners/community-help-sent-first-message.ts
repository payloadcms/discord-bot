import { AnyThreadChannel, ChannelType, Client, EmbedBuilder } from 'discord.js';
import { isCommunityHelpThread } from '../helpers/is-community-help';
import { searchCommunityHelp } from '../search/search-community-help';
import { postToSearchQuery } from '../search/post-to-search-query';

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

        let searchQuery = await postToSearchQuery(thread.name, message.content);
        console.log('thread name', thread.name);
        console.log('searchquery', searchQuery);

        const msg = await searchCommunityHelp(searchQuery);

        if (msg.length === 0) {
          channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor(0x0099ff)
                .setAuthor({
                  name: 'New Community-Help Thread Created!',
                  iconURL: 'https://cms.payloadcms.com/media/payload-logo-icon-square-v2.png',
                  url: 'https://payloadcms.com/community-help',
                })
                .setDescription('Help is on the way!'),
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
            name: 'New Community-Help Thread Created!',
            iconURL: 'https://cms.payloadcms.com/media/payload-logo-icon-square-v2.png',
            url: 'https://payloadcms.com/community-help',
          })
          .setDescription(
            'Help is on the way! In the meantime, here are some existing threads that may help you:',
          );
        //.setThumbnail('https://i.imgur.com/AfFp7pu.png');

        // Add each thread as a field
        threadLinks.forEach((thread) => {
          helpEmbed.addFields({ name: thread.name, value: thread.url });
        });

        // Now you can send this embed
        channel.send({ embeds: [helpEmbed] });
      }
    }
  });
};
