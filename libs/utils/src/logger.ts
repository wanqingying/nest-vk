import { Injectable } from '@nestjs/common';
import { format } from 'date-fns';

@Injectable()
export class NestLogger {
  private prefix: string;
  constructor(prefix?: string) {
    this.prefix = prefix || 'Log';
  }
  //   public getPrefix():string{

  //   }
  public log(...args: any[]): void {
    console.log(...args);
  }
  public error(...args: any[]): void {
    console.error(...args);
  }
  public warn(...args: any[]): void {
    console.warn(...args);
  }
  public debug(...args: any[]): void {
    console.debug(...args);
  }

  public static log(...args: any[]): void {
    // const timeStr = new Date().toUTCString();
    // time str 2025/02/03 12:23:34 224
    const timeStr = format(new Date(), 'yyyy/MM/dd HH:mm:ss SSS');

    console.log(`[${timeStr}]`, ...args);
  }
}
