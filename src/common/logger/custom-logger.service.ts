import { ConsoleLogger, Injectable } from '@nestjs/common';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

@Injectable()
export class CustomLoggerService extends ConsoleLogger {
  private readonly logger: winston.Logger;

  constructor(context?: string) {
    super(context); // Call parent constructor
    this.logger = winston.createLogger({
      level: 'info', // Default logging level
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
          ),
          level: 'debug', // Console shows debug and above
        }),
        new winston.transports.DailyRotateFile({
          filename: 'logs/application-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m', // Rotate file if it exceeds 20MB
          maxFiles: '14d', // Keep logs for 14 days
          level: 'info', // File logs info and above
        }),
        new winston.transports.DailyRotateFile({
          filename: 'logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
          level: 'error', // Error logs only errors
        }),
      ],
      exceptionHandlers: [
        new winston.transports.DailyRotateFile({
          filename: 'logs/exceptions-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
        }),
      ],
    });
  }

  log(message: any, context?: string) {
    this.logger.info(message, { context: context || this.context });
    super.log(message, context); // Also log to console via parent
  }

  error(message: any, trace?: string, context?: string) {
    this.logger.error(message, { context: context || this.context, trace });
    super.error(message, trace, context);
  }

  warn(message: any, context?: string) {
    this.logger.warn(message, { context: context || this.context });
    super.warn(message, context);
  }

  debug(message: any, context?: string) {
    this.logger.debug(message, { context: context || this.context });
    super.debug(message, context);
  }

  verbose(message: any, context?: string) {
    this.logger.verbose(message, { context: context || this.context });
    super.verbose(message, context);
  }

  setContext(context: string) {
    this.context = context;
  }
}
