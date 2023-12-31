import {
  ButtonInteraction,
  ChatInputCommandInteraction,
  ClientOptions,
  ContextMenuCommandInteraction,
  HexColorString,
  Message,
  ModalSubmitInteraction,
  AnySelectMenuInteraction,
  ShardingManagerOptions
} from 'discord.js'
import { ReportType } from '@utils/Constants'
import { NodeOptions } from '@sentry/node'

export interface ErrorReportOptions {
  executer?:
    | Message<true>
    | ChatInputCommandInteraction<'cached'>
    | ContextMenuCommandInteraction<'cached'>
    | AnySelectMenuInteraction<'cached'>
    | ButtonInteraction<'cached'>
    | ModalSubmitInteraction<'cached'>
    | undefined
  isSend?: boolean
}

export type IConfig = {
  BUILD_VERSION: string
  BUILD_NUMBER: string
  channelId: string
  name: string
  githubToken?: string
  repository?: string
  sentry: NodeOptions
} & { bot: BotConfig } & {
  report: ErrorReportConfig
}

export interface ErrorReportConfig {
  type: ReportType
  webhook: {
    url: string
  }
  text: {
    guildID: string
    channelID: string
  }
}

export interface BotConfig {
  sharding: boolean
  shardingOptions?: ShardingManagerOptions
  options: ClientOptions
  token: string
  owners?: string[]
  prefix: string
  cooldown?: number
}

export type EmbedType =
  | 'default'
  | 'error'
  | 'success'
  | 'warn'
  | 'info'
  | HexColorString

export * from './structures.js'
export * from './command.js'
