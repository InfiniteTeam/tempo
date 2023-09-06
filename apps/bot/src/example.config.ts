import { execSync } from 'child_process'
import { IConfig } from '@types'
import { ReportType } from './utils/Constants.js'
import { ActivityType } from 'discord.js'

const config: IConfig = {
  BUILD_NUMBER: execSync('git rev-parse --short HEAD').toString().trim(),
  BUILD_VERSION: '0.1.5',
  channelId: '',
  githubToken: '',
  name: 'Tempo',
  sentry: {
    dsn: process.env.SENTRY_DSN,

    tracesSampleRate: 1.0
  },
  bot: {
    sharding: false,
    options: {
      intents: [
        'GuildMembers',
        'GuildPresences',
        'MessageContent',
        'DirectMessages',
        'GuildVoiceStates',
        'GuildIntegrations',
        'Guilds',
        'GuildMessages'
      ],
      allowedMentions: { parse: ['users', 'roles'], repliedUser: false },
      presence: {
        status: 'dnd',
        activities: [
          {
            name: '🚀 Launching...',
            type: ActivityType.Custom,
            state: '🚀 Launching...'
          }
        ]
      }
    },
    token: process.env.BOT_TOKEN ?? '',
    owners: [],
    prefix: process.env.BOT_PREFIX ?? '!',
    cooldown: 2000
  },
  report: {
    type: ReportType.Webhook,
    webhook: {
      url: ''
    },
    text: {
      guildID: '',
      channelID: ''
    }
  }
}

export default config
