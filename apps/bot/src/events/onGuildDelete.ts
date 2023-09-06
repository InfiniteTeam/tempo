import { Event } from '@structures/Event'
import Embed from '@utils/Embed'

export const deleteDay = 14

export default new Event('guildDelete', async (client, guild) => {
  await client.db.guild.update({
    data: {
      archived: true
    },
    where: {
      id: guild.id
    }
  })

  const serverOwner = await client.users.fetch(guild.ownerId)
  const deletedValue = [
    '- 서비스에 등록한 모든 사용자 데이터',
    '- 메세지 활동 횟수'
  ]
  const editedValue = ['- 사용자 활동 데이터.']

  const embed = new Embed(client, 'success')
    .setDescription(
      `## 이용해주셔서 감사합니다!
      Tempo 서비스는 서버에 추방당한 이후 **${deleteDay}일**뒤 아래와 같은 내용들이 수정되거나 삭제됩니다. 이용해주셔서 대단히 감사드립니다 :)
      ** **
      ** 다른서버에 등록된 사용자는 일정 데이터만 보존됩니다.`
    )
    .addFields(
      {
        name: '⛔ 완벽하게 삭제됩니다.',
        value: deletedValue.join('\n')
      },
      {
        name: '⚠️ 일정부분만 삭제됩니다**.',
        value: editedValue.join('\n')
      }
    )

  serverOwner.send({
    content: '안녕하세요. Tempo 에요!',
    embeds: [embed]
  })
})
