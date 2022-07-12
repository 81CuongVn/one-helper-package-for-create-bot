/* eslint-disable @typescript-eslint/no-empty-interface */
import {
  ChatInputApplicationCommandData,
  MessagePayload,
  PermissionResolvable,
  ReplyMessageOptions,
} from 'discord.js/typings';
import { PromiseOrType } from './utils.types';
import {
  InputCallBackForInteraction,
  InputCallBackForMessage,
} from '../module/InputCallbackFunc';

// eslint-disable-next-line @typescript-eslint/ban-types

export type InputCallBack<MetaData> =
  | InputCallBackForInteraction<MetaData>
  | InputCallBackForMessage<MetaData>;

// ApplicationCommandDataResolvable
export interface ISlashCommandHandlers
  extends ChatInputApplicationCommandData {}
export type callbackFunc<MetaData> = (
  input: InputCallBack<MetaData>
) => PromiseOrType<
  string | MessagePayload | ReplyMessageOptions | null | undefined | void
>;

export interface ICommand<MetaData> extends ISlashCommandHandlers {
  name: string;
  description: string;
  category?: string;
  isSlash?: boolean;
  callback: callbackFunc<MetaData>;
  aliases?: string[];
  permission?: PermissionResolvable[];
  coolDown?: number;
  OnlyOwner?: boolean;
  ephemeralReply?: boolean;
  OnlySlash?: boolean;
  DeferReply?: boolean;
  testCommand?: boolean;
  handleEvent?: callbackFunc<MetaData>;
}
