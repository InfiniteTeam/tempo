import BotClient from '@structures/BotClient'
import BaseManager from './BaseManager.js'

export default class PresenceManager extends BaseManager {
  constructor(client: BotClient) {
    super(client)
  }

  async init() {
    const members = await this.client.guilds.cache
      .get('831737463571349536')
      ?.members.fetch()
  }
}
