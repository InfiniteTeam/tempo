import { ChannelType } from 'discord.js'

import { visibleSettingMessageContent } from './voiceVisible.js'
import { Button } from '@structures/Interaction'
import Embed from '@utils/Embed.js'
import VoiceManager from '@managers/VoiceManager.js'

export default new Button(
  ['voice-visible-setting'],
  async (client, interaction) => {
    const voiceManager = new VoiceManager(client)
    if (
      !interaction.channel ||
      interaction.channel.type !== ChannelType.GuildVoice
    )
      return
    if (!(await voiceManager.getChannelOwner(interaction))) return

    await interaction.deferUpdate()

    const { isPrivate, members, owner } =
      await voiceManager.getVoiceChannelState(interaction.channel)

    const memberList = members.filter(({ id }) => id !== owner)

    await voiceManager.voiceChannelVisible(interaction.channel, !isPrivate)

    const { embed, components } = visibleSettingMessageContent({
      client,
      isPrivate: !isPrivate,
      members: memberList
    })

    try {
      await interaction.editReply({ embeds: [embed], components: components })
    } catch (e) {
      /* empty */
    }

    if (!isPrivate) {
      await voiceManager.setChannel('allow', interaction.channel, [
        interaction.user.id
      ])
    }

    await interaction.channel?.send({
      embeds: [
        new Embed(client, 'success').setTitle(
          `채널을 \`${isPrivate ? '공개' : '비공개'}\`로 설정하였어요.`
        )
      ]
    })
  }
)
