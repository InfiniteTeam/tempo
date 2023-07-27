import BotClient from '@structures/BotClient.js'
import BaseManager from './BaseManager.js'
import { Prisma, VoiceCount } from '@tempo/database'
import {
  ActionRowBuilder,
  BaseInteraction,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  GuildMember,
  Message,
  OverwriteType,
  VoiceChannel
} from 'discord.js'
import Embed from '@utils/Embed.js'

export default class VoiceManager extends BaseManager {
  static getRedisKey(type: 'owner', channelId: string): string
  static getRedisKey(type: 'activity', userId: string): string
  static getRedisKey(type: 'rename', key: string): string
  static getRedisKey(type: string, key: string) {
    return `tempo-voice-${type}:${key}`
  }

  static getRedisExpire(type: 'owner'): number
  static getRedisExpire(type: 'activity'): number
  static getRedisExpire(type: 'rename'): number
  static getRedisExpire(type: 'owner' | 'activity' | 'rename') {
    if (type === 'activity') return 60 * 60 * 24
    if (type === 'owner') return 60 * 60 * 24 * 14
    if (type === 'rename') return 60 * 5
  }

  constructor(client: BotClient) {
    super(client)
  }

  setMemberData(type: 'join', userId: string): Promise<'OK'>
  setMemberData(
    type: 'leave',
    userId: string,
    channelName: string
  ): Promise<
    | {
        count: number
      }
    | VoiceCount
  >
  async setMemberData(
    type: 'join' | 'leave',
    userId: string,
    channelName?: string
  ) {
    if (type === 'join')
      return await this.client.db.redis.set(
        VoiceManager.getRedisKey('activity', userId),
        Date.now(),
        'EX',
        VoiceManager.getRedisExpire('activity')
      )

    if (type === 'leave') {
      const date = await this.client.db.redis.getdel(
        VoiceManager.getRedisKey('activity', userId)
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
              value: duration - todayDuration,
              channelName
            },
            {
              time: todayDate,
              userId,
              value: todayDuration,
              channelName
            }
          ]
        })
      }

      return await this.client.db.voiceCount.create({
        data: { time, userId, value: duration, channelName }
      })
    }

    return this
  }

  getVoiceLogDetail = async (userId: string, date: string) => {
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
        userId
      }
    })
    return detailList
  }

  async getCurrentVoiceLog(userId: string) {
    const date = await this.client.db.redis.get(
      VoiceManager.getRedisKey('activity', userId)
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
        userId
      }
    })

    const allSum = await this.client.db.voiceCount.groupBy({
      by: ['userId'],
      _sum: {
        value: true
      },
      where: {
        userId
      }
    })

    if (todaySum[0]) today = todaySum[0]._sum.value
    if (allSum[0]) all = allSum[0]._sum.value

    return { current, today, all }
  }

  async getAllVoiceLogByDate(
    userId: string,
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
      AND "time" >= ${monthFirst}
      AND "time" <= ${monthSecond}
    GROUP BY CAST(time as date)
    ORDER BY time`
    )) as { sum: number; time: Date }[]

    return result
  }

  manageChannel(type: 'create', member: GuildMember): Promise<Message<true>>
  manageChannel(type: 'delete', channelId: string): Promise<any>
  async manageChannel(type: 'create' | 'delete', data: GuildMember | string) {
    if (type === 'create' && data instanceof GuildMember) {
      const guild = data.guild
      const parentId = '1133755597603471410'

      const name = `${data.displayName}님의 채널`

      const channel = await guild.channels.create({
        name,
        parent: parentId,
        type: ChannelType.GuildVoice
      })

      await data.voice.setChannel(channel)

      const embed = new Embed(this.client, 'info')
        .setTitle(name)
        .setDescription(
          '음성채팅방에 오신것을 환영해요 :wave:\n아래의 버튼을 눌러 원하는 설정을 하실 수 있어요.'
        )
        .setAuthor({
          name: `채널 생성자: ${data.displayName}`,
          iconURL: data.displayAvatarURL()
        })

      const { row } = customChannelComponents()

      await this.client.db.redis.set(
        VoiceManager.getRedisKey('owner', channel.id),
        data.id,
        'EX',
        VoiceManager.getRedisExpire('owner')
      )

      return await channel.send({
        content: data.toString(),
        embeds: [embed],
        components: [row]
      })
    }

    if (type === 'delete') {
      const channel = await this.client.db.redis.getdel(
        VoiceManager.getRedisKey('owner', data as string)
      )

      if (channel) {
        const guild = this.client.guilds.cache.get('831737463571349536')
        await guild?.channels.delete(data as string)
      }
    }
  }

  async getVoiceChannelState(channel: VoiceChannel) {
    const userRole = '1009075124793786398'
    const owner =
      (await this.client.db.redis.get(
        VoiceManager.getRedisKey('owner', channel.id)
      )) ?? ''
    const members = await Promise.all(
      channel.permissionOverwrites.cache
        .filter(({ type }) => type === OverwriteType.Member)
        .map(async ({ id }) => {
          const member = channel.guild.members.fetch(id)
          return member
        })
    )
    if (!userRole) return { isPrivate: false, members, owner }
    if (
      channel.permissionOverwrites.cache
        .get(userRole)
        ?.allow.has('ViewChannel') ||
      channel.permissionsLocked
    )
      return { isPrivate: false, members, owner }
    return { isPrivate: true, members, owner }
  }

  voiceChannelVisible = async (channel: VoiceChannel, toggle: boolean) => {
    const userRole = '1009075124793786398'
    if (!userRole) return

    // Turn On
    if (toggle) {
      try {
        await channel.permissionOverwrites.cache.get(userRole)?.edit({
          ViewChannel: false,
          Connect: false,
          Speak: false
        })
      } catch (e) {
        console.error(e)
      }

      return
    }

    // Turn Off
    await channel.permissionOverwrites.cache.get(userRole)?.edit({
      ViewChannel: true,
      Connect: true,
      Speak: true
    })
    await channel.setName(channel.name.replace(/^\[비공개\] /, ''))
  }

  async setChannel(
    type: 'deny' | 'allow',
    channel: VoiceChannel,
    memberIds: string[]
  ) {
    if (type === 'allow') {
      for (const id of memberIds) {
        await channel.permissionOverwrites.create(id, {
          ViewChannel: true,
          Connect: true,
          Speak: true
        })
      }
    }
    if (type === 'deny') {
      for (const id of memberIds) {
        await channel.permissionOverwrites.delete(id)
      }
    }
  }

  async getChannelOwner(interaction: BaseInteraction) {
    if (
      !interaction.channelId ||
      !interaction.channel ||
      interaction.channel.type !== ChannelType.GuildVoice ||
      !(
        interaction.isAnySelectMenu() ||
        interaction.isButton() ||
        interaction.isModalSubmit()
      )
    )
      return false

    if (!interaction.channel.members.get(interaction.user.id)) {
      await interaction.reply({
        embeds: [
          new Embed(this.client, 'error').setTitle(
            '채널에 먼저 접속하여 주세요.'
          )
        ],
        ephemeral: true
      })
      return false
    }

    const owner =
      (await this.client.db.redis.get(
        VoiceManager.getRedisKey('owner', interaction.channelId)
      )) ?? ''
    if (interaction.user.id !== owner) {
      const embed = new Embed(this.client, 'error')
        .setTitle('채널 관리자가 아니군요.')
        .setDescription('음성채널 설정은 채널 관리자만 할 수 있어요.')

      const components = []

      if (
        interaction.channel &&
        interaction.channel.type === ChannelType.GuildVoice
      ) {
        const ownerData = interaction.channel.members.get(owner)
        if (!ownerData) {
          embed.addFields({
            name: '안내',
            value:
              '채널 관리자가 채널에 없는것 같군요.\n아래 버튼을 눌러 채널 관리자 권한을 얻을 수 있어요.'
          })
          components.push(
            new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setStyle(ButtonStyle.Primary)
                .setLabel('권한 받기')
                .setCustomId('voice-claim')
            )
          )
        }
      }

      await interaction.reply({
        embeds: [embed],
        components,
        ephemeral: true
      })
      return false
    }
    return true
  }

  async channelClaim(channel: VoiceChannel, memberId: string, force?: boolean) {
    const currentOwner = await this.client.db.redis.get(
      VoiceManager.getRedisKey('owner', channel.id)
    )
    if (!force && currentOwner && channel.members.get(currentOwner))
      return false
    await this.client.db.redis.set(
      VoiceManager.getRedisKey('owner', channel.id),
      memberId,
      'EX',
      VoiceManager.getRedisExpire('owner')
    )
    return true
  }
}

export const customChannelComponents = () => {
  const renameButton = new ButtonBuilder()
    .setStyle(ButtonStyle.Primary)
    .setLabel('이름 변경하기')
    .setCustomId('voice-rename')

  const limitButton = new ButtonBuilder()
    .setStyle(ButtonStyle.Secondary)
    .setLabel('인원수 제한하기')
    .setCustomId('voice-limit')

  const visibleButton = new ButtonBuilder()
    .setStyle(ButtonStyle.Secondary)
    .setLabel('공개 설정')
    .setCustomId('voice-visible')

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    renameButton,
    limitButton,
    visibleButton
  )

  return { row }
}
