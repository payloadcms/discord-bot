import { Client, ThreadChannel } from 'discord.js';
import { isJobThread } from '../helpers/is-job';

export default (client: Client): void => {
  client.on('threadCreate', async (thread, newlyCreated) => {
    if (newlyCreated && isJobThread(thread)) {
      const channel: ThreadChannel = await client.channels.fetch(thread.id) as ThreadChannel;
      if (channel !== null && channel.isTextBased()) {
        if(!channel.name || (!channel.name.startsWith('[HIRING]') && !channel.name.startsWith('[SEEKING WORK]'))) {

          await channel.send('This job post does not follow the channel rules. Please delete this post, read the channel rules (first post in the channel) and create a new one.')




          await channel.setLocked(true, 'Does not follow channel rules')
          await channel.setArchived(true, 'Does not follow channel rules')

        }
      }
    }
  });
};

