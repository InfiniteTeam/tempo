import VoiceManager from '@managers/VoiceManager'
import { Button } from '@structures/Interaction'
import { formatSeconds } from '@utils/Utils'
import {
  ActionRowBuilder,
  ChannelType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} from 'discord.js'

export default new Button(['voice-rename'], async (client, interaction) => {
  console.log(true)
  const voiceManager = new VoiceManager(client)
  if (
    !interaction.channel ||
    interaction.channel.type !== ChannelType.GuildVoice
  )
    return
  if (!(await voiceManager.getChannelOwner(interaction))) return

  const timeLeft = await client.db.redis.pttl(
    VoiceManager.getRedisKey('rename', interaction.channelId)
  )
  if (timeLeft > 0) {
    await interaction.reply({
      content: `5분마다 한번씩 이름을 변경할 수 있어요. (남은시간: ${formatSeconds(
        Math.round(timeLeft / 1000)
      )}) `,
      ephemeral: true
    })
    return
  }

  const modal = new ModalBuilder()
    .setCustomId('modal.voice-rename')
    .setTitle('음성채널 이름 변경')

  const favoriteColorInput = new TextInputBuilder()
    .setCustomId('nameInput')
    .setLabel('변경할 이름을 입력해 주세요.')
    .setValue(interaction.channel.name.replace(/^\[비공개\] /, ''))
    .setPlaceholder(`${interaction.member.displayName}님의 채널`)
    .setMaxLength(32)
    .setStyle(TextInputStyle.Short)

  const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
    favoriteColorInput
  )

  modal.addComponents(firstActionRow)

  await interaction.showModal(modal)
})
