import { Event } from '@structures/Event'
import VoiceManager from '@managers/VoiceManager'
import config from 'config'

export default new Event('voiceStateUpdate', async (client, before, after) => {
  if (
    before.guild.id === '831737463571349536' ||
    after.guild.id === '831737463571349536'
  )
    return

  const voiceManager = new VoiceManager(client)

  // Member Join
  if (
    before.channelId === null &&
    after.channelId &&
    after.member &&
    after.channel
  ) {
    voiceManager.setMemberData('join', after.member.id, after.guild.id)

    return
  }

  // Member Leave
  if (before.member && before.channelId && after.channelId === null) {
    voiceManager.setMemberData(
      'leave',
      before.member.id,
      before.guild.id,
      before.channel?.name ?? ''
    )
  }
})
