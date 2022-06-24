import {
  CacheType,
  Client,
  CommandInteraction,
  CommandInteractionOption,
  CommandInteractionOptionResolver,
  Message,
} from 'discord.js';
import { ICommand } from '../types/CommandTypes';
import { Command } from '../';

export class BaseInputCallBack<MetaDataType> {
  constructor(
    public sessionId: string,
    public getAllCommand: () => {
      [key: string]: ICommand<MetaDataType>;
    },
    public client: Client,
    public CommandObject: Command<MetaDataType>,
    public type: 'interaction' | 'message',
    public MetaData?: MetaDataType
  ) {}
}
export class InputCallBackForInteraction<
  MetaData
> extends BaseInputCallBack<MetaData> {
  public Interaction: CommandInteraction<CacheType>;
  public RawOption: readonly CommandInteractionOption<CacheType>[];
  public option: Omit<
    CommandInteractionOptionResolver<CacheType>,
    'getMessage' | 'getFocused'
  >;
  public declare type: 'interaction';
  constructor(
    sessionId: string,
    getAllCommand: () => {
      [key: string]: ICommand<MetaData>;
    },
    client: Client,
    CommandObject: Command<MetaData>,
    Interaction: CommandInteraction<CacheType>,
    RawOption: readonly CommandInteractionOption<CacheType>[],
    option: Omit<
      CommandInteractionOptionResolver<CacheType>,
      'getMessage' | 'getFocused'
    >,
    MetaData?: MetaData
  ) {
    super(
      sessionId,
      getAllCommand,
      client,
      CommandObject,
      'interaction',
      MetaData
    );
    this.Interaction = Interaction;
    this.RawOption = RawOption;
    this.option = option;
  }
}
export class InputCallBackForMessage<MetaData> extends BaseInputCallBack<MetaData> {
  public args: string[];
  public Message: Message<boolean>;
  public declare type: 'message';
  constructor(
    sessionId: string,
    getAllCommand: () => { [key: string]: ICommand<MetaData> },
    client: Client<boolean>,
    CommandObject: Command<MetaData>,
    args: string[],
    Message: Message<boolean>,
    MetaData?: MetaData
  ) {
    super(sessionId, getAllCommand, client, CommandObject, 'message', MetaData);
    this.args = args;
    this.Message = Message;
  }
}
