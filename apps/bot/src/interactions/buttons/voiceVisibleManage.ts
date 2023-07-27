import VoiceManager from '@managers/VoiceManager'
import { Button } from '@structures/Interaction'
import {
  ChannelType,
  InteractionCollector,
  InteractionType,
  VoiceChannel
} from 'discord.js'
import { visibleSettingMessageContent } from './voiceVisible.js'
import Embed from '@utils/Embed.js'

export default new Button(
  ['voice-visible-add', 'voice-visible-remove'],
  async (client, interaction) => {
    const voiceManager = new VoiceManager(client)
    if (
      !interaction.channel ||
      interaction.channel.type !== ChannelType.GuildVoice
    )
      return
    if (!(await voiceManager.getChannelOwner(interaction))) return

    await interaction.deferUpdate()

    const channel: VoiceChannel = interaction.channel

    const onCollectorEnd = async (_: any, reason: string) => {
      if (reason === 'limit') return
      const { isPrivate, members } = await voiceManager.getVoiceChannelState(
        channel
      )
      const memberList = members.filter(({ id }) => id !== owner)
      const { embed, components } = visibleSettingMessageContent({
        client,
        isPrivate,
        members: memberList
      })

      await interaction.editReply({
        embeds: [embed],
        components
      })

      await interaction.channel?.send({
        embeds: [
          new Embed(client, 'success').setTitle(
            `채널의 비공개 접근가능 맴버 목록이 변경 되었어요.`
          )
        ]
      })
    }

    const newCollector = () =>
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      new InteractionCollector(client, {
        channel: interaction.channel,
        interactionType: InteractionType.MessageComponent,
        filter: (intr) => intr.user.id === interaction.user.id,
        max: 1,
        time: 10000
      })

    const { isPrivate, members, owner } =
      await voiceManager.getVoiceChannelState(channel)

    const memberList = members.filter(({ id }) => id !== owner)

    if (interaction.customId === 'voice-visible-remove') {
      if (members.length < 1) {
        await interaction.followUp({
          content: '변경할 맴버가 없습니다',
          ephemeral: true
        })
        return
      }
    }

    const { embed, components } = visibleSettingMessageContent({
      client,
      isPrivate,
      members: memberList,
      mode: interaction.customId === 'voice-visible-add' ? 'add' : 'remove'
    })

    await interaction.editReply({
      embeds: [embed],
      components
    })

    if (interaction.customId === 'voice-visible-add') {
      const collector = newCollector()
      collector.on('collect', async (select) => {
        await select.deferUpdate()
        if (!select.isUserSelectMenu()) return

        await voiceManager.setChannel('allow', channel, select.values)
        onCollectorEnd('', '')
      })

      collector.on('end', onCollectorEnd)
      return
    }

    const collector = newCollector()
    collector.on('collect', async (select) => {
      await select.deferUpdate()
      if (!select.isStringSelectMenu()) return

      await voiceManager.setChannel(
        'deny',
        channel,
        select.values.filter((id) => id !== interaction.user.id)
      )
      onCollectorEnd('', '')
    })

    // collector.on('end', onCollectorEnd)
    collector.on('end', onCollectorEnd)
  }
)
