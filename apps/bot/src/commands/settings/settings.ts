import { SlashCommand } from '@structures/Command'
import { Prisma } from '@tempo/database'
import Embed from '@utils/Embed'
import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js'

export default new SlashCommand(
  new SlashCommandBuilder()
    .setName('설정')
    .setDescription('Tempo 서비스 설정을 바꿀수있어요.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((options) =>
      options
        .addChoices(
          {
            name: '서비스 자동 등록',
            value: 'autoRegister'
          },
          {
            name: '음성 채널 통계 집계',
            value: 'voiceCoint'
          },
          {
            name: '메세지 데이터 집계',
            value: 'messageCount'
          }
          // {
          //   name: '상태, 활동 집계',
          //   value: 'activityCount'
          // }
        )
        .setName('설정')
        .setDescription('바꿀 기능을 선택해주세요.')
        .setRequired(true)
    )
    .addBooleanOption((options) =>
      options
        .setRequired(true)
        .setName('값')
        .setDescription('값을 선택해주세요 True(허용) False(거부)')
    )
    .toJSON(),
  async (client, interaction) => {
    const boolean = interaction.options.getBoolean('값', true)
    const setting = interaction.options.getString('설정', true)

    client.db.guildSettings
      .update({
        where: {
          id: interaction.guildId ?? '0'
        },
        data: {
          activityCount: setting === 'activityCount' ? boolean : undefined,
          messageCount: setting === 'messageCount' ? boolean : undefined,
          voiceCount: setting === 'voiceCount' ? boolean : undefined,
          allUserRegister: setting === 'autoRegister' ? boolean : undefined
        }
      })
      .then((data) => {
        if (setting === 'autoRegister') {
          interaction.guild?.members.fetch().then(async (members) => {
            const userData = members.map(
              (member): Prisma.UserCreateManyInput => {
                return {
                  userId: member.id,
                  guildId: member.guild.id
                }
              }
            )

            client.db.user.createMany({
              data: userData
            })
          })
        }
        return interaction.reply({
          embeds: [
            new Embed(client, 'success')
              .setDescription(
                `### ✅ 변경완료!
성공적으로 변경사항을 저장했어요!`
              )
              .addFields(
                {
                  name: '서비스 자동등록',
                  value: data.allUserRegister ? '✅ 활성화' : ':x: 비활성화',
                  inline: true
                },
                {
                  name: '음성 채널 집계하기',
                  value: data.voiceCount ? '✅ 활성화' : ':x: 비활성화',
                  inline: true
                },
                {
                  name: '메세지 집계하기',
                  value: data.messageCount ? '✅ 활성화' : ':x: 비활성화',
                  inline: true
                },
                {
                  name: '상태, 활동 집계하기',
                  value: data.activityCount ? '✅ 활성화' : ':x: 비활성화',
                  inline: true
                }
              )
          ],
          ephemeral: true
        })
      })
  }
)
