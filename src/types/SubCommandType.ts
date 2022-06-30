import {
  ApplicationCommandAutocompleteOption,
  ApplicationCommandChannelOptionData,
  ApplicationCommandChoicesData,
  ApplicationCommandNonOptionsData,
  ApplicationCommandNumericOptionData,
  ChatInputApplicationCommandData,
} from 'discord.js/typings/index';

export interface IIndexFile {
  name: string;
  slash: boolean;
  message: boolean;
  SubFile: string[];
  defaultOption: {
    name?: string;
    description?: string;
  };
  description: string;
}
export interface ISubCommand extends ChatInputApplicationCommandData {
  options?: (
    | ApplicationCommandNonOptionsData
    | ApplicationCommandChannelOptionData
    | ApplicationCommandChoicesData
    | ApplicationCommandAutocompleteOption
    | ApplicationCommandNumericOptionData
  )[];

}