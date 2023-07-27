import { Event } from '@structures/Event'

export default new Event('guildMemberAdd', async (client, member) => {
  client.db.user.create({
    data: {
      id: member.id
    }
  })
})
