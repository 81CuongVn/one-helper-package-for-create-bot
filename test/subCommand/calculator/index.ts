import { IIndexFile } from '../../../src';
import path from 'path';
import { Constants } from 'discord.js';
import { MetaData } from '../../types/MetaDataType';

const config: IIndexFile<MetaData> = {
  name: 'calculator',
  description: 'calculator',
  slash: true,
  message: true,
  SubFile: [
    path.join(__dirname, './division.ts'),
    path.join(__dirname, './multiplication.ts'),
    path.join(__dirname, './subtraction.ts'),
    path.join(__dirname, './sum.ts'),
  ],
  defaultOption: {},
  optionForAllCommand: [
    {
      name: 'first_num',
      type: Constants.ApplicationCommandOptionTypes.INTEGER,
      description: 'type the first num',
      required: true,
    },
    {
      name: 'second_num',
      type: Constants.ApplicationCommandOptionTypes.INTEGER,
      description: 'type the second num',
      required: true,
    },
  ],
  aliases: [
   "cal"
 ]
};
export default config;

