# **document**

## **requirements**

- discord.js
- node.js(16.x)
- python >= 3.10

## **setup**

```ts
import { Client } from 'discord.js';
import { Command } from 'helper-package-create-discord-bot';
const client = new Client({
    intent: <your Intent>,
});

const isDev = process.env.NODE_ENV !== 'production';
type MetaData = {};
const command = new Command<MetaData>(client, {
    commandDir: path.join(__dirname, './commands'),
    owner: ['889140130105929769'],
    isDev,
    LogForMessageAndInteraction: isDev,
    metaData: {
    },
  });
client.on('ready', async () => {
  command.init();
  console.Log('Client', 'Ready to go! bot name :', client.user?.tag);
});


client.login(<your token>);
```
