import moment from 'moment';
import { ICommand } from 'src/types/CommandTypes';

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
        .format('HH:mm:ss');
    return `Bạn phải chờ ${timeWait} giây để sử dụng lệnh này`;
  }

  return null;
};
