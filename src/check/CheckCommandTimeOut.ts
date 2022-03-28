import moment from 'moment';
import { ICommand } from 'src/types/CommandTypes';
import { IBotMessageSend } from './../types/index';

export const checkCommandTimeOut = <MetaData>(
  commandFile: ICommand<MetaData>,
  Timeout: {
    [key: string]: number;
  },
  userId: string,
  BotMessageSend: IBotMessageSend
) => {
    if (Timeout[`${commandFile.name}${userId}`]) {
      const timeWait = moment
        .utc(Timeout[`${commandFile.name}${userId}`] - Date.now())
        .format('HH:mm:ss');
    return BotMessageSend.commandCoolDown.replace('{time}', timeWait);
  }

  return null;
};
