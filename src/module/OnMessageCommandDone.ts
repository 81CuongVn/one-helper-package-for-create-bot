import {  Message } from 'discord.js';
import { ICommand } from 'src/types/CommandTypes';

export const OnMessageCommandDone = (
  Timeout: {
    [key: string]: number;
  },
  commandFile: ICommand,
  message: Message<boolean>
) => {
  if (commandFile.coolDown) {
      Timeout[`${commandFile.name}${message.author.id}`] = commandFile.coolDown + Date.now();
    setTimeout(() => {
      delete Timeout[`${commandFile.name}${message.author.id}`];
    }, commandFile.coolDown);
  }
};
