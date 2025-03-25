import type {
  ChatInputCommandInteraction,
  Client,
  ContextMenuCommandBuilder,
  MessageContextMenuCommandInteraction,
  SlashCommandBuilder,
} from 'discord.js'

export interface Command {
  data: SlashCommandBuilder
  run: (client: Client, interaction: ChatInputCommandInteraction) => Promise<void> | void
}

export interface ContextMenuCommand {
  data: ContextMenuCommandBuilder
  run: (client: Client, interaction: MessageContextMenuCommandInteraction) => Promise<void> | void
}
