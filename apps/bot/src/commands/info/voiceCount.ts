import VoiceManager from '@managers/VoiceManager'
import { BaseCommand } from '@structures/Command'
import Embed from '@utils/Embed'
import { formatSeconds } from '@utils/Utils'

export default new BaseCommand(
  {
    name: 'vouce-count',
    aliases: ['통계', '통게']
  },
  async (client, message, args) => {
    const voiceManager = new VoiceManager(client)
    const mentionUser = message.mentions.users.first()

    const msg = await message.reply({
      embeds: [
        new Embed(client, 'warn').setTitle(
          mentionUser
            ? `${mentionUser.username} 데이터를 불러오는 중이에요!`
            : '불러오는중이에요!'
        )
      ]
    })

    const { current, today, all } = await voiceManager.getCurrentVoiceLog(
      mentionUser ? mentionUser.id : message.author.id
    )
    const embed = new Embed(client, 'info')
      .setTitle(
        mentionUser
          ? `${mentionUser.username}님의 통화방 사용시간`
          : '통화방 사용시간'
      )
      .setDescription('30초 미만의 짧은 사용은 저장되지 않습니다.')
    if (all) {
      embed.addFields({
        name: `전체 사용시간: \`${formatSeconds(all)}\``,
        value: '통화방 사용시간 측정 이후 통화방에 있었던 시간이에요.'
      })
    }

    if (today) {
      embed.addFields({
        name: `오늘 사용시간: \`${formatSeconds(today)}\``,
        value: `오늘 하루동안 사용한 시간이에요.${
          current ? ' (현재 사용시간은 포함되지 않습니다)' : ''
        }`
      })
    }

    if (current) {
      embed.addFields({
        name: `현재 통화방 사용시간: \`${formatSeconds(current)}\``,
        value: '연속해서 통화방을 사용한 시간이에요.'
      })
    }

    if (!all && !today && !current)
      embed.addFields({
        name: '안내',
        value:
          '아직 통화방을 사용하지 않으셨군요.\n통화방 카테고리의 채널들에 참여해보세요!'
      })

    msg.edit({ embeds: [embed] })
  }
)
