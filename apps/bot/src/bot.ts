import 'dotenv/config'
import { Logger } from '@tempo/utils'
import config from './config.js'

import BotClient from '@structures/BotClient'
import { setupSchedule } from '@utils/Schedules.js'

const logger = new Logger('main')

logger.silly('Starting up...')

process.on('uncaughtException', (e) => {
  logger.error(e)
  // console.error(e)
})
process.on('unhandledRejection', (e: Error) => {
  logger.error(e)
  // console.error(e)
})

const client = new BotClient(config.bot.options)

setupSchedule(client)

client.start(config.bot.token)
