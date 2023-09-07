import { Event } from '@structures/Event'
import CommandManager from '@managers/CommandManager'
import ErrorManager from '@managers/ErrorManager'
import type { MessageCommand } from '@structures/Command'
import MessageManager from '@managers/MessageManager'

export default new Event('messageCreate', async (client, message) => {
  await client.eval.run(message)
  if (message.guildId === '831737463571349536') return

  const commandManager = new CommandManager(client)
  const errorManager = new ErrorManager(client)
  const messageManager = new MessageManager(client)

  if (message.author.bot) return

  await messageManager.incrUserMessageCount(
    message.author.id,
    message.guildId ?? '0'
  )

  if (!message.inGuild()) return

  if (!message.content.startsWith(client.config.bot.prefix)) return

  const args = message.content
    .slice(client.config.bot.prefix.length)
    .trim()
    .split(/ +/g)
  const commandName = args.shift()?.toLowerCase()
  const command = commandManager.get(commandName as string) as MessageCommand

  try {
    await command?.execute(client, message, args)
  } catch (error: any) {
    errorManager.report(error, { executer: message, isSend: true })
  }
})
