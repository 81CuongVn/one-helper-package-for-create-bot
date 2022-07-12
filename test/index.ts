import { Client } from 'discord.js';
import dotenv from 'dotenv';
import path from 'path';
import { Log } from '../src/index';
dotenv.config({
  path: path.join(__dirname, './.env'),
});
import { allIntents } from './constants';
import { Command, SubCommand } from '../src/index';
import { MetaData } from './types/MetaDataType';

const client = new Client({
  intents: allIntents,
  partials: [
    'MESSAGE',
    'CHANNEL',
    'REACTION',
    'USER',
    'GUILD_MEMBER',
    'GUILD_SCHEDULED_EVENT',
  ],
});
const isDev = process.env.NODE_ENV !== 'production';
const command = new Command<MetaData>(client, {
  commandDir: path.join(__dirname, './commands'),
  owner: ['889140130105929769'],
  isDev,
  LogForMessageAndInteraction: true,
  metaData: {
    a: 1,
  },
  testServer: ['984361218393374761'],
  CustomPrefix: (message) => {
    return message.guild?.id === '984361218393374761' ? '!' : '.';
  },
});
const subCommand = new SubCommand<MetaData>({
  SubCommandPath: path.join(__dirname, './subCommand'),
  client,
  isDev,
  LogForMessageAndInteraction: true,
  metaData:{a:1}
});
client.on('ready', async () => {
  await command.init();
  await subCommand.init();
  // command.on(
  //   'startPossessOnMessageCreateEvent',
  //   ({ SetIsReplyMessage, message }) => {
  //     message.reply("I'm here!");
  //     SetIsReplyMessage(false);
  //   }
  // );
  // command.on('SuccessAddEvent', () => {});
  // const inviteLink = client.generateInvite({
  //   scopes: ['applications.commands', 'bot'],
  //   permissions: [Permissions.FLAGS.ADMINISTRATOR],
  // });
  // command.SetRpc({
  //   buttons: [
  //     {
  //       label: 'add bot',
  //       url: inviteLink,
  //     },
  //   ],
  // });
  // client.user?.setUsername('developers-bot-discord');
  Log.Log('Client', 'Ready to go! bot name :', client.user?.tag);
  // command.scanFileTsOrJsFile("./commands/")
});

// ko cần on message hay gì hết =))

client.login(process.env.BOT_KEY);
