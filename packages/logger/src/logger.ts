// packages/logger/src/logger.ts

import { ILogger } from '@modmanager/types';
import * as fs from 'fs';
import * as path from 'path';

export class FileLogger implements ILogger {
  private logPath: string;

  constructor(logDir: string) {
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    this.logPath = path.join(logDir, 'app.log');
  }

  private write(level: string, scope: string, message: string, meta?: any): void {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    const line = `[${timestamp}] [${level}] [${scope}] ${message}${metaStr}\n`;
    fs.appendFileSync(this.logPath, line);
  }

  debug(scope: string, message: string, meta?: any): void {
    this.write('DEBUG', scope, message, meta);
  }
  info(scope: string, message: string, meta?: any): void {
    this.write('INFO', scope, message, meta);
  }
  warn(scope: string, message: string, meta?: any): void {
    this.write('WARN', scope, message, meta);
  }
  error(scope: string, message: string, error?: any): void {
    const meta = error instanceof Error ? { message: error.message, stack: error.stack } : error;
    this.write('ERROR', scope, message, meta);
  }
}