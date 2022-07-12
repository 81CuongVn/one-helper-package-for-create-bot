/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ApplicationCommandAutocompleteOption,
  ApplicationCommandChannelOptionData,
  ApplicationCommandChoicesData,
  ApplicationCommandNonOptionsData,
  ApplicationCommandNumericOptionData,
  CacheType,
  ChatInputApplicationCommandData,
  Client,
  CommandInteraction,
  InteractionReplyOptions,
  Message,
  MessageOptions,
  MessagePayload,
} from 'discord.js/typings/index';
import { PromiseOrType } from './utils.types';

type PrePossessFunc<TArgs, MetaData> = (
  setBreakPossess: (value: boolean) => void,
  input: SubCommandInputCallBack<MetaData>,
  ...arg2: TArgs[]
) => PromiseOrType<TArgs[] | void | undefined | null>;
export interface IIndexFile<MetaData, TArgs = any> {
  name: string;
  slash: boolean;
  message: boolean;
  SubFile: string[];
  aliases?: string[];
  defaultOption: {
    description?: string;
  };
  description: string;
  optionForAllCommand?: (
    | ApplicationCommandNonOptionsData
    | ApplicationCommandChannelOptionData
    | ApplicationCommandChoicesData
    | ApplicationCommandAutocompleteOption
    | ApplicationCommandNumericOptionData
  )[];
  PrePossessForAllCommand?: PrePossessFunc<TArgs, MetaData>;
}

export type SubCommandCallbackFunc<MetaData = any, TArgs = any> = (
  input: SubCommandInputCallBack<MetaData>,
  ...arg2: TArgs[]
) => PromiseOrType<{
  data:
    | string
    | MessagePayload
    | InteractionReplyOptions
    | void
    | null
    | undefined
    | MessageOptions;
  InteractionSuccess?: (
    interaction: CommandInteraction<CacheType>,
    InteractionSend: void | Message<boolean>
  ) => any;
  MessageSuccess?: (
    message: Message<boolean>,
    messageAfterSend: Message<boolean>
  ) => any;
}>;

export interface ISubCommand<MetaData, TArgs = any>
  extends ChatInputApplicationCommandData {
  options?: (
    | ApplicationCommandNonOptionsData
    | ApplicationCommandChannelOptionData
    | ApplicationCommandChoicesData
    | ApplicationCommandAutocompleteOption
    | ApplicationCommandNumericOptionData
  )[];
  aliases?: string[];
  callBack: SubCommandCallbackFunc<MetaData>;
  PrePossess?: PrePossessFunc<TArgs, MetaData>;
}
interface BaseCallBackInput<MetaData> {
  type: 'message' | 'interaction';
  MetaData?: MetaData;
  client: Client;
}

export interface InteractionSubCommandCallBackInput<MetaData>
  extends BaseCallBackInput<MetaData> {
  type: 'interaction';
  interaction: CommandInteraction<CacheType>;
}
export interface MessageSubCommandCallBackInput<MetaData>
  extends BaseCallBackInput<MetaData> {
  type: 'message';
  message: Message<boolean>;
  args: string[];
}
export type SubCommandInputCallBack<MetaData> =
  | InteractionSubCommandCallBackInput<MetaData>
  | MessageSubCommandCallBackInput<MetaData>;
