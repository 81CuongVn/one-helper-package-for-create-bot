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
  CustomPrefix?: {
    [guidId: string]: string;
  };
}
export type PromiseOrType<T> = T | Promise<T>;
