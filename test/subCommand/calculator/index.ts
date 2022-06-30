import { IIndexFile } from "../../../src";
import path from "path"

const config: IIndexFile = {
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
};
export default config;
