import { Event } from '@structures/Event'
import VoiceManager from '@managers/VoiceManager'
import config from 'config'

export default new Event('voiceStateUpdate', async (client, before, after) => {
  if (
    before.guild.id !== '831737463571349536' ||
    after.guild.id !== '831737463571349536'
  )
    return
  const voiceRoomCreateChannel = config.channelId
  const voiceManager = new VoiceManager(client)

  // Member Join
  if (
    before.channelId === null &&
    after.channelId &&
    after.member &&
    after.channel
  ) {
    voiceManager.setMemberData('join', after.member.id)

    if (after.channelId === voiceRoomCreateChannel) {
      await voiceManager.manageChannel('create', after.member)
      return
    }
    return
  }

  // Member Move
  if (
    before.channelId != null &&
    before.channelId !== after.channelId &&
    after.channelId
  ) {
    if (before.channelId === voiceRoomCreateChannel) {
      return
    }

    if (!after.member) return

    if (after.channelId === voiceRoomCreateChannel) {
      await voiceManager.manageChannel('create', after.member)
      return
    }
    return
  }

  // Member Leave
  if (before.member && before.channelId && after.channelId === null) {
    voiceManager.setMemberData(
      'leave',
      before.member.id,
      before.channel?.name ?? ''
    )

    if (before.channelId === voiceRoomCreateChannel) {
      return
    }

    if ((before.channel?.members.size ?? 0) < 1) {
      return await voiceManager.manageChannel('delete', before.channelId)
    }

    return
  }
})
