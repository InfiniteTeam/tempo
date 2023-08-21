import { Event } from '@structures/Event'
import CommandManager from '@managers/CommandManager'
import ErrorManager from '@managers/ErrorManager'
import type { MessageCommand } from '@structures/Command'
import MessageManager from '@managers/MessageManager'

export default new Event('messageCreate', async (client, message) => {
  const commandManager = new CommandManager(client)
  const errorManager = new ErrorManager(client)
  const messageManager = new MessageManager(client)

  if (message.author.bot) return

  await messageManager.incrUserMessageCount(message.author.id)

  if (!message.inGuild()) return

  if (!message.content.startsWith(client.config.bot.prefix)) return

  const args = message.content
    .slice(client.config.bot.prefix.length)
    .trim()
    .split(/ +/g)
  const commandName = args.shift()?.toLowerCase()
  const command = commandManager.get(commandName as string) as MessageCommand

  await client.eval.run(message)

  try {
    await command?.execute(client, message, args)
  } catch (error: any) {
    errorManager.report(error, { executer: message, isSend: true })
  }
})
