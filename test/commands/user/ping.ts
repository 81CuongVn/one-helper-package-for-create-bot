import { Constants } from 'discord.js';
import moment from 'moment';
import { ICommand } from '../../types/CommandTypes';

export default {
  category: 'user',
  description: 'Reply to the user with a message',
  name: 'ping',

  isSlash: true,

  aliases: ['p'],
  permission: ['SEND_MESSAGES'],
  coolDown: moment.duration(10, 'seconds').asMilliseconds(),
  options: [
    {
      name: 'searchKey'.toLocaleLowerCase(),
      description: 'nhập từ khoá',
      type: Constants.ApplicationCommandOptionTypes.STRING,
      required: true,
    },
  ],
  OnlyOwner:true,

  callback: async ({ client , RawOption , args}) => {
    // console.log(getAllCommand())
    // if (InteractionOrMessage instanceof Message) {
    //   console.log(InteractionOrMessage.author.username);
    // }
    return `Pong! ${client.ws.ping}ms`;
  },
} as ICommand;
