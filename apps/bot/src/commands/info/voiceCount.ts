import MessageManager from '@managers/MessageManager'
import VoiceManager from '@managers/VoiceManager'
import { BaseCommand } from '@structures/Command'
import Embed from '@utils/Embed'
import { formatSeconds } from '@utils/Utils'
import { SlashCommandBuilder } from 'discord.js'

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
  },
  {
    data: new SlashCommandBuilder()
      .setName('통계')
      .setDescription('통계를 제공합니다.')
      .addStringOption((options) =>
        options
          .setName('종류')
          .setDescription('종류를 선택해주세요 (활동 개발중)')
          .setChoices(
            {
              name: '음성',
              value: 'voice'
            },
            {
              name: '메세지',
              value: 'message'
            },
            {
              name: '활동',
              value: 'activity'
            }
          )
          .setRequired(true)
      )
      .addUserOption((options) =>
        options
          .setName('유저')
          .setDescription('통계를 보고싶은 유저를 선택해주세요.')
          .setRequired(false)
      )
      .toJSON(),
    async execute(client, interaction) {
      const type = interaction.options.getString('종류', true) as
        | 'voice'
        | 'message'
        | 'activity'
      const user = interaction.options.getUser('유저')
      const voiceManager = new VoiceManager(client)
      const messageManager = new MessageManager(client)

      if (type === 'activity') {
        return interaction.reply({
          content:
            '활동 데이터가 많이 없어서 제공해드릴수없습니다. 죄송합니다 ㅠㅠ',
          ephemeral: true
        })
      }

      if (type === 'voice') {
        await interaction.reply({
          embeds: [
            new Embed(client, 'warn').setTitle(
              user
                ? `${user.username} 데이터를 불러오는 중이에요!`
                : '불러오는중이에요!'
            )
          ]
        })

        const { current, today, all } = await voiceManager.getCurrentVoiceLog(
          user ? user.id : interaction.user.id
        )
        const embed = new Embed(client, 'info')
          .setTitle(
            user ? `${user.username}님의 통화방 사용시간` : '통화방 사용시간'
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

        return interaction.editReply({ embeds: [embed] })
      }

      if (type === 'message') {
        await interaction.reply({
          embeds: [
            new Embed(client, 'warn').setTitle(
              user
                ? `${user.username} 데이터를 불러오는 중이에요!`
                : '불러오는중이에요!'
            )
          ]
        })

        const { today, all } = await messageManager.messageLogSummary(
          user ? user.id : interaction.user.id
        )
        const embed = new Embed(client, 'info')
          .setTitle(user ? `${user.username}님의 메세지 통계` : '메세지 통계')
          .setDescription('30초 미만의 짧은 사용은 저장되지 않습니다.')
        if (all) {
          embed.addFields({
            name: `전체 통계: \`${all}\`개`,
            value: '메세지 통계 측정 이후 측정된 메세지 갯수에요!'
          })
        }

        if (today) {
          embed.addFields({
            name: `오늘 통계: \`${today}\``,
            value: `오늘 하루동안 적은 메세지 수에요!`
          })
        }

        if (!all && !today)
          embed.addFields({
            name: '안내',
            value: '아칙 데이터가 없네요! 잠시후 시도해보세요'
          })

        return interaction.editReply({ embeds: [embed] })
      }
    }
  }
)
