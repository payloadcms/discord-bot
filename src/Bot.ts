import { Client, GatewayIntentBits } from 'discord.js'
import http from 'http'

import { communityHelpCreated } from './listeners/community-help-created'
import { communityHelpSentFirstMessage } from './listeners/community-help-sent-first-message'
import { jobCreated } from './listeners/job-created'
import { readyListener } from './listeners/ready'
import { slashCommands } from './listeners/slash-commands'

const token = process.env.BOT_TOKEN

console.log(`Bot is starting... Invite link: ${process.env.BOT_INVITE_LINK}`)

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    'GuildMessages',
    'GuildMessageTyping',
    'GuildMessageReactions',
    'GuildMembers',
    'MessageContent',
  ],
})

readyListener(client)
communityHelpCreated(client)
jobCreated(client)
communityHelpSentFirstMessage(client)
slashCommands(client)

await client.login(token)

// Create server for DO health check
const server = http.createServer((req: any, res: any) => {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('Health Check: OK')
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('Not Found')
  }
})

// Listen on port 8080
const PORT = 8080
server.listen(PORT)
