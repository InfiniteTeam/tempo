import { Event } from '@structures/Event'
import * as Sentry from '@sentry/node'

export default new Event('error', async (client, error) => {
  Sentry.captureException(error)
  client.error.report(error, {
    isSend: false
  })
})
