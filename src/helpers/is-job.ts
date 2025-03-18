import type { TextBasedChannel } from 'discord.js'

import { ChannelType } from 'discord.js'

export function isJobThread(thread: TextBasedChannel): boolean {
  if (!thread.isThread()) {
    return false
  }
  if (thread.type !== ChannelType.PublicThread) {
    return false
  }
  const jobChannelid = process.env.JOB_CHANNEL_ID

  if (thread.parentId !== jobChannelid) {
    return false
  }
  return true
}
