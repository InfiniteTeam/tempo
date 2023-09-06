import { Event } from '@structures/Event'
import Embed from '@utils/Embed'
import { deleteDay } from './onGuildDelete.js'
import {
  ActionRowBuilder,
  ButtonBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  chatInputApplicationCommandMention
} from 'discord.js'

export default new Event('guildCreate', async (client, guild) => {
  const owner = await client.users.fetch(guild.ownerId)
  const embed = new Embed(client, 'success')
    .setDescription(`## 초대해주셔서 감사합니다!
Tempo 서비스 원활한 이용을 위해 아래와 같은 내용을 자동으로 등록합니다.

아래 Select Menu 를 선택하여 설정을 바굴수있어요!

저장된 내용은 개인정보 처리 방침에 따라 서비스 탈퇴시 **${deleteDay}일**뒤 삭제됩니다.

### 필수로 저장된 데이터
- 서버 id

### 선택적으로 저장되는 데이터
- 서버멤버 데이터

지금 바로 음성채널에 접속하셔서 ${chatInputApplicationCommandMention(
    '통계',
    client.application?.commands.cache.get('통계')?.id ?? ''
  )} 
    `)
  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('gc.select')
      .setPlaceholder('설정')
      .setOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('서비스 자동 등록')
          .setDescription(
            '서버에 접속한 모든 유저들을 Tempo 서비스에 등록합니다'
          )
          .setValue('gc.autoRegister')
          .setEmoji(':x:'),
        new StringSelectMenuOptionBuilder()
          .setLabel('음성 채널 집계')
          .setDescription(
            '음성채널 접속하는 데이터를 이용하여 통계를 집계합니다.'
          )
          .setValue('gc.voiceCount')
          .setEmoji(':white_check_mark:'),
        new StringSelectMenuOptionBuilder()
          .setLabel('메세지 데이터 집계')
          .setDescription('메세지 전송한 데이터를 이용하여 통계를 집계합니다.')
          .setValue('gc.messageCount')
          .setEmoji(':x:')
        // new StringSelectMenuOptionBuilder()
        //   .setLabel('상태, 활동 집계')
        //   .setDescription('활동 데이터를 이용하여 통계를 집계합니다.')
        //   .setValue('gc.activityCount')
        //   .setEmoji(':x:')
      )
  )
  await client.db.guild.create({
    data: {
      id: guild.id,
      settings: {
        create: {}
      }
    }
  })

  owner.send({
    embeds: [embed],
    components: [row]
  })
})
