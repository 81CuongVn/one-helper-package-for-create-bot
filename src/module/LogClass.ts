export class Log {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static Log(processName: string, ...rest: any) {
    const logTime = new Date().toLocaleString();
    console.log(`[${logTime}]`, `[${processName}] : `, ...rest);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static Error(processName: string, ...rest: any) {
    const logTime = new Date().toLocaleString();
    console.error(`[${logTime}]`, `[${processName}] : `, ...rest);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static Warn(processName: string, ...rest: any) {
    const logTime = new Date().toLocaleString();
    console.warn(`[${logTime}]`, `[${processName}] : `, ...rest);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static debug(processName: string, ...rest: any) {
    const logTime = new Date().toLocaleString();
    console.log(`[${logTime}]`, `[${processName}] : `, ...rest);
  }
}
