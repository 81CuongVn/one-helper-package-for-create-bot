export interface IBotMessageSend {
  commandCoolDown: string;
  DonHavePermissionToUseCommand: string;
}
export interface inputType {
  commandDir: string;
  isDev?: boolean;
  owner?: string[];
  LogForMessageAndInteraction?: boolean;
  BotPrefix?: string;
  BotMessageSend?: IBotMessageSend;
}
