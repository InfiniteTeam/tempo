import {
  Client,
  ClientOptions,
  ClientEvents,
  Collection,
  ActivityType
} from 'discord.js'
import { config as dotenvConfig } from 'dotenv'
import * as Dokdo from 'dokdo'

import { Logger } from '@tempo/utils'

import { BaseCommand } from '@types'
import { BaseInteraction } from './Interaction.js'
import { Event } from './Event.js'

import config from '../config.js'

import CommandManager from '@managers/CommandManager'
import EventManager from '@managers/EventManager'
import ErrorManager from '@managers/ErrorManager'
import DatabaseManager from '@managers/DatabaseManager'
import InteractionManager from '@managers/InteractionManager'
import { DatabaseClient } from '@tempo/database'
import MessageManager from '@managers/MessageManager.js'
import VoiceManager from '@managers/VoiceManager.js'

const logger = new Logger('Bot')

export default class BotClient extends Client {
  public readonly VERSION: string
  public readonly BUILD_NUMBER: string
  public readonly config = config

  public commands: Collection<string, BaseCommand> = new Collection()
  public events: Collection<keyof ClientEvents, Event<keyof ClientEvents>> =
    new Collection()
  public errors: Collection<string, string> = new Collection()
  public interactions: Collection<string | string[], BaseInteraction> =
    new Collection()
  public db!: DatabaseClient

  public command: CommandManager = new CommandManager(this)
  public event: EventManager = new EventManager(this)
  public error: ErrorManager = new ErrorManager(this)
  public database: DatabaseManager = new DatabaseManager(this)
  public interaction: InteractionManager = new InteractionManager(this)
  public message: MessageManager = new MessageManager(this)
  public voicem: VoiceManager = new VoiceManager(this)

  public eval = new Dokdo.Client(this, {
    prefix: this.config.bot.prefix,
    noPerm: async (message) =>
      message.reply('You do not have permission to use this command.'),
    aliases: ['eval', 'dok']
  })

  public constructor(options: ClientOptions) {
    super(options)

    logger.info('Loading config data...')
    dotenvConfig()

    logger.info('Loading managers...')
    this.event.load()
    this.command.load()
    this.interaction.load()
    this.database.load()

    logger.info('Loading version data...')
    this.VERSION = config.BUILD_VERSION
    this.BUILD_NUMBER = config.BUILD_NUMBER
  }

  public async start(token: string = config.bot.token): Promise<void> {
    logger.info('Logging in bot...')
    await this.login(token).then(() => {
      this.setStatus()
    })
  }

  public setStatus(status: 'dev' | 'online' = 'online', name = '점검중...') {
    if (status.includes('dev')) {
      logger.warn('Changed status to Developent mode')
      this.user?.setPresence({
        activities: [
          {
            name: `${this.config.bot.prefix}help | ${this.VERSION} : ${name}`,
            type: ActivityType.Custom,
            state: '⛔ 점검중...'
          }
        ],
        status: 'dnd'
      })
    } else if (status.includes('online')) {
      logger.info('Changed status to Online mode')

      this.user?.setPresence({
        activities: [
          {
            name: `${this.config.bot.prefix}help | ${this.VERSION}`,
            type: ActivityType.Custom,
            state: `🚀 Launched!`
          }
        ],
        status: 'online'
      })
    }
  }
}
