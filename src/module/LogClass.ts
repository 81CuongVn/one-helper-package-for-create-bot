/* eslint-disable @typescript-eslint/no-explicit-any */
export class Log {
  public static Log(processName: string, ...rest: any) {
    const logTime = new Date().toLocaleString();
    console.log(`[${logTime}]`, `[${processName}] : `, ...rest);
  }

  public static Error(processName: string, ...rest: any) {
    const logTime = new Date().toLocaleString();
    console.error(`[${logTime}]`, `[${processName}] : `, ...rest);
  }

  public static Warn(processName: string, ...rest: any) {
    const logTime = new Date().toLocaleString();
    console.warn(`[${logTime}]`, `[${processName}] : `, ...rest);
  }

  public static debug(processName: string, ...rest: any) {
    const logTime = new Date().toLocaleString();
    console.log(`[${logTime}]`, `[${processName}] : `, ...rest);
  }
}
