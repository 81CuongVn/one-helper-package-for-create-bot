import {
  Client,
  MessagePayload,
  ReplyMessageOptions,
  CacheType,
  Message,
  PermissionResolvable,
  ApplicationCommandOptionData,
  ApplicationCommandType,
  CommandInteractionOption,
  CommandInteractionOptionResolver,
  CommandInteraction,
} from 'discord.js';
import { PromiseOrType } from '.';
import { Command } from '../';

// eslint-disable-next-line @typescript-eslint/ban-types
interface BaseInputCallBack<MetaDataType> {
  sessionId: string;
  isInteraction?: boolean;
  getAllCommand: () => {
    [key: string]: ICommand<MetaDataType>;
  };
  client: Client;
  CommandObject: Command<MetaDataType>;
  MetaData: MetaDataType;
  SetGuidPrefix?: (guildId: string, prefix: string) => boolean;
}
interface InputCallBackForInteraction<MetaData>
  extends BaseInputCallBack<MetaData> {
  Interaction?: CommandInteraction<CacheType>;
  RawOption?: readonly CommandInteractionOption<CacheType>[];
  option?: Omit<
    CommandInteractionOptionResolver<CacheType>,
    'getMessage' | 'getFocused'
  >;
}
interface InputCallBackForMessage<MetaData>
  extends BaseInputCallBack<MetaData> {
  args?: string[];
  Message?: Message<boolean>;
}
export type InputCallBack<MetaData> = InputCallBackForInteraction<MetaData> &
  InputCallBackForMessage<MetaData>;

// ApplicationCommandDataResolvable
export interface ISlashCommandHandlers {
  type?: ApplicationCommandType;
  defaultPermission?: boolean;
  options?: Array<ApplicationCommandOptionData>;
}

export interface ICommand<MetaData> extends ISlashCommandHandlers {
  name: string;
  description?: string;
  category?: string;
  isSlash?: boolean;
  callback: (
    input: InputCallBack<MetaData>
  ) => PromiseOrType<
    string | MessagePayload | ReplyMessageOptions | null | undefined | void
  >;
  aliases?: string[];
  permission?: PermissionResolvable[];
  coolDown?: number;
  OnlyOwner?: boolean;
  ephemeralReply?: boolean;
  OnlySlash?: boolean;
  DeferReply?: boolean;
  testCommand?: boolean;
}
