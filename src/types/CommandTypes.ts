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

interface BaseInputCallBack {
  sessionId?: string;
  isInteraction?:  boolean;
  getAllCommand: () => {
    [key: string]: ICommand;
  };
  client: Client;
}
interface InputCallBackForInteraction extends BaseInputCallBack {
  Interaction?: CommandInteraction<CacheType>;
  RawOption?: readonly CommandInteractionOption<CacheType>[];
  option?: Omit<
    CommandInteractionOptionResolver<CacheType>,
    'getMessage' | 'getFocused'
  >;
}
interface InputCallBackForMessage extends BaseInputCallBack {
  args?: string[];
  Message?: Message<boolean>;
}
export type InputCallBack = InputCallBackForInteraction &
  InputCallBackForMessage;

// ApplicationCommandDataResolvable
export interface ISlashCommandHandlers {
  type?: ApplicationCommandType;
  defaultPermission?: boolean;
  options?: Array<ApplicationCommandOptionData>;
}

export interface ICommand extends ISlashCommandHandlers {
  name: string;
  description?: string;
  category?: string;
  isSlash?: boolean;
  callback: (
    input: InputCallBack
  ) =>
    | Promise<string | MessagePayload | ReplyMessageOptions>
    | string
    | MessagePayload
    | ReplyMessageOptions;
  aliases?: string[];
  permission?: PermissionResolvable[];
  coolDown?: number;
  OnlyOwner?: boolean;
}
