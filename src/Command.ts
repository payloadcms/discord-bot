import { Client, CommandInteraction, SlashCommandBuilder } from 'discord.js';

export interface Command {
  data: SlashCommandBuilder;
  run: (client: Client, interaction: CommandInteraction) => void;
}
