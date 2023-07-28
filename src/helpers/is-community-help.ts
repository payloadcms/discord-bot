import { AnyThreadChannel, ChannelType, TextBasedChannel } from 'discord.js';

export function isCommunityHelpThread(thread: TextBasedChannel): boolean {
  if (!thread.isThread()) {
    return false;
  }
  if (thread.type !== ChannelType.PublicThread) {
    return false;
  }
  const communityHelpChannelId = process.env.COMMUNITY_HELP_CHANNEL_ID;

  if (thread.parentId !== communityHelpChannelId) {
    return false;
  }
  return true;
}
