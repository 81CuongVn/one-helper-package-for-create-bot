/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-var-requires */
import { APIMessage } from 'discord-api-types';
import RPC from 'discord-rpc';
import {
  CacheType,
  Client,
  CommandInteraction, Interaction,
  Message
} from 'discord.js';
import EventEmitter from 'events';
import fs from 'fs';
import path from 'path';
import { checkForInteraction } from './check/CheckForInteraction';
import { checkForMessage } from './check/CheckForMessage';
import { messageSend } from './message';
import { Log } from './module/LogClass';
import { OnInteractionCommandDone } from './module/OnInteractionCommandDone';
import { OnMessageCommandDone } from './module/OnMessageCommandDone';
import { IBotMessageSend, inputType, PromiseOrType } from './types';
import { ICommand } from './types/CommandTypes';

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
    CommandObject: Command<MetaDataType>;
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
    InteractionSend: APIMessage | Message<boolean> | void;
    MetaData: MetaDataType;
  }) => PromiseOrType<void>;
  startGetAllCommand: () => PromiseOrType<void>;
  SuccessGetAllCommand: (allCommand: {
    [key: string]: ICommand<MetaDataType>;
  }) => PromiseOrType<void>;
  startSetRpc: () => PromiseOrType<void>;
  SuccessSetRpc: (rpcClient: RPC.Client) => PromiseOrType<void>;
  addCommandOnBotJoin: () => PromiseOrType<void>;
  SuccessAddCommandOnBotJoin: (
    slashCommand: ICommand<MetaDataType>[]
  ) => PromiseOrType<void>;
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
  CustomPrefix: { [guidId: string]: string };
  commandDir: string;
  testServer: string[];
  commandDirList: string[];
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
    this.MetaData = input.metaData;
    this.CustomPrefix = input.CustomPrefix || {};
    this.commandDir = input.commandDir;
    this.testServer = input.testServer || [];
  }
  public init() {
    this.commandDirList = this.scanDir(this.commandDir);
    this.scanCommand(this.commandDirList);
    this.addEvent(this.client);
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
        let commandName: string | null = path.join(
          dir,
          file.replace(this.typescript ? '.ts' : '.js', '')
        );
        resultDir.push(commandName);
        commandName = null;
      }
    }
    this.LogForThisClass('scanDir', `Scanning ${dir} complete`);
    this.emit('SuccessScanDir', resultDir);
    return resultDir;
  }
  private scanCommand(commandDirs: string[]) {
    this.LogForThisClass('scanCommand', `Scanning command ...`);
    this.emit('startScanCommand');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const slashCommand: ICommand<MetaDataType>[] = [];
    for (const command of commandDirs) {
      const commandFile:ICommand<MetaDataType> = require(command).default
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
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const _this = this;
    this.client.guilds.cache.forEach(async (guild) => {
      _this.testServer.includes(guild.id)
        ? await guild?.commands.set(slashCommand)
        : await guild?.commands.set(
            slashCommand.filter((command) => !command.testCommand)
          );
    });
    this.emit(
      'SuccessScanCommand',
      slashCommand,
      this.allCommand,
      this.allAliases
    );
    this.LogForThisClass('scanCommand', `Scanning command complete`);
  }
  private async addSlashCommandToGuild(guildId: string) {
    this.emit('addCommandOnBotJoin');
    this.LogForThisClass('addSlashCommand', `Add slash command ...`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const slashCommand: ICommand<MetaDataType>[] = [];

    for (const commandDir of this.commandDirList) {
      const commandFile: ICommand<MetaDataType> = require(commandDir).default
        ? require(commandDir).default
        : require(commandDir);
      if (commandFile.isSlash) {
        slashCommand.push(commandFile);
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const slashCommandSet = this.testServer.includes(guildId)
      ? slashCommand
      : slashCommand.filter((command) => !command.testCommand);
    this.client.guilds.fetch(guildId).then((guild) => {
      guild?.commands.set(slashCommandSet);
    });
    this.emit('SuccessAddCommandOnBotJoin', slashCommand);
    this.LogForThisClass('addSlashCommand', `Add slash command complete`);
  }
  private addEvent(client: Client) {
    this.LogForThisClass('addEvent', `Adding event ...`);
    this.emit('startAddEvent');
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const _this = this;
    client.on('messageCreate', async (message) => {
      await _this.OnMessageCreate(message);
    });
    client.on('interactionCreate', async (interaction) => {
      _this.OnInteractionCreate(interaction);
    });
    client.on('guildCreate', async (guild) => {
      await this.addSlashCommandToGuild(guild.id);
    });
    this.emit('SuccessAddEvent');
    this.LogForThisClass('addEvent', `Adding event complete`);
  }
  private async OnMessageCreate(message: Message<boolean>) {
    if (!message.guild) return;

    const thisSessionId = Command.generationUUid();
    let IsReplyMessage = true;
    const SetIsReplyMessage = (data: boolean) => {
      IsReplyMessage = data;
    };
    this.emit('startPossessOnMessageCreateEvent', {
      message,
      sessionId: thisSessionId,
      SetIsReplyMessage,
      CommandObject: this,
    });
    if (!IsReplyMessage) return;
    const content = message.content.trim();
    const guildPrefix =
      (this.CustomPrefix && this.CustomPrefix[message.guild.id]) ||
      this.BotPrefix;
    if (!content.startsWith(guildPrefix)) {
      return;
    }
    const command = content.toLowerCase().slice(1).split(' ');
    const commandName = command.shift()?.toLowerCase().trim();
    if (!commandName) return;

    const commandDir =
      this.allCommand[commandName] ||
      this.allCommand[this.allAliases[commandName]];
    if (commandDir) {
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
      if (commandFile.testCommand)
        if (!this.testServer.includes(message.guild.id)) {
          const messageAfterSend = await message.reply({
            content:
              'This command is in test mode, please wait for the bot to be ready.',
          });
          this.emit('SuccessPossessOnMessageCreateEvent', {
            message,
            messageAfterSend,
            commandName,
            commandFile,
            sessionId: thisSessionId,
            MetaData: this.MetaData,
          });
          this.LogForMessageAndInteractionFunc(
            'OnMessageCreate',
            `${message.author.username} send command : '${commandName}' , All content send : '${content}' complete`
          );

          return;
        }
      if (commandFile.OnlySlash) return;
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
          SetGuidPrefix: this.SetGuidPrefix.bind(this),
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
          this.LogForMessageAndInteractionFunc(
            'OnMessageCreate',
            `${message.author.username} send command : '${commandName}' , All content send : '${content}' complete`
          );
        }
      }
    }
  }
  private async OnInteractionCreate(interaction: Interaction<CacheType>) {
    if (interaction.isCommand()) {
      const thisSessionId = Command.generationUUid();
      if (!interaction.guild) return;

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
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const commandFile: ICommand<MetaDataType> = require(command).default;
        if (commandFile) {
          if (commandFile.testCommand)
            if (!this.testServer.includes(interaction.guild.id)) {
              this.emit('SuccessPossessOnInteractionCreateEvent', {
                interaction,
                sessionId: thisSessionId,
                InteractionSend: void 0,
                MetaData: this.MetaData,
              });
              this.LogForMessageAndInteractionFunc(
                'OnInteractionCreate',
                `User ${interaction.member?.user.username} use command : '${interaction.commandName}' complete`
              );
              return interaction.reply({
                content:
                  'This command is in test mode, please wait for the bot to be ready.',
                ephemeral: true,
              });
            }
          if (commandFile.DeferReply)
            await interaction.deferReply({
              ephemeral: commandFile.ephemeralReply
                ? commandFile.ephemeralReply
                : false,
            });

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
            commandFile.DeferReply
              ? interaction.editReply(Check)
              : interaction.reply(Check);

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
            SetGuidPrefix: this.SetGuidPrefix.bind(this),
          });
          if (commandResult) {
            const InteractionSend = commandFile.DeferReply
              ? await interaction.editReply(commandResult)
              : await interaction.reply(commandResult);
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
  public SetGuidPrefix(guildId: string, prefix: string) {
    this.CustomPrefix[guildId] = prefix;
    return this;
  }
  public setDefaultPrefix(prefix: string) {
    this.BotPrefix = prefix;
    return this;
  }
  public scanFileTsOrJsFile<FileType>(dir: string): FileType[] {
    const allFileDir = this.scanDir(dir);
    const result: FileType[] = [];
    for (const fileDir of allFileDir) {
      const fileName = path.basename(fileDir);
      if (fileName.endsWith('.ts') || fileName.endsWith('.js')) {
        const data: FileType = require(fileDir).default;
        result.push(data);
      }
    }
    return result;
  }
}
export { Log } from './module/LogClass';
export * from './types/';
export * from './types/CommandTypes';

