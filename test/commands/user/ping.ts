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

  callback: async ({
    client,
    CommandObject,
    sessionId: CommandSessionId,
    MetaData,
  }) => {
    // console.log(getAllCommand())
    // if (InteractionOrMessage instanceof Message) {
    //   console.log(InteractionOrMessage.author.username);
    // }
    CommandObject.on(
      'SuccessPossessOnMessageCreateEvent',
      ({ messageAfterSend: messageSend, sessionId , MetaData}) => {
        if (sessionId === CommandSessionId) {
          messageSend.react('🇵');
          messageSend.react('🇴');
          messageSend.react('🇳');
          messageSend.react('🇬');
          console.log(MetaData.a);
        }
      }
    );
    console.log(MetaData.a);
    return `Pong! ${client.ws.ping}ms`;
  },
} as ICommand<MetaData>;
