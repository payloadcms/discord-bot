import type { Client } from 'discord.js'

import { isCommunityHelpThread } from '../helpers/is-community-help'

export default (client: Client): void => {
  client.on('threadCreate', async (thread, newlyCreated) => {
    if (newlyCreated && isCommunityHelpThread(thread)) {
      const channel = await client.channels.fetch(thread.id)
      if (channel !== null && channel.isTextBased()) {
        //await channel.send(`A new forum post has been created: ${thread.name}`);
      }
    }
  })
}
