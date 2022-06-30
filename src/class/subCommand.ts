import {
  ApplicationCommandOptionData,
  ChatInputApplicationCommandData,
  Client,
  Constants,
} from 'discord.js';
import glob from 'glob';
import { promisify } from 'util';
import { IIndexFile, ISubCommand } from '../types/SubCommandType';

interface ISubcommandInput {
  SubCommandPath: string;
  indexFile?: string;
  client: Client<boolean>;
}
export class SubCommand {
  SubCommandPath: string;
  indexFile: string | undefined;
  client: Client<boolean>;
  constructor(input: ISubcommandInput) {
    this.SubCommandPath = input.SubCommandPath;
    this.indexFile = input.indexFile || 'index';
    this.client = input.client;
  }
  async init() {
    const allIndexFile = await this.scanIndexFile();
    this.loadIndexFile(allIndexFile);
  }
  async scanIndexFile() {
    const globPromise = promisify(glob);
    const commandFile = await globPromise(
      `${this.SubCommandPath}/*/*${this.indexFile}{.ts,.js}`,
      {
        cwd: this.SubCommandPath,
      }
    );
    return commandFile;
  }

  async loadIndexFile(AllIndexFile: string[]) {
    const AllCommand: ChatInputApplicationCommandData[] = [];
    for (const file of AllIndexFile) {
      const FileContent: IIndexFile = await this.ImportFile(file);
      const slashOptionData: ApplicationCommandOptionData[] = [
        {
          name: (FileContent.defaultOption.name || 'subCommand').toLowerCase(),
          description: FileContent.defaultOption.description || 'sub command',
          type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND_GROUP,
          options: [],
        },
      ];
      for (const fileDir of FileContent.SubFile) {
        const SubCommandFile: ISubCommand = await this.ImportFile(fileDir);
        if (!SubCommandFile.name || !SubCommandFile.description) continue;
        if (
          slashOptionData[0].type ==
          Constants.ApplicationCommandOptionTypes.SUB_COMMAND_GROUP
        )
          slashOptionData[0].options?.push({
            name: SubCommandFile.name,
            description: SubCommandFile.description,
            type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
            options: SubCommandFile.options,
          });
      }
      AllCommand.push({
        name: FileContent.name,
        description: FileContent.description,
        options: slashOptionData,
      });
    }
    this.client.guilds.cache.forEach(async (guild) => {
      await guild?.commands.set(AllCommand);
    });
  }
  async ImportFile(dir: string) {
    return (await import(dir)) && (await import(dir)).default;
  }
}
