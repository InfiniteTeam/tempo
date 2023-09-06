import { Event } from '@structures/Event'
import { Logger } from '@tempo/utils'
const logger = new Logger('Bot')

export default new Event(
  'ready',
  async (client) => {
    logger.info(`Logged ${client.user?.username}`)

    client.application?.commands.fetch()
  },
  { once: true }
)
