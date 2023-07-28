import {
  Client,
  CommandInteraction,
  ContextMenuCommandBuilder,
  MessageContextMenuCommandInteraction,
  SlashCommandBuilder,
} from 'discord.js';

export interface Command {
  data: SlashCommandBuilder;
  run: (client: Client, interaction: CommandInteraction) => void;
}

export interface ContextMenuCommand {
  data: ContextMenuCommandBuilder;
  run: (client: Client, interaction: MessageContextMenuCommandInteraction) => void;
}
