import { scheduleJob } from 'node-schedule'

import BotClient from '@structures/BotClient'
import MessageManager from '@managers/MessageManager'

/*
*    *    *    *    *    *
┬    ┬    ┬    ┬    ┬    ┬
│    │    │    │    │    │
│    │    │    │    │    └ day of week (0 - 7) (0 or 7 is Sun)
│    │    │    │    └───── month (1 - 12)
│    │    │    └────────── day of month (1 - 31)
│    │    └─────────────── hour (0 - 23)
│    └──────────────────── minute (0 - 59)
└───────────────────────── second (0 - 59, OPTIONAL)
*/

export const setupSchedule = (client: BotClient) => {
  const messageManager = new MessageManager(client)
  // At 1 minutes past the hour
  scheduleJob('1 * * * *', async () => {
    await messageManager.saveMessageLog()
  })

  // 	Every 5 minutes
  scheduleJob('0 */5 * ? * *', async () => {})
  return true
}
