import { Logger } from '@tempo/utils'
import BaseManager from './BaseManager.js'
import BotClient from '@structures/BotClient'
import { DatabaseClient } from '@tempo/database'
import { join } from 'path'

/**
 * @extends {BaseManager}
 */
export default class DatabaseManager extends BaseManager {
  private logger: Logger

  constructor(client: BotClient) {
    super(client)

    this.logger = new Logger('DatabaseManager')
  }

  async load() {
    this.logger.debug('Using Prisma...')

    this.client.db = new DatabaseClient({
      loggerPath: join(process.cwd(), 'logs', 'latest.log')
    })
  }
}
