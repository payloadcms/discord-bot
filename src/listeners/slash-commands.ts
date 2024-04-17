import {
  ChatInputCommandInteraction,
  Client,
  Interaction,
  MessageContextMenuCommandInteraction,
} from 'discord.js';
import { Command, ContextMenuCommand } from '../types';
import { ThreadSolve } from '../commands/thread-solve';
import { MoveToCommunityHelp } from '../context-menu-commands/move-to-community-help';
import { ThreadUnSolve } from '../commands/thread-unsolve';
import { SearchCommunityHelp } from '../commands/search-help';
import { MoveToCommunityHelpContext } from '../context-menu-commands/move-to-community-help-context';
export const Commands: Command[] = [ThreadSolve, ThreadUnSolve, SearchCommunityHelp];
export const ContextMenuCommands: ContextMenuCommand[] = [MoveToCommunityHelp, MoveToCommunityHelpContext];

export default (client: Client): void => {
  client.on('interactionCreate', async (interaction: Interaction) => {
    console.log('interactionCreate');

    if (interaction.isChatInputCommand()) {
      await handleSlashCommand(client, interaction);
    } else if (interaction.isMessageContextMenuCommand()) {
      await handleContextMenuCommand(client, interaction);
    } else if (interaction.isButton()) {
      switch (interaction.customId) {
        case 'solved': {
          // make user run command
          await interaction.reply({
            content: 'Please run /solve to mark this thread as solved.',
            ephemeral: true,
          });
        }
      }
    }
  });
};

const handleSlashCommand = async (
  client: Client,
  interaction: ChatInputCommandInteraction,
): Promise<void> => {
  await interaction.deferReply();

  const slashCommand = Commands.find((command) => command.data.name === interaction.commandName);
  if (!slashCommand) {
    await interaction.followUp({ content: 'An error has occurred', ephemeral: true });
    return;
  }

  slashCommand.run(client, interaction);
};

const handleContextMenuCommand = async (
  client: Client,
  interaction: MessageContextMenuCommandInteraction,
): Promise<void> => {
  await interaction.deferReply();

  const contextMenuCommand = ContextMenuCommands.find(
    (command) => command.data.name === interaction.commandName,
  );

  if (!contextMenuCommand) {
    await interaction.followUp({ content: 'An error has occurred', ephemeral: true });
    return;
  }

  contextMenuCommand.run(client, interaction);
};
