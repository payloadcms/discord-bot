import { ForumChannel, Guild } from 'discord.js';

export function getCommunityHelpChannel(guild: Guild): ForumChannel {
  return guild.channels.cache.get(process.env.COMMUNITY_HELP_CHANNEL_ID as string) as ForumChannel;
}
