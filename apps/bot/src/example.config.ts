import { execSync } from 'child_process'
import { IConfig } from '@types'
import { ReportType } from './utils/Constants.js'

const config: IConfig = {
  BUILD_NUMBER: execSync('git rev-parse --short HEAD').toString().trim(),
  BUILD_VERSION: '0.1.5',
  channelId: '',
  githubToken: '',
  name: 'Tempo',
  bot: {
    sharding: false,
    options: {
      intents: [130815],
      allowedMentions: { parse: ['users', 'roles'], repliedUser: false }
    },
    token: '',
    owners: [],
    prefix: '!',
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
