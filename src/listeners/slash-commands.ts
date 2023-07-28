import { Client, CommandInteraction, Interaction } from 'discord.js';
import { Command } from '../Command';
import { ThreadSolve } from '../commands/thread-solve';
export const Commands: Command[] = [ThreadSolve];

export default (client: Client): void => {
  client.on('interactionCreate', async (interaction: Interaction) => {
    if (interaction.isCommand() || interaction.isContextMenuCommand()) {
      await handleSlashCommand(client, interaction);
    }
  });
};

const handleSlashCommand = async (
  client: Client,
  interaction: CommandInteraction,
): Promise<void> => {
  const slashCommand = Commands.find((command) => command.data.name === interaction.commandName);
  if (!slashCommand) {
    interaction.followUp({ content: 'An error has occurred' });
    return;
  }

  await interaction.deferReply();

  slashCommand.run(client, interaction);
};
