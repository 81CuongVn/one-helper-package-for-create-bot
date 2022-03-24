import moment from 'moment';
import { ICommand } from '../../../src/';

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

  callback: async ({ client, CommandObject, sessionId: CommandSessionId }) => {
    // console.log(getAllCommand())
    // if (InteractionOrMessage instanceof Message) {
    //   console.log(InteractionOrMessage.author.username);
    // }
    CommandObject.on(
      'SuccessPossessOnMessageCreateEvent',
      ({ messageAfterSend: messageSend, sessionId }) => {
        if (sessionId === CommandSessionId) {
          messageSend.react('🇵');
          messageSend.react('🇴');
          messageSend.react('🇳');
          messageSend.react('🇬');
        }
      }
    );
    return `Pong! ${client.ws.ping}ms`;
  },
} as ICommand;
