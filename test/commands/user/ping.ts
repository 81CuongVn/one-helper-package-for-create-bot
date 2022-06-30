import moment from 'moment';
import { ICommand } from '../../../src/';
import { MetaData } from '../../types/MetaDataType';

export default {
  category: 'user',
  description: 'Reply to the user with a message',
  name: 'ping',

  isSlash: true,

  aliases: ['p'],
  permission: ['SEND_MESSAGES'],
  coolDown: moment.duration(10, 'seconds').asMilliseconds(),
  options: [],
  OnlyOwner: true,
  DeferReply: false,
  testCommand: true,
  callback: async (input) => {
    // console.log(getAllCommand())
    // if (InteractionOrMessage instanceof Message) {
    //   console.log(InteractionOrMessage.author.username);
    // }
    const {
      CommandObject,
      sessionId: CommandSessionId,
      MetaData,
      client,
      type,
    } = input;
    if (type == 'message') {
      console.log(input.Message.content);
    } else {
      console.log(input.Interaction.commandName);
    }

    CommandObject.on(
      'SuccessPossessOnMessageCreateEvent',
      ({ messageAfterSend: messageSend, sessionId }) => {
        if (sessionId === CommandSessionId) {
          messageSend.react('🇵');
          messageSend.react('🇴');
          messageSend.react('🇳');
          messageSend.react('🇬');
          console.log(sessionId);
        }
      }
    );
    console.log(MetaData?.a);
    return `Pong! ${client.ws.ping}ms`;
  },
} as ICommand<MetaData>;
