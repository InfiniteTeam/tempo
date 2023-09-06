import { SlashCommand } from '@structures/Command'
import Embed from '@utils/Embed'
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  DiscordAPIError,
  SlashCommandBuilder,
  chatInputApplicationCommandMention
} from 'discord.js'
import { deleteDay } from 'events/onGuildDelete'

export default new SlashCommand(
  new SlashCommandBuilder()
    .setName('등록')
    .setDescription('Tempo 서비스에 등록합니다.')
    .toJSON(),
  async (client, interaction) => {
    const user = await client.db.user.findFirst({
      where: {
        userId: interaction.user.id,
        guildId: interaction.guildId ?? '0'
      }
    })

    if (user) {
      return interaction.reply({
        ephemeral: true,
        embeds: [
          new Embed(client, 'error').setDescription(
            '### 이미 Tempo 서비스에 등록된 유저입니다.'
          )
        ]
      })
    }

    const embed = new Embed(client, 'info')
      .setDescription(`## :wave: 환영합니다!
Tempo 서비스 원활한 이용을 위해 아래와 같은 내용을 수집합니다. 동의하시겠습니까?

저장된 내용은 개인정보 처리 방침에 따라 서비스 탈퇴시 **${deleteDay}일**뒤 삭제됩니다.

### 필수로 저장하는 데이터
- 사용자 ID
- 음성 활동 데이터 (접속, 이동, 나가는 데이터)
- 메세지 데이터 (오직 감지)

### 선택적으로 저장하는 데이터
- 활동 데이터 (추후 추가될예정)
      `)
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('register.allow')
        .setLabel('동의')
        .setEmoji('✅')
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId('register.deny')
        .setLabel('거절')
        .setEmoji('⛔')
        .setStyle(ButtonStyle.Danger)
    )

    const res = await interaction.reply({
      ephemeral: true,
      embeds: [embed],
      components: [row]
    })

    try {
      const buttonResponce = await res.awaitMessageComponent({
        filter: (i) => i.user.id === interaction.user.id,
        idle: 30_000,
        componentType: ComponentType.Button
      })

      if (buttonResponce.customId === 'register.allow') {
        await client.db.user.create({
          data: {
            userId: interaction.user.id,
            guildId: interaction.guildId ?? '0'
          }
        })

        await buttonResponce.update({
          embeds: [
            new Embed(client, 'success').setDescription(`### ✅ 등록완료!

지금 바로 음성채널에 접속하셔서 ${chatInputApplicationCommandMention(
              '통계',
              client.application?.commands.cache.get('통계')?.id ?? '1'
            )} 사용해보세요!
`)
          ],
          components: []
        })
      }

      if (buttonResponce.customId === 'register.deny') {
        await buttonResponce.update({
          embeds: [
            new Embed(client, 'error').setDescription(
              `### :x: 다음에 다시올꺼라 믿어요...`
            )
          ],
          components: []
        })
      }
    } catch (e) {
      console.log(e)
      if (e instanceof DiscordAPIError)
        return await interaction.editReply({
          embeds: [],
          components: [],
          content: '### 시간초과! 다시 시도해주세요'
        })
    }
  }
)
