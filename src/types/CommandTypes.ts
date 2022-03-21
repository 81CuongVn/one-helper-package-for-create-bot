import {
  Client,
  MessagePayload,
  ReplyMessageOptions,
  CacheType,
  Interaction,
  Message,
  PermissionResolvable,
  ApplicationCommandOptionData,
  ApplicationCommandType,
  CommandInteractionOption,
  CommandInteractionOptionResolver,
} from 'discord.js';

export interface InputCallBack {
  client: Client;
  InteractionOrMessage: Message<boolean> | Interaction<CacheType>;
  getAllCommand: () => {
    [key: string]: ICommand;
  };
  isInteraction?: boolean;
  RawOption?: readonly CommandInteractionOption<CacheType>[];
  option?: Omit<
    CommandInteractionOptionResolver<CacheType>,
    'getMessage' | 'getFocused'
  >;
  args?: string[];
}
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
  ) => Promise<string | MessagePayload | ReplyMessageOptions>;
  aliases?: string[];
  permission?: PermissionResolvable[];
  coolDown?: number;
  OnlyOwner?: boolean;
}