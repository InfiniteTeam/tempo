import { Event } from '@structures/Event'

export default new Event('guildMemberAdd', async (client, member) => {
  if (member.guild.id !== '831737463571349536') return
  client.db.user.create({
    data: {
      id: member.id
    }
  })
})
