import { Event } from '@structures/Event'
import { Logger } from '@tempo/utils'

const logger = new Logger('bot')
export default new Event('error', async (client, error) => {
  client.error.report(error, {
    isSend: false
  })
  logger.error(error)
})
