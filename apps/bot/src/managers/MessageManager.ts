import BotClient from '@structures/BotClient'
import BaseManager from './BaseManager.js'
import { Prisma } from '@tempo/database'
import { Logger } from '@tempo/utils'

/**
 * @private 버그가 많아 방치중인 코드
 */
export default class MessageManager extends BaseManager {
  static getRedisKey(type: 'log', targetDate?: Date): string
  static getRedisKey(type: 'count', userId: string): string
  static getRedisKey(type: 'log' | 'count', data?: Date | string) {
    if (type === 'log' && typeof data === 'object') {
      const date = data ?? new Date()
      return `tempo-prod-message-log:${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`
    }

    if (type === 'count' && typeof data === 'string') {
      return `tempo-prod-message-count:${data}`
    }
  }
  static getRedisExpire(type: 'log'): number
  static getRedisExpire(type: 'count'): number
  static getRedisExpire(type: 'log' | 'count') {
    if (type === 'log') return 60 * 60 * 3
    if (type === 'count') return 60 * 60
  }

  logger = new Logger('MessageManager')

  constructor(client: BotClient) {
    super(client)
  }

  private async migrateId(userId: string, guildId: string) {
    const user = await this.client.db.user.findFirst({
      where: {
        userId,
        guildId
      }
    })

    if (!user) return
    return user.id
  }

  async incrUserMessageCount(id: string, guildId: string) {
    const userId = await this.migrateId(id, guildId)
    if (!userId) return

    await this.client.db.redis.hincrby(
      MessageManager.getRedisKey('log'),
      `${guildId}:${userId}`,
      1
    )
  }

  /**
   * - It will be called by cron (every 1 hour).
   * - Save all user's message count in last hour to postgresdb.
   */
  async saveMessageLog() {
    await this.client.db.redis.expire(
      MessageManager.getRedisKey('log'),
      MessageManager.getRedisExpire('log')
    )

    const targetDate = new Date()
    targetDate.setHours(targetDate.getHours() - 1, 0, 0, 0) // ex) 17:26 -> 14:00

    try {
      const createManyData: Prisma.MessageCountCreateManyInput[] = []
      const scanned = await this.client.db.redis.hscan(
        MessageManager.getRedisKey('log', targetDate),
        0
      )

      const [_coursor, elements] = scanned
      const users = await this.client.db.user.findMany({
        select: { userId: true, guildId: true }
      })
      const userIds = users.map(({ userId }) => userId)

      for (let i = 0; i < elements.length; i += 2) {
        const [guildId, userId] = elements[i].split(':')
        if (!userIds.includes(userId)) continue

        createManyData.push({
          userId,
          count: parseInt(elements[i + 1]),
          guildId,
          time: targetDate
        })
      }

      await this.client.db.messageCount.createMany({ data: createManyData })
      await this.client.db.redis.del(
        MessageManager.getRedisKey('log', targetDate)
      )
    } catch (e) {
      this.logger.error('Failed to scan messages', e)
    }
  }

  async messageLogSummary(id: string, guildId: string) {
    const userId = await this.migrateId(id, guildId)
    if (!userId) return
    let today: number | null = null
    let all: number | null = null

    const todayDate = new Date()
    todayDate.setHours(0, 0, 0, 0)

    const tomorrowDate = new Date(todayDate)
    tomorrowDate.setDate(tomorrowDate.getDate() + 1)

    const todaySum = await this.client.db.messageCount.groupBy({
      by: ['userId'],
      _sum: {
        count: true
      },
      where: {
        time: {
          gte: todayDate,
          lte: tomorrowDate
        },
        userId,
        guildId
      }
    })

    const allSum = await this.client.db.messageCount.groupBy({
      by: ['userId'],
      _sum: {
        count: true
      },
      where: {
        userId,
        guildId
      }
    })

    if (todaySum[0]) today = todaySum[0]._sum.count
    if (allSum[0]) all = allSum[0]._sum.count

    return { today, all }
  }

  async allMessageLogByYear(id: string, guildId: string, year: number) {
    const userId = await this.migrateId(id, guildId)
    if (!userId) return

    const monthFirst = new Date()
    monthFirst.setFullYear(year)
    monthFirst.setMonth(0)
    monthFirst.setDate(1)
    monthFirst.setHours(0, 0, 0, 0)
    const monthSecond = new Date()
    monthSecond.setFullYear(year)
    monthSecond.setMonth(12)
    monthFirst.setDate(1)
    monthFirst.setHours(0, 0, 0, 0)

    const result = (await this.client.db.$queryRaw(Prisma.sql`
    SELECT CAST(SUM(count) as int4) AS count, CAST(time as date)
    FROM "MessageCount"
    WHERE "userId"=${userId}
      AND "guildId"=${guildId}
      AND "time" >= ${monthFirst}
      AND "time" <= ${monthSecond}
    GROUP BY CAST(time as date)
    ORDER BY time`)) as { count: number; time: Date }[]

    return result
  }
}
