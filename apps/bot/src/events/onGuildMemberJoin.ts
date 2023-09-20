import { Event } from '@structures/Event'

export default new Event('guildMemberAdd', async (client, member) => {
  if (member.guild.id === '831737463571349536') return

  let settings = await client.db.guildSettings.findFirst({
    where: {
      id: member.guild.id
    }
  })

  if (!settings)
    settings = await client.db.guild
      .create({
        data: {
          id: member.guild.id,
          settings: {
            create: {}
          }
        },
        include: {
          settings: true
        }
      })
      .then((d) => d.settings)

  if (settings?.allUserRegister) {
    client.db.user.create({
      data: {
        userId: member.id,
        guildId: member.guild.id
      }
    })
  }
})
