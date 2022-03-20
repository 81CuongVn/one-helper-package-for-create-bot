import fs from 'fs';
import path from 'path';
import { CacheType, Client, Interaction, Message } from 'discord.js';
import { ICommand } from './types/CommandTypes';
import { Log } from './module/LogClass';
import { checkPermissions } from './check/permissions';
import { checkOnlyForOwner } from './check/CheckOnlyForOwner';

export interface inputType {
  commandDir: string;
  isDev?: boolean;

  owner?: string[];
  LogForMessageAndInteraction?: boolean;
}
export class Command {
  allCommand: {
    [key: string]: string;
  };
  allAliases: {
    [key: string]: string;
  };
  client: Client<boolean>;
  owner: string[];
  isDev: boolean;
  LogForMessageAndInteraction: boolean;
  constructor(client: Client, input: inputType) {
    this.allCommand = {};
    this.allAliases = {};
    this.owner = input.owner || [];
    this.client = client;
    this.isDev = input.isDev || false;
    this.LogForMessageAndInteraction =
      input.LogForMessageAndInteraction || false;
    const commandDir = input.commandDir;
    const commandDirList = this.scanDir(commandDir);
    this.scanCommand(commandDirList);
    this.addEvent(client);
  }
  private scanDir(dir: string) {
    this.LogForThisClass('scanDir', `Scanning ${dir} ...`);
    let returnDir: string[] = [];
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        returnDir = returnDir.concat(this.scanDir(filePath));
      } else if (filePath.endsWith('.ts')) {
        const commandName = path.join(dir, file.replace('.ts', ''));
        returnDir.push(commandName);
      }
    }
    this.LogForThisClass('scanDir', `Scanning ${dir} complete`);
    return returnDir;
  }
  private scanCommand(commandDir: string[]) {
    this.LogForThisClass('scanCommand', `Scanning command ...`);
    const slashCommand: any[] = [];
    for (const command of commandDir) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const commandFile = require(command).default;
      const commandName = commandFile.name;
      this.allCommand[commandName] = command;
      if (commandFile.aliases && Array.isArray(commandFile.aliases)) {
        commandFile.aliases.map((alias: string) => {
          this.allAliases[alias] = commandName;
        });
      }
      if (commandFile.isSlash) {
        slashCommand.push(commandFile);
      }
    }
    this.client.guilds.cache.map(async (guild) => {
      const guildId = guild.id;
      if (!guildId) return;
      if (guildId) {
        if (slashCommand) {
          await this.client.guilds.cache
            .get(guildId)
            ?.commands.set(slashCommand);
        }
      }
    });
    this.LogForThisClass('scanCommand', `Scanning command complete`);
  }
  private addEvent(client: Client) {
    this.LogForThisClass('addEvent', `Adding event ...`);
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const _this = this;
    client.on('messageCreate', (message) => {
      _this.OnMessageCreate(message);
    });
    client.on('interactionCreate', async (interaction) => {
      _this.OnInteractionCreate(interaction);
    });
    this.LogForThisClass('addEvent', `Adding event complete`);
  }
  private async OnMessageCreate(message: Message<boolean>) {
    const content = message.content;
    if (!content.startsWith('!')) {
      return;
    }
    const command = content.toLowerCase().slice(1).split(' ');
    const commandName = command.shift()?.toLowerCase();
    if (!commandName) return;
    const commandDir =
      this.allCommand[commandName] ||
      this.allCommand[this.allAliases[commandName]];
    if (commandDir) {
      this.LogForMessageAndInteractionFunc(
        'OnMessageCreate',
        `${message.author.username} send command : '${commandName}' , All content send '${content}' ...`
      );
      message.channel.sendTyping();
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const commandFile: ICommand = require(commandDir).default;
      if (commandFile) {
        if (commandFile.permission) {
          const IsHavePermission = checkPermissions(
            message.member?.permissions,
            commandFile.permission
          );
          if (!IsHavePermission) {
            message.reply(
              `Bạn không có quyền để sử dụng lệnh ${commandFile.name}`
            );
            this.LogForMessageAndInteractionFunc(
              'OnMessageCreate',
              `${message.author.username} don't have permission to use command : '${commandFile.name}'`
            );
            return;
          }
        }
        if (commandFile.OnlyOwner) {
          if (!checkOnlyForOwner(this.owner, message.author.id)) {
            message.reply(
              `Bạn không có quyền để sử dụng lệnh ${commandFile.name}`
            );
            this.LogForMessageAndInteractionFunc(
              'OnMessageCreate',
              `${message.author.username} don't have permission to use command : '${commandFile.name}' for owner`
            );
            return;
          }
        }
        const commandResult = await commandFile.callback({
          client: this.client,
          InteractionOrMessage: message,
          getAllCommand: this.getAllCommand.bind(this),
          args: command,
        });
        if (commandResult) {
          await message.reply(commandResult);
        }
        this.LogForMessageAndInteractionFunc(
          'OnMessageCreate',
          `${message.author.username} send command : '${commandName}' , All content send : '${content}' complete`
        );
      }
    }
  }
  private async OnInteractionCreate(interaction: Interaction<CacheType>) {
    if (interaction.isCommand()) {
      this.LogForMessageAndInteractionFunc(
        'OnInteractionCreate',
        `User ${interaction.member?.user.username} use command : '${interaction.commandName}'...`
      );
      const command = this.allCommand[interaction.commandName];
      if (command) {
        await interaction.deferReply();
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const commandFile: ICommand = require(command).default;
        if (commandFile) {
          if (commandFile.permission) {
            const isHavePermission = checkPermissions(
              interaction.memberPermissions,
              commandFile.permission
            );
            if (!isHavePermission) {
              interaction.reply(
                `Bạn không có quyền để sử dụng lệnh ${commandFile.name}`
              );
              this.LogForMessageAndInteractionFunc(
                'OnInteractionCreate',
                `${interaction.member?.user.username} don't have permission to use command : '${commandFile.name}'`
              );
              return;
            }
          }
          if (commandFile.OnlyOwner) {
            if (!checkOnlyForOwner(this.owner, interaction.member?.user.id)) {
              interaction.reply(
                `Bạn không có quyền để sử dụng lệnh ${commandFile.name}`
              );
              this.LogForMessageAndInteractionFunc(
                'OnInteractionCreate',
                `${interaction.member?.user.username} don't have permission to use command : '${commandFile.name}' for owner`
              );
              return;
            }
          }
          const commandResult = await commandFile.callback({
            client: this.client,
            InteractionOrMessage: interaction,
            getAllCommand: this.getAllCommand.bind(this),
            isInteraction: true,
            RawOption: interaction.options.data,
            option: interaction.options,
          });
          if (commandResult) {
            interaction.editReply(commandResult);
          }
        }
      }
      this.LogForMessageAndInteractionFunc(
        'OnInteractionCreate',
        `User ${interaction.member?.user.username} use command : '${interaction.commandName}' complete`
      );
    }
  }
  public getAllCommand() {
    this.LogForThisClass('getAllCommand', `Getting all command ...`);
    const resultCommand: {
      [key: string]: ICommand;
    } = {};
    for (const commandName of Object.keys(this.allCommand)) {
      const commandDir = this.allCommand[commandName];
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const commandFile = require(commandDir).default;
      resultCommand[commandName] = commandFile;
    }
    this.LogForThisClass('getAllCommand', `Getting all command complete`);
    return resultCommand;
  }
  public LogForThisClass(processName: string, ...rest: any) {
    if (this.isDev) Log.debug(processName, ...rest);
  }
  public LogForMessageAndInteractionFunc(processName: string, ...rest: any) {
    if (this.LogForMessageAndInteraction) Log.debug(processName, ...rest);
  }
}
