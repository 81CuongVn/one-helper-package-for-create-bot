/* eslint-disable @typescript-eslint/no-var-requires */
import fs from 'fs';
import path from 'path';
import {
  CacheType,
  Client,
  CommandInteraction,
  Interaction,
  Message,
} from 'discord.js';
import { ICommand } from './types/CommandTypes';
import { Log } from './module/LogClass';
import RPC from 'discord-rpc';
import { checkForMessage } from './check/CheckForMessage';
import { checkForInteraction } from './check/CheckForInteraction';
import { OnMessageCommandDone } from './module/OnMessageCommandDone';
import { OnInteractionCommandDone } from './module/OnInteractionCommandDone';
import { messageSend } from './message';
import { IBotMessageSend, inputType, PromiseOrType } from './types';
import EventEmitter from 'events';

interface CommandEvents {
  startScanDir: () => PromiseOrType<void>;
  SuccessScanDir: (resultDir: string[]) => PromiseOrType<void>;
  startScanCommand: () => PromiseOrType<void>;
  SuccessScanCommand: (
    slashCommand: ICommand[],
    allCommand: {
      [key: string]: string;
    },
    allAliases: {
      [key: string]: string;
    }
  ) => PromiseOrType<void>;
  startAddEvent: () => PromiseOrType<void>;
  SuccessAddEvent: () => PromiseOrType<void>;
  startPossessOnMessageCreateEvent: (
    message: Message<boolean>
  ) => PromiseOrType<void>;
  SuccessPossessOnMessageCreateEvent: (
    message: Message<boolean>
  ) => PromiseOrType<void>;
  startPossessOnInteractionCreateEvent: (
    interaction: CommandInteraction<CacheType>
  ) => PromiseOrType<void>;
  SuccessPossessOnInteractionCreateEvent: (
    interaction: CommandInteraction<CacheType>
  ) => PromiseOrType<void>;
  startGetAllCommand: () => PromiseOrType<void>;
  SuccessGetAllCommand: (allCommand: {
    [key: string]: ICommand;
  }) => PromiseOrType<void>;
  startSetRpc: () => PromiseOrType<void>;
  SuccessSetRpc: (rpcClient: RPC.Client) => PromiseOrType<void>;
}
export declare interface Command extends EventEmitter.EventEmitter {
  on<U extends keyof CommandEvents>(event: U, listener: CommandEvents[U]): this;

  emit<U extends keyof CommandEvents>(
    event: U,
    ...args: Parameters<CommandEvents[U]>
  ): boolean;
}

export class Command extends EventEmitter.EventEmitter {
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
  BotPrefix: string;
  CommandTimeoutCollection: {
    [key: string]: number;
  };
  BotMessageSend: IBotMessageSend;
  typescript: boolean;
  constructor(client: Client, input: inputType) {
    super();
    this.allCommand = {};
    this.allAliases = {};
    this.owner = input.owner || [];
    this.client = client;
    this.isDev = input.isDev || false;
    this.LogForMessageAndInteraction =
      input.LogForMessageAndInteraction || false;
    this.BotPrefix = input.BotPrefix || '!';
    this.CommandTimeoutCollection = {};
    this.BotMessageSend = input.BotMessageSend || messageSend.vi;
    this.typescript = input.typescript || true;
    const commandDir = input.commandDir;
    const commandDirList = this.scanDir(commandDir);
    this.scanCommand(commandDirList);
    this.addEvent(client);
  }
  private scanDir(dir: string) {
    this.LogForThisClass('scanDir', `Scanning ${dir} ...`);
    this.emit('startScanDir');
    let resultDir: string[] = [];
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        resultDir = resultDir.concat(this.scanDir(filePath));
      } else if (filePath.endsWith(this.typescript ? '.ts' : '.js')) {
        const commandName = path.join(
          dir,
          file.replace(this.typescript ? '.ts' : '.js', '')
        );
        resultDir.push(commandName);
      }
    }
    this.LogForThisClass('scanDir', `Scanning ${dir} complete`);
    this.emit('SuccessScanDir', resultDir);
    return resultDir;
  }
  private scanCommand(commandDir: string[]) {
    this.LogForThisClass('scanCommand', `Scanning command ...`);
    this.emit('startScanCommand');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const slashCommand: any[] = [];
    for (const command of commandDir) {
      const commandFile = require(command).default
        ? require(command).default
        : require(command);
      if (commandFile) {
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
      } else {
        this.LogForThisClass(`${command} is not a valid command`);
      }
    }
    this.client.guilds.cache.forEach(async (guild) => {
      return guild?.commands.set(slashCommand);
    });
    this.emit(
      'SuccessScanCommand',
      slashCommand,
      this.allCommand,
      this.allAliases
    );
    this.LogForThisClass('scanCommand', `Scanning command complete`);
  }
  private addEvent(client: Client) {
    this.LogForThisClass('addEvent', `Adding event ...`);
    this.emit('startAddEvent');
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const _this = this;
    client.on('messageCreate', (message) => {
      _this.OnMessageCreate(message);
    });
    client.on('interactionCreate', async (interaction) => {
      _this.OnInteractionCreate(interaction);
    });
    this.emit('SuccessAddEvent');
    this.LogForThisClass('addEvent', `Adding event complete`);
  }
  private async OnMessageCreate(message: Message<boolean>) {
    const content = message.content;
    this.emit('startPossessOnMessageCreateEvent', message);
    if (!content.startsWith(this.BotPrefix)) {
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
        const Check = checkForMessage(
          message,
          commandFile,
          this.LogForMessageAndInteractionFunc.bind(this),
          this.owner,
          this.CommandTimeoutCollection,
          this.BotMessageSend
        );
        if (Check) {
          message.reply(Check);
          return;
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
        OnMessageCommandDone(
          this.CommandTimeoutCollection,
          commandFile,
          message
        );
        this.LogForMessageAndInteractionFunc(
          'OnMessageCreate',
          `${message.author.username} send command : '${commandName}' , All content send : '${content}' complete`
        );
      }
    }
    this.emit('SuccessPossessOnMessageCreateEvent', message);
  }
  private async OnInteractionCreate(interaction: Interaction<CacheType>) {
    if (interaction.isCommand()) {
      this.emit('startPossessOnInteractionCreateEvent', interaction);
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
          const Check = checkForInteraction(
            interaction,
            commandFile,
            this.LogForMessageAndInteractionFunc.bind(this),
            this.owner,
            this.CommandTimeoutCollection,
            this.BotMessageSend
          );
          if (Check) {
            interaction.editReply(Check);
            return;
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
          OnInteractionCommandDone(
            this.CommandTimeoutCollection,
            commandFile,
            interaction
          );
        }
      }
      this.LogForMessageAndInteractionFunc(
        'OnInteractionCreate',
        `User ${interaction.member?.user.username} use command : '${interaction.commandName}' complete`
      );
      this.emit('SuccessPossessOnInteractionCreateEvent', interaction);
    }
  }
  public getAllCommand() {
    this.LogForThisClass('getAllCommand', `Getting all command ...`);
    this.emit('startGetAllCommand');
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
    this.emit('SuccessGetAllCommand', resultCommand);
    return resultCommand;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private LogForThisClass(processName: string, ...rest: any) {
    if (this.isDev) Log.debug(processName, ...rest);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private LogForMessageAndInteractionFunc(processName: string, ...rest: any) {
    if (this.LogForMessageAndInteraction) Log.debug(processName, ...rest);
  }
  public SetRpc(rpc: RPC.Presence = {}) {
    this.emit('startSetRpc');
    if (!this.client.application?.id) {
      throw new Error('Bot not have application id');
    }
    RPC.register(this.client.application.id);
    const RpcClient = new RPC.Client({
      transport: 'ipc',
    });
    const BotAvatar = this.client.user?.displayAvatarURL();
    RpcClient.on('ready', () => {
      RpcClient.setActivity({
        details: `đang phát triển bot ${this.client.user?.tag}`,
        state: 'đang phát triển',
        startTimestamp: new Date(),
        largeImageKey: BotAvatar || undefined,
        largeImageText: BotAvatar ? 'Bot Avatar' : undefined,
        smallImageKey: BotAvatar || undefined,
        smallImageText: BotAvatar ? 'Bot Avatar' : undefined,
        instance: true,
        ...rpc,
      });
      this.emit('SuccessSetRpc', RpcClient);
    });
    RpcClient.login({
      clientId: this.client.application?.id || '',
    });
    return this;
  }
}
export { Log } from './module/LogClass';
export * from './types/CommandTypes';
export * from './types/';
