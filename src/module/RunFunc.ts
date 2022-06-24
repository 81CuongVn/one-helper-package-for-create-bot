import { callbackFunc, InputCallBack } from '../types/CommandTypes';

export class RunFunc<Metadata> {
  constructor(public AlwayRunFunc?: callbackFunc<Metadata>) {}
  async run(input: InputCallBack<Metadata>,func?:callbackFunc<Metadata>) {
      if (this.AlwayRunFunc) await this.AlwayRunFunc(input);
      if (func) return await func(input)
  }
}
