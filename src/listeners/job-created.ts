import { Client } from 'discord.js';
import { isJobThread } from '../helpers/is-job';

export default (client: Client): void => {
  client.on('threadCreate', async (thread, newlyCreated) => {
    if (newlyCreated && isJobThread(thread)) {
      const channel = await client.channels.fetch(thread.id);
      if (channel !== null && channel.isTextBased()) {
        await channel.send(`A new forum post has been created: ${thread.name}`);
      }
    }
  });
};
