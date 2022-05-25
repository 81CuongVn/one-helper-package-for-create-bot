import { Message } from "discord.js";

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
}
export type PromiseOrType<T> = T | Promise<T>;
