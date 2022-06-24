import { Message } from 'discord.js';
import { callbackFunc } from './CommandTypes';

export interface IBotMessageSend {
  commandCoolDown: string;
  DonHavePermissionToUseCommand: string;
}
export interface inputType<MetaDataType> {
  commandDir: string;
  isDev?: boolean;
  owner?: string[];
  LogForMessageAndInteraction?: boolean;
  BotPrefix?: string;
  BotMessageSend?: IBotMessageSend;
  typescript?: boolean;
  metaData: MetaDataType;
  CustomPrefix?: (message: Message<boolean>) => string;
  testServer?: string[];
  alwayRunFunc?: callbackFunc<MetaDataType>;
}
export type PromiseOrType<T> = T | Promise<T>;
