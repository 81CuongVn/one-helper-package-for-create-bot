/* eslint-disable @typescript-eslint/no-explicit-any */
export class Log {
  public static Log(processName: string, ...rest: any) {
    console.log(`[${processName}] : `, ...rest);
  }

  public static Error(processName: string, ...rest: any) {
    console.error(`[${processName}] : `, ...rest);
  }

  public static Warn(processName: string, ...rest: any) {
    console.warn(`[${processName}] : `, ...rest);
  }

  public static debug(processName: string, ...rest: any) {
    console.log(`[${processName}] : `, ...rest);
  }
  public static logClass(className: string, processName: string, ...rest: any) {
    console.log(`[${className}][${processName}] : `, ...rest);
    
  }
}
