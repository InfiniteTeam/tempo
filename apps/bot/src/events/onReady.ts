import { Event } from '@structures/Event'
import { Logger } from '@tempo/utils'
import { setTimeout } from 'timers/promises'
const logger = new Logger('Bot')

export default new Event(
  'ready',
  async (client) => {
    logger.info(`Logged ${client.user?.username}`)

    await setTimeout(5000)
    logger.info('Fetching users')

    const dbMembers = await client.db.user.findMany()
    const member = await client.guilds.cache
      .get('831737463571349536')
      ?.members.fetch()

    if (!member) return

    member.map((user) => {
      if (dbMembers.find((d) => d.id === user.id)) return
      client.db.user
        .create({
          data: {
            id: user.id
          }
        })
        .then((da) => logger.debug(`Added data userid: ${da.id}`))
    })
  },
  { once: true }
)
