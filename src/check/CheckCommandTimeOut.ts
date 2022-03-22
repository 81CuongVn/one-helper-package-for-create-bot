import moment from 'moment';
import { ICommand } from 'src/types/CommandTypes';
import { messageSend } from './../message';

export const checkCommandTimeOut = (
  commandFile: ICommand,
  Timeout: {
    [key: string]: number;
  },
  userId: string
) => {
    if (Timeout[`${commandFile.name}${userId}`]) {
      const timeWait = moment
        .utc(Timeout[`${commandFile.name}${userId}`] - Date.now())
        .format('HH:mm:ss [UTC]');
    return messageSend.vi.commandCoolDown.replace('{time}', timeWait);
  }

  return null;
};
