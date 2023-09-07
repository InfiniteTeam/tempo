import { BaseCommand } from '@structures/Command'
import { hyperlink } from 'discord.js'

export default new BaseCommand(
  {
    name: 'hellothisisverifaction',
    aliases: ['한디리인증']
  },
  async (client, message) => {
    message.reply(`## Debug
Maintainer: ${client.users.cache.get('949131762666205235')
      ?.username} (949131762666205235)
With: ${hyperlink('Infinite Studio', 'https://inft.kr')}
  `)
  }
)
