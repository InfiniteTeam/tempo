import { SelectMenu } from '@structures/Interaction'
import {
  ActionRowBuilder,
  AnySelectMenuInteraction,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} from 'discord.js'

export default new SelectMenu(['gc.select'], async (client, interaction) => {
  if (interaction.memberPermissions.has('ManageGuild'))
    return interaction.followUp(
      '오직 **서버 관리하기** 권한만 가진사람만 이용할수있어요!'
    )

  const data = await client.db.guildSettings.findFirst({
    where: {
      id: interaction.guildId
    },
    select: {
      activityCount: true,
      allUserRegister: true,
      messageCount: true,
      voiceCount: true
    }
  })

  if (!data)
    return client.db.guild
      .create({
        data: {
          id: interaction.guildId,
          settings: {
            create: {}
          }
        }
      })
      .then(() =>
        interaction.followUp({ ephemeral: true, content: '다시 시도해주세요.' })
      )

  if (interaction.values.includes('gc.autoRegister'))
    data.allUserRegister = !data.allUserRegister

  if (interaction.values.includes('gc.voiceCount'))
    data.voiceCount = !data.voiceCount

  if (interaction.values.includes('gc.messageCount'))
    data.messageCount = !data.messageCount

  if (interaction.values.includes('gc.activityCount'))
    data.activityCount = !data.activityCount

  await client.db.guildSettings
    .update({
      data,
      where: {
        id: interaction.guildId
      }
    })
    .then((updatedData) => {
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
              .setEmoji(
                updatedData.allUserRegister ? ':white_check_mark:' : ':x:'
              ),
            new StringSelectMenuOptionBuilder()
              .setLabel('음성 채널 집계')
              .setDescription(
                '음성채널 접속하는 데이터를 이용하여 통계를 집계합니다.'
              )
              .setValue('gc.voiceCount')
              .setEmoji(updatedData.voiceCount ? ':white_check_mark:' : ':x:'),
            new StringSelectMenuOptionBuilder()
              .setLabel('음성 채널 집계')
              .setDescription(
                '메세지 전송한 데이터를 이용하여 통계를 집계합니다.'
              )
              .setValue('gc.messageCount')
              .setEmoji(updatedData.messageCount ? ':white_check_mark:' : ':x:')
          )
      )

      interaction.update({
        components: [row]
      })
    })
})
