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

  callback: async ({ client }) => {
    // console.log(getAllCommand())
    // if (InteractionOrMessage instanceof Message) {
    //   console.log(InteractionOrMessage.author.username);
    // }
    return `Pong! ${client.ws.ping}ms`;
  },
} as ICommand;
