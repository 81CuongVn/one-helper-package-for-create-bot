import { Interaction, CacheType } from 'discord.js';
import { ICommand } from 'src/types/CommandTypes';

export const OnInteractionCommandDone = <MetaData>(
  Timeout: {
    [key: string]: number;
  },
  commandFile: ICommand<MetaData>,
  Interaction: Interaction<CacheType>,
) => {
  if (commandFile.coolDown) {
    Timeout[`${commandFile.name}${Interaction.user.id}`] =
      commandFile.coolDown + Date.now();
    setTimeout(() => {
      delete Timeout[`${commandFile.name}${Interaction.user.id}`];
    }, commandFile.coolDown);
  }
};
