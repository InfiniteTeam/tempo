import { BaseCommand } from '@structures/Command'
import Embed from '@utils/Embed'
import { formatSeconds } from '@utils/Utils'
import { ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js'

export default new BaseCommand(
  {
    name: 'leaderboard',
    aliases: ['랭킹', '랭크', '리더보드']
  },
  async (client, message, args) => {
    const embed = new Embed(client, 'info').setTitle('잠시만 기다려주세요...')
    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('leaderboard')
        .setPlaceholder('')
    )
    const msg = await message.reply({
      embeds: [embed]
    })

    const data = await client.db.voiceCount.groupBy({
      by: ['userId'],
      where: {
        guildId: message.guildId
      },
      _sum: {
        value: true
      }
    })

    const sortedData = data
      .map((entry) => ({
        userId: entry.userId,
        totalValue: entry._sum.value
      }))
      .sort((a, b) => (b.totalValue || 0) - (a.totalValue || 0))

    let n = 1

    sortedData.map((d) => {
      if (n > 10) return

      embed.addFields({
        name:
          `${n}. ` +
          (message.guild.members.cache.get(d.userId)?.displayName ||
            '알수없음'),
        value: formatSeconds(d.totalValue ?? 0)
      })
      n++
    })

    embed.setTitle('통화방 랭킹').setType('success')

    msg.edit({
      embeds: [embed]
    })
  }
)
