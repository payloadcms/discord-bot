import dotenv from 'dotenv';
dotenv.config();

import { Client, GatewayIntentBits } from 'discord.js';
import ready from './listeners/ready';
import communityHelpCreated from './listeners/community-help-created';
import communityHelpSentFirstMessage from './listeners/community-help-sent-first-message';
import slashCommands from './listeners/slash-commands';

const token = process.env.BOT_TOKEN;

console.log(`Bot is starting... Invite link: ${process.env.BOT_INVITE_LINK}`);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    'GuildMessages',
    'GuildMessageTyping',
    'GuildMessageReactions',
    'GuildMembers',
    'MessageContent',
  ],
});

ready(client);
communityHelpCreated(client);
communityHelpSentFirstMessage(client);
slashCommands(client);

client.login(token);
