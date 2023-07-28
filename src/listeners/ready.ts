import { Client } from 'discord.js';
import { Commands } from './slash-commands';

export default (client: Client): void => {
  client.on('ready', async () => {
    if (!client.user || !client.application) {
      return;
    }
    const commands = [];
    for (const command of Commands) {
      commands.push(command.data.toJSON());
    }
    await client.application.commands.set(commands);

    console.log(`${client.user.username} is online`);
  });
};
