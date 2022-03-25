/* eslint-disable @typescript-eslint/ban-types */
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
import { APIMessage } from 'discord-api-types';

interface CommandEvents<MetaDataType> {
  startScanDir: () => PromiseOrType<void>;
  SuccessScanDir: (resultDir: string[]) => PromiseOrType<void>;
  startScanCommand: () => PromiseOrType<void>;
  SuccessScanCommand: (
    slashCommand: ICommand<MetaDataType>[],
    allCommand: {
      [key: string]: string;
    },
    allAliases: {
      [key: string]: string;
    }
  ) => PromiseOrType<void>;
  startAddEvent: () => PromiseOrType<void>;
  SuccessAddEvent: () => PromiseOrType<void>;
  startPossessOnMessageCreateEvent: (input: {
    message: Message<boolean>;
    sessionId: string;
    SetIsReplyMessage: (data: boolean) => void;
  }) => PromiseOrType<void>;
  SuccessPossessOnMessageCreateEvent: (input: {
    message: Message<boolean>;
    messageAfterSend: Message<boolean>;
    commandName: string;
    commandFile: ICommand<MetaDataType>;
    sessionId: string;
    MetaData: MetaDataType;
  }) => PromiseOrType<void>;
  startPossessOnInteractionCreateEvent: (input: {
    SetIsReplyMessage: (data: boolean) => void;
    interaction: CommandInteraction<CacheType>;
    sessionId: string;
  }) => PromiseOrType<void>;
  SuccessPossessOnInteractionCreateEvent: (input: {
    interaction: CommandInteraction<CacheType>;
    sessionId: string;
    InteractionSend: APIMessage | Message<boolean>;
    MetaData: MetaDataType;
  }) => PromiseOrType<void>;
  startGetAllCommand: () => PromiseOrType<void>;
  SuccessGetAllCommand: (allCommand: {
    [key: string]: ICommand<MetaDataType>;
  }) => PromiseOrType<void>;
  startSetRpc: () => PromiseOrType<void>;
  SuccessSetRpc: (rpcClient: RPC.Client) => PromiseOrType<void>;
}
export declare interface Command<MetaDataType>
  extends EventEmitter.EventEmitter {
  on<U extends keyof CommandEvents<MetaDataType>>(
    event: U,
    listener: CommandEvents<MetaDataType>[U]
  ): this;

  emit<U extends keyof CommandEvents<MetaDataType>>(
    event: U,
    ...args: Parameters<CommandEvents<MetaDataType>[U]>
  ): boolean;
}

export class Command<MetaDataType> extends EventEmitter.EventEmitter {
  allCommand: {
    [key: string]: string;
  };
  allAliases: {
    [key: string]: string;
  };
  private client: Client<boolean>;
  owner: string[];
  isDev: boolean;
  LogForMessageAndInteraction: boolean;
  BotPrefix: string;
  CommandTimeoutCollection: {
    [key: string]: number;
  };
  private BotMessageSend: IBotMessageSend;
  typescript: boolean;
  // eslint-disable-next-line @typescript-eslint/ban-types
  MetaData: MetaDataType;
  constructor(client: Client, input: inputType<MetaDataType>) {
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
    this.MetaData = input.metaData;
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
    const thisSessionId = Command.generationUUid();
    const content = message.content;

    if (!content.startsWith(this.BotPrefix)) {
      return;
    }
    const command = content.toLowerCase().slice(1).split(' ');
    const commandName = command.shift()?.toLowerCase();
    if (!commandName) return;
    let IsReplyMessage = true;
    const SetIsReplyMessage = (data: boolean) => {
      IsReplyMessage = data;
    };
    const commandDir =
      this.allCommand[commandName] ||
      this.allCommand[this.allAliases[commandName]];
    if (commandDir) {
      this.emit('startPossessOnMessageCreateEvent', {
        message,
        sessionId: thisSessionId,
        SetIsReplyMessage,
      });
      this.LogForMessageAndInteractionFunc(
        'OnMessageCreate',
        `${message.author.username} send command : '${commandName}' , All content send '${content}' ...`
      );
      if (!IsReplyMessage) {
        return;
      }
      message.channel.sendTyping();
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const commandFile: ICommand<MetaDataType> = require(commandDir).default;
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
          Message: message,
          getAllCommand: this.getAllCommand.bind(this),
          args: command,
          sessionId: thisSessionId,
          isInteraction: false,
          CommandObject: this,
          MetaData: this.MetaData,
        });
        if (commandResult) {
          const messageAfterSend = await message.reply(commandResult);
          this.emit('SuccessPossessOnMessageCreateEvent', {
            message,
            messageAfterSend,
            commandName,
            commandFile,
            sessionId: thisSessionId,
            MetaData: this.MetaData,
          });
          OnMessageCommandDone(
            this.CommandTimeoutCollection,
            commandFile,
            message
          );
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
      const thisSessionId = Command.generationUUid();

      this.LogForMessageAndInteractionFunc(
        'OnInteractionCreate',
        `User ${interaction.member?.user.username} use command : '${interaction.commandName}'...`
      );
      const command = this.allCommand[interaction.commandName];
      let IsReplyMessage = true;
      const SetIsReplyMessage = (data: boolean) => {
        IsReplyMessage = data;
      };
      if (command) {
        await interaction.deferReply();
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const commandFile: ICommand<MetaDataType> = require(command).default;
        if (commandFile) {
          this.emit('startPossessOnInteractionCreateEvent', {
            interaction,
            sessionId: thisSessionId,
            SetIsReplyMessage,
          });
          if (!IsReplyMessage) {
            return;
          }
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
            Interaction: interaction,
            getAllCommand: this.getAllCommand.bind(this),
            isInteraction: true,
            RawOption: interaction.options.data,
            option: interaction.options,
            sessionId: thisSessionId,
            CommandObject: this,
            MetaData: this.MetaData,
          });
          if (commandResult) {
            const InteractionSend = await interaction.editReply(commandResult);
            this.emit('SuccessPossessOnInteractionCreateEvent', {
              interaction,
              sessionId: thisSessionId,
              InteractionSend,
              MetaData: this.MetaData,
            });
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
    }
  }
  public getAllCommand() {
    this.LogForThisClass('getAllCommand', `Getting all command ...`);
    this.emit('startGetAllCommand');
    const resultCommand: {
      [key: string]: ICommand<MetaDataType>;
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
  static generationUUid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0,
          v = c == 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }
  public getCommandWithName(commandName: string) {
    const commandDir = this.allCommand[commandName];
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const commandFile = require(commandDir).default;
    return {
      [commandName]: commandFile,
    };
  }
}
export { Log } from './module/LogClass';
export * from './types/CommandTypes';
export * from './types/';
