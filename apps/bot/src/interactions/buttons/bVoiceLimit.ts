import VoiceManager from '@managers/VoiceManager'
import { Button } from '@structures/Interaction'
import {
  ActionRowBuilder,
  ChannelType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} from 'discord.js'

export default new Button('voice-limit', async (client, interaction) => {
  console.log(true)
  const voiceManager = new VoiceManager(client)
  if (
    !interaction.channel ||
    interaction.channel.type !== ChannelType.GuildVoice
  )
    return
  if (!(await voiceManager.getChannelOwner(interaction))) return

  const modal = new ModalBuilder()
    .setCustomId('modal.voice-limit')
    .setTitle('음성채널 인원제한 설정')

  const favoriteColorInput = new TextInputBuilder()
    .setCustomId('limitInput')
    .setLabel('제한할 인원수를 입력해 주세요. (제한을 풀려면 비워두세요)')
    .setValue(interaction.channel.userLimit.toString())
    .setMaxLength(3)
    .setPlaceholder(`0`)
    .setStyle(TextInputStyle.Short)

  const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
    favoriteColorInput
  )

  modal.addComponents(firstActionRow)

  // Show the modal to the user
  await interaction.showModal(modal)
})
