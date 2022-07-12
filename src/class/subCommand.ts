/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ApplicationCommandOptionData,
  CacheType,
  Client,
  Constants,
  Interaction,
  InteractionReplyOptions,
  Message,
  MessageOptions,
  MessagePayload,
} from 'discord.js';
import glob from 'glob';
import { promisify } from 'util';
import {
  IIndexFile,
  ISubCommand,
  SubCommandInputCallBack,
} from '../types/SubCommandType';
import { Log } from './LogClass';

interface ISubcommandInput<MetaData> {
  SubCommandPath: string;
  indexFile?: string;
  client: Client<boolean>;
  LogForMessageAndInteraction?: boolean;
  isDev?: boolean;
  metaData?: MetaData;
  CustomPrefix?: (message: Message<boolean>) => string;
  BotPrefix?: string;
}
export class SubCommand<Metadata> {
  SubCommandPath: string;
  indexFile: string | undefined;
  client: Client<boolean>;
  allCommand: {
    [keys: string]: {
      indexFile: string;
      [keys: string]: string;
    };
  };
  aliasesForMainCommand: {
    [keys: string]: {
      indexFile: string;
      [keys: string]: string;
    };
  };
  LogForMessageAndInteraction: boolean;
  isDev: boolean;
  ClassName: string;
  MetaData: Metadata | undefined;
  CustomPrefix: (message: Message<boolean>) => string;
  BotPrefix: string;
  constructor(input: ISubcommandInput<Metadata>) {
    this.SubCommandPath = input.SubCommandPath;
    this.indexFile = input.indexFile || 'index';
    this.client = input.client;
    this.allCommand = {};
    this.LogForMessageAndInteraction =
      input.LogForMessageAndInteraction || false;
    this.isDev = input.isDev || false;
    this.ClassName = this.constructor.name;
    this.MetaData = input.metaData;
    this.BotPrefix = input.BotPrefix || '!';
    this.CustomPrefix = input.CustomPrefix
      ? input.CustomPrefix
      : () => this.BotPrefix;
    this.aliasesForMainCommand = {};
  }
  async init() {
    const allIndexFile = await this.scanIndexFile();
    await this.loadIndexFile(allIndexFile);
    await this.AddEvent();
  }
  async scanIndexFile() {
    this.LogForThisClass(this.scanIndexFile.name, 'start  scan index file ...');
    const globPromise = promisify(glob);
    const commandFile = await globPromise(
      `${this.SubCommandPath}/*/*${this.indexFile}{.ts,.js}`,
      {
        cwd: this.SubCommandPath,
      }
    );
    this.LogForThisClass(this.scanIndexFile.name, 'scan index file success');
    return commandFile;
  }

  async loadIndexFile(AllIndexFile: string[]) {
    this.LogForThisClass(this.loadIndexFile.name, 'start load index file ...');
    for (const file of AllIndexFile) {
      const FileContent: IIndexFile<Metadata> = await this.ImportFile(file);
      this.allCommand[FileContent.name] = {
        indexFile: file,
      };
      if (FileContent.aliases) {
        for (const alias of FileContent.aliases) {
          this.aliasesForMainCommand[alias] = this.allCommand[FileContent.name];
        }
      }
      const slashOptionData: ApplicationCommandOptionData[] = [];
      for (const fileDir of FileContent.SubFile) {
        const SubCommandFile: ISubCommand<Metadata> = await this.ImportFile(
          fileDir
        );
        if (!SubCommandFile.name || !SubCommandFile.description) continue;
        this.allCommand[FileContent.name][SubCommandFile.name] = fileDir;
        if (SubCommandFile.aliases)
          for (const alias of SubCommandFile.aliases) {
            this.allCommand[FileContent.name][alias] = fileDir;
          }

        slashOptionData.push({
          name: SubCommandFile.name,
          description: SubCommandFile.description,
          type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
          options: [
            ...(FileContent.optionForAllCommand || []),
            ...(SubCommandFile.options || []),
          ],
        });
      }

      this.client.guilds.cache.forEach(async (guild) => {
        if (FileContent.slash)
          await guild.commands.create({
            name: FileContent.name,
            description: FileContent.description,
            options: slashOptionData,
          });
      });
    }
    this.LogForThisClass(this.loadIndexFile.name, 'success load index file ');
  }
  async ImportFile(dir: string) {
    return (await import(dir)) && (await import(dir)).default;
  }
  async AddEvent() {
    this.LogForThisClass(this.AddEvent.name, 'add event ...');
    this.client.on(
      'interactionCreate',
      (async (interaction: Interaction<CacheType>) => {
        await this.onInteractionCreate(interaction);
      }).bind(this)
    );
    this.client.on(
      'messageCreate',
      (async (message: Message<boolean>) => {
        await this.OnMessageCreate(message);
      }).bind(this)
    );
    this.LogForThisClass(this.AddEvent.name, 'add event success');
  }
  async onInteractionCreate(interaction: Interaction<CacheType>) {
    if (interaction.isCommand()) {
      if (!this.allCommand[interaction.commandName]) return;
      const subCommand = interaction.options.getSubcommand();
      this.LogForMessageAndInteractionFunc(
        this.onInteractionCreate.name,
        `User ${interaction.member?.user.username} use command : '${interaction.commandName}' with sub command is: '${subCommand}' ...`
      );
      if (!this.allCommand[interaction.commandName][subCommand]) return;
      const commandFile: ISubCommand<Metadata> = await this.ImportFile(
        this.allCommand[interaction.commandName][subCommand]
      );
      if (!commandFile) return;
      const state = {
        breakPossess: false,
      };
      const CallBackInput: SubCommandInputCallBack<Metadata> = {
        client: this.client,
        type: 'interaction',
        interaction: interaction,
        MetaData: this.MetaData,
      };
      const setBreakPossess = (value: boolean) => {
        state.breakPossess = value;
      };
      const prePossessDataReturn = [];
      if (this.allCommand[interaction.commandName]) {
        const indexFile = await this.ImportFile(
          this.allCommand[interaction.commandName].indexFile
        );
        if (indexFile.PrePossessForAllCommand) {
          const args = await indexFile.PrePossessForAllCommand(
            setBreakPossess,
            CallBackInput
          );
          if (state.breakPossess) {
            this.LogForMessageAndInteractionFunc(
              this.onInteractionCreate.name,
              `User ${interaction.member?.user.username} use command : '${interaction.commandName}' with sub command is: '${subCommand}' has been break`
            );
            return;
          }
          if (args) prePossessDataReturn.push(...args);
        }
      }
      if (commandFile.PrePossess) {
        const args = await commandFile.PrePossess(
          setBreakPossess,
          CallBackInput,
          ...prePossessDataReturn
        );
        if (state.breakPossess) {
          this.LogForMessageAndInteractionFunc(
            this.onInteractionCreate.name,
            `User ${interaction.member?.user.username} use command : '${interaction.commandName}' with sub command is: '${subCommand}' has been break`
          );
          return;
        }
        if (args) prePossessDataReturn.push(...args);
      }
      const data = await commandFile.callBack(
        CallBackInput,
        ...prePossessDataReturn
      );
      const result =
        typeof data.data != 'object' && typeof data.data != 'string'
          ? `${data.data}`
          : data.data;
      if (result) {
        const InteractionAfterRep = await(
          interaction.deferred || interaction.replied
            ? interaction.editReply(result)
            : interaction.reply(
                result as InteractionReplyOptions & {
                  fetchReply: true;
                }
              )
        );
        data.InteractionSuccess &&
          (await data.InteractionSuccess(
            interaction,
            InteractionAfterRep as unknown as Message<boolean>
          ));
        this.LogForMessageAndInteractionFunc(
          this.onInteractionCreate.name,
          `User ${interaction.member?.user.username} use command : '${interaction.commandName}' with sub command is: '${subCommand}' success`
        );
      }
    }
  }
  private LogForThisClass(processName: string, ...rest: any) {
    if (this.isDev) Log.logClass(this.ClassName, processName, ...rest);
  }
  private LogForMessageAndInteractionFunc(processName: string, ...rest: any) {
    if (this.LogForMessageAndInteraction)
      Log.logClass(this.ClassName, processName, ...rest);
  }
  private async OnMessageCreate(message: Message<boolean>) {
    if (!message.guild) return;
    if (!message.content.includes(this.CustomPrefix(message))) return;
    let content: string | string[] = message.content.slice(
      this.CustomPrefix(message).length
    );
    content = content.split(' ');
    const [commandName, subCommandName, ...args] = content;
    this.LogForMessageAndInteractionFunc(
      this.onInteractionCreate.name,
      `User ${message.member?.user.username} use command : '${commandName}' with sub command is: '${subCommandName}' ...`
    );
    let CommandObject = null;

    if (
      this.allCommand[commandName] &&
      this.allCommand[commandName][subCommandName]
    ) {
      CommandObject = this.allCommand[commandName];
    }
    if (
      this.aliasesForMainCommand[commandName] &&
      this.aliasesForMainCommand[commandName][subCommandName]
    ) {
      CommandObject = this.aliasesForMainCommand[commandName];
    }
    if (!CommandObject) return;
    const prePossessDataReturn = [];
    const IndexFile: IIndexFile<Metadata> = await this.ImportFile(
      CommandObject.indexFile
    );
    const state = {
      breakPossess: false,
    };
    const CallBackInput: SubCommandInputCallBack<Metadata> = {
      client: this.client,
      type: 'message',
      message: message,
      MetaData: this.MetaData,
      args,
    };
    const setBreakPossess = (value: boolean) => {
      state.breakPossess = value;
    };
    if (IndexFile.PrePossessForAllCommand) {
      const args = await IndexFile.PrePossessForAllCommand(
        setBreakPossess,
        CallBackInput
      );
      if (state.breakPossess) {
        this.LogForMessageAndInteractionFunc(
          this.onInteractionCreate.name,
          `User ${message.member?.user.username} use command : '${commandName}' with sub command is: '${subCommandName}' has been break`
        );
        return;
      }
      if (args) prePossessDataReturn.push(...args);
    }
    const CommandFile: ISubCommand<Metadata> = await this.ImportFile(
      CommandObject[subCommandName]
    );
    if (!CommandFile) return;
    if (CommandFile.PrePossess) {
      const args = await CommandFile.PrePossess(
        setBreakPossess,
        CallBackInput,
        ...prePossessDataReturn
      );
      if (state.breakPossess) {
        this.LogForMessageAndInteractionFunc(
          this.onInteractionCreate.name,
          `User ${message.member?.user.username} use command : '${commandName}' with sub command is: '${subCommandName}' has been break`
        );
        return;
      }
      if (args) prePossessDataReturn.push(...args);
    }
    const data = await CommandFile.callBack(
      CallBackInput,
      ...prePossessDataReturn
    );
    const result =
      typeof data.data != 'object' && typeof data.data != 'string'
        ? `${data.data}`
        : data.data;
    if (result) {
      type MessageResultType = string | MessagePayload | MessageOptions;
      const MessageAfterRep = await message.channel.send(
        result as MessageResultType
      );
      data.MessageSuccess &&
        (await data.MessageSuccess(message, MessageAfterRep));
      this.LogForMessageAndInteractionFunc(
        this.onInteractionCreate.name,
        `User ${message.member?.user.username} use command : '${commandName}' with sub command is: '${subCommandName}' success`
      );
    }
  }
}
