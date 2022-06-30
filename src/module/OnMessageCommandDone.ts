import { Message } from 'discord.js';
import { ICommand } from 'src/types/CommandTypes';

export const OnMessageCommandDone = <MetaData>(
  Timeout: {
    [key: string]: number;
  },
  commandFile: ICommand<MetaData>,
  message: Message<boolean>
) => {
  if (commandFile.coolDown) {
    Timeout[`${commandFile.name}${message.author.id}`] =
      commandFile.coolDown + Date.now();
    setTimeout(() => {
      delete Timeout[`${commandFile.name}${message.author.id}`];
    }, commandFile.coolDown);
  }
};
