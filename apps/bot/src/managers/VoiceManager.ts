import BotClient from '@structures/BotClient.js'
import BaseManager from './BaseManager.js'
import { Prisma, VoiceCount } from '@tempo/database'

export default class VoiceManager extends BaseManager {
  static getRedisKey(type: 'activity', userId: string, guildId: string): string
  static getRedisKey(type: 'rename', key: string): string
  static getRedisKey(type: string, key: string, guildId?: string) {
    return `tempo-prod-voice-${type}${guildId ? `-${guildId}` : ''}:${key}`
  }

  static getRedisExpire(type: 'activity'): number
  static getRedisExpire(type: 'rename'): number
  static getRedisExpire(type: 'owner' | 'activity' | 'rename') {
    if (type === 'activity') return 60 * 60 * 24
    if (type === 'rename') return 60 * 5
  }

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

  setMemberData(type: 'join', userId: string, guildId: string): Promise<'OK'>
  setMemberData(
    type: 'leave',
    userId: string,
    guildId: string,
    channelName: string
  ): Promise<
    | {
        count: number
      }
    | VoiceCount
  >
  async setMemberData(
    type: 'join' | 'leave',
    id: string,
    guildId: string,
    channelName?: string
  ) {
    const userId = await this.migrateId(id, guildId)
    if (!userId) return

    if (type === 'join')
      return await this.client.db.redis.set(
        VoiceManager.getRedisKey('activity', userId, guildId),
        Date.now(),
        'EX',
        VoiceManager.getRedisExpire('activity')
      )

    if (type === 'leave') {
      const date = await this.client.db.redis.getdel(
        VoiceManager.getRedisKey('activity', userId, guildId)
      )
      if (!date) return
      const dateInt = parseInt(date)
      const duration = Math.floor((Date.now() - dateInt) / 1000)

      if (duration < 30) return

      const time = new Date(dateInt)

      // If save log when day pass, seperate log into two log
      // ex) 2022-12-24 23:50 ~ 2022-12-25 01:10:00
      // => 2022-12-24 23:50 ~ 2022-12-24 23:59:59
      // => 2022-12-25 00:00:00 ~ 2022-12-25 01:10:00
      if (time.getDate() !== new Date().getDate()) {
        const todayDate = new Date()
        todayDate.setHours(0, 0, 0, 0)
        const todayDuration = Math.floor((todayDate.getTime() - dateInt) / 1000)

        return await this.client.db.voiceCount.createMany({
          data: [
            {
              time,
              userId,
              guildId,
              value: duration - todayDuration,
              channelName
            },
            {
              time: todayDate,
              userId,
              guildId,
              value: todayDuration,
              channelName
            }
          ]
        })
      }

      return await this.client.db.voiceCount.create({
        data: { time, userId, guildId, value: duration, channelName }
      })
    }

    return this
  }

  getVoiceLogDetail = async (id: string, date: string, guildId: string) => {
    const userId = await this.migrateId(id, guildId)
    if (!userId) return

    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 9999)

    const detailList = await this.client.db.voiceCount.findMany({
      where: {
        time: {
          gte: dayStart,
          lte: dayEnd
        },
        userId,
        guildId
      }
    })
    return detailList
  }

  async getCurrentVoiceLog(id: string, guildId: string) {
    const userId = await this.migrateId(id, guildId)
    if (!userId) return

    const date = await this.client.db.redis.get(
      VoiceManager.getRedisKey('activity', userId, guildId)
    )
    let current: number | null = null
    let today: number | null = null
    let all: number | null = null

    if (date) {
      const dateInt = parseInt(date)
      current = Math.floor((Date.now() - dateInt) / 1000)
    }

    const todayDate = new Date()
    todayDate.setHours(0, 0, 0, 0)

    const tomorrowDate = new Date(todayDate)
    tomorrowDate.setDate(tomorrowDate.getDate() + 1)

    const todaySum = await this.client.db.voiceCount.groupBy({
      by: ['userId'],
      _sum: {
        value: true
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

    const allSum = await this.client.db.voiceCount.groupBy({
      by: ['userId'],
      _sum: {
        value: true
      },
      where: {
        userId,
        guildId
      }
    })

    if (todaySum[0]) today = todaySum[0]._sum.value
    if (allSum[0]) all = allSum[0]._sum.value

    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const oneWeekSum = await this.client.db.voiceCount.groupBy({
      by: ['userId', 'time'],
      _sum: {
        value: true
      },
      where: {
        time: {
          gte: oneWeekAgo,
          lte: tomorrowDate
        },
        userId,
        guildId
      }
    })

    let bestTime = 0
    let bestTimeDate = null

    if (oneWeekSum[0]) {
      bestTime = oneWeekSum[0]._sum.value!
      bestTimeDate = oneWeekSum[0].time // 시간이 기록된 날짜
    }

    return {
      current,
      today,
      all,
      best: {
        time: bestTime,
        date: bestTimeDate
      }
    }
  }

  async getAllVoiceLogByDate(
    id: string,
    guildId: string,
    {
      startYear,
      startMonth,
      endYear,
      endMonth
    }: {
      startYear: number
      startMonth: number
      endYear: number
      endMonth: number
    }
  ) {
    const userId = await this.migrateId(id, guildId)
    if (!userId) return

    const monthFirst = new Date()
    monthFirst.setFullYear(startYear)
    monthFirst.setMonth(startMonth - 1)
    monthFirst.setDate(1)
    monthFirst.setHours(0, 0, 0, 0)
    const monthSecond = new Date()
    monthSecond.setFullYear(endYear)
    monthSecond.setMonth(endMonth)
    monthFirst.setDate(1)
    monthFirst.setHours(0, 0, 0, 0)

    const result = (await this.client.db.$queryRaw(
      Prisma.sql`
    SELECT CAST(SUM(value) as int4), CAST(time as date)
    FROM "VoiceCount"
    WHERE "userId"=${userId}
      AND "guildId"=${guildId}
      AND "time" >= ${monthFirst}
      AND "time" <= ${monthSecond}
    GROUP BY CAST(time as date)
    ORDER BY time`
    )) as { sum: number; time: Date }[]

    return result
  }
}
