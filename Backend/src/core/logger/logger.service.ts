import { Injectable, Logger, Scope, Headers } from '@nestjs/common';
import moment from 'moment';
import * as winston from 'winston';
import * as os from 'os';
import DailyRotateFile = require('winston-daily-rotate-file');
// import * as s3_streamLogger from "s3-streamlogger"; // Requires ENV Variable `BUCKET_NAME`
const hostname = os.hostname();
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';

dotenv.config();
const config = new ConfigService();

let log_config = {
  LOG_LEVEL: config.get('LOG_LEVEL') || `debug`,
  SERVICE_NAME: config.get('SERVICE_NAME') || 'college_dunia',
  LOG_DIRECTORY_LOCATION: config.get('LOG_DIRECTORY_LOCATION') || `./logs/`,
  LOG_IN_GMT_TIMESTAMP: config.get('LOG_IN_GMT_TIMESTAMP') || `TRUE`,
};
const log_level = log_config.LOG_LEVEL;
const service = log_config.SERVICE_NAME;
const logDirectory = log_config.LOG_DIRECTORY_LOCATION;
const GMT_LOGGING = log_config.LOG_IN_GMT_TIMESTAMP;

@Injectable({ scope: Scope.TRANSIENT })
export class CustomLogger extends Logger {
  constructor(context: string = '') {
    super();
    this.context = context;
  }

  setContext(context: string) {
    this.context = `[${context}] `;
  }

  getContext() {
    return this.context;
  }

  log(correlation_id: string, message, ...params) {
    const log_body = combineMessageAndParamsNew(this.context, message, params);
    winstonLogger.info(
      `${combineMessageAndParamsNew(this.context, message, params)}`,

      {
        correlation_id: correlation_id,
        ...log_body,
      },
    );
  }

  info(correlation_id: string, message, ...params) {
    const log_body = combineMessageAndParamsNew(this.context, message, params);
    winstonLogger.info(
      `${combineMessageAndParamsNew(this.context, message, params)}`,

      {
        correlation_id: correlation_id,
        ...log_body,
      },
    );
  }

  debug(correlation_id: string, message, ...params) {
    const log_body = combineMessageAndParamsNew(this.context, message, params);
    winstonLogger.debug(
      `${combineMessageAndParamsNew(this.context, message, params)}`,

      {
        correlation_id: correlation_id,
        ...log_body,
      },
    );
  }

  warn(correlation_id: string, message, ...params) {
    const log_body = combineMessageAndParamsNew(this.context, message, params);
    winstonLogger.warn(
      `${combineMessageAndParamsNew(this.context, message, params)}`,

      {
        correlation_id: correlation_id,
        ...log_body,
      },
    );
  }

  error(correlation_id: string, message, ...params) {
    const log_body = combineMessageAndParamsNew(this.context, message, params);
    winstonLogger.error(
      `${combineMessageAndParamsNew(this.context, message, params)}`,

      {
        correlation_id: correlation_id,
        ...log_body,
      },
    );
  }

  verbose(correlation_id: string, message, ...params) {
    const log_body = combineMessageAndParamsNew(this.context, message, params);
    winstonLogger.verbose(
      `${combineMessageAndParamsNew(this.context, message, params)}`,

      {
        correlation_id: correlation_id,
        ...log_body,
      },
    );
  }
}

const combineMessageAndParams = (message, params: string | any[]): string => {
  if (params.length > 0) {
    for (let i = 0; i < params.length; i++) {
      if (typeof params[i] === 'string' || typeof params[i] === 'number') {
        message += ` ${params[i]}`;
      } else if (params[i] instanceof Error) {
        message += ` ERROR Message[${params[i].message}] StackTrace[${params[i].stack}]`;
      } else {
        message += ` ${JSON.stringify(params[i])}`;
      }
    }
  }
  return message;
};

const combineMessageAndParamsNew = (
  context: string | undefined,
  message,
  params: string | any[],
) => {
  const log_body = {
    context,
    message,
    params,
  };

  return log_body;

  // if (params.length > 0) {
  //   for (let i = 0; i < params.length; i++) {
  //     if (typeof params[i] === "string" || typeof params[i] === "number") {
  //       message += ` ${params[i]}`;
  //     } else if (params[i] instanceof Error) {
  //       message += ` ERROR Message[${params[i].message}] StackTrace[${params[i].stack}]`;
  //     } else {
  //       message += ` ${JSON.stringify(params[i])}`;
  //     }
  //   }
  // }
  // return message;
};

const customTimeStamp = () => {
  if (GMT_LOGGING.toLowerCase() == `false`) {
    return moment().format('YYYY-MM-DD HH:mm:ss.SSSZ'); // 2020-03-15 16:56:11.868 +08:00
  } else {
    return moment().utc().format('YYYY-MM-DD HH:mm:ss.SSSZ'); // 2020-03-15 08:55:58.596 +00:00
  }
};

const customTimeStampConsole = () => {
  return moment().format('YYYY-MM-DD HH:mm:ss.SSS'); // 2020-03-15 08:55:58.596  (Local Time)
};

const format = winston.format.combine(
  winston.format.timestamp({
    format: customTimeStamp,
  }),
  winston.format.splat(),
  winston.format.json(),
);

let formatConsole = winston.format.combine(
  winston.format.colorize({
    all: true,
  }),
  winston.format.timestamp({
    format: customTimeStampConsole,
  }),
  winston.format.splat(),
  winston.format.json(),
  winston.format.printf(
    ({ timestamp, correlation_id = '', level, message }) => {
      let print_level = level.replace(
        /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
        '',
      );
      print_level = print_level.toUpperCase();
      print_level = print_level.substring(0, 4);
      return `${timestamp} | ${(correlation_id as string).substring(
        0,
        6,
      )} | ${print_level} | ${message}`;
    },
  ),
);
if (config.get('ENV') == 'LOCAL') {
  formatConsole = winston.format.combine(
    formatConsole,
    winston.format.printf(
      ({ timestamp, correlation_id = '', level, message }) => {
        let print_level = level.replace(
          /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
          '',
        );
        print_level = print_level.toUpperCase();
        print_level = print_level.substring(0, 4);
        return `${timestamp} | ${(correlation_id as string).substring(
          0,
          6,
        )} | ${print_level} | ${message}`;
      },
    ),
  );
}

const logFile = logDirectory + `${service}.log`;
const logErrorFile = logDirectory + `${service}-error.log`;
// const s3StreamLogger = s3_streamLogger.S3StreamLogger;
// const s3stream = new s3StreamLogger({
//   bucket: aws_log_creds.logBucket,
//   folder: "logs",
//   access_key_id: aws_log_creds.awsS3AccessKey,
//   secret_access_key: aws_log_creds.awsS3SecretAccessKey
// });
// s3stream.on("error", function (err) {
//   // there was an error!
//   console.log("error", "logging transport error", err);
// });

const options = {
  combinedFile: {
    level: log_level,
    handleExceptions: true,
    json: true,
    colorize: false,
    format,
    filename: `${logDirectory}${service}-%DATE%.log`,
    datePattern: 'YYYY-MM-DD-HH',
    zippedArchive: true,
    // maxSize: "20m",
    maxFiles: '14d',
    utc: true,
    createSymlink: true,
    symlinkName: `${service}.current.log`,
  },
  errorFile: {
    level: `error`,
    handleExceptions: true,
    json: true,
    colorize: false,
    format,
    filename: `${logDirectory}${service}-%DATE%-error.log`,
    datePattern: 'YYYY-MM-DD-HH',
    zippedArchive: true,
    // maxSize: "20m",
    maxFiles: '14d',
    utc: true,
    createSymlink: true,
    symlinkName: `${service}-error.current.log`,
  },
  console: {
    level: log_level,
    json: true,
    format,
    handleExceptions: true,
    colorize: true,
    utc: true,
  },
  // stream: { stream: s3stream }
};

let winstonOutputPlugins = [
  // - Write all logs with level `error` and below to `error.log`
  new DailyRotateFile(options.errorFile),

  // - Write all logs with level `info` and below to `combined.log`
  new DailyRotateFile(options.combinedFile),

  // - Write all logs to `console` as well
  new winston.transports.Console(options.console),

  // new winston.transports.Stream(options.stream),
];

const winstonLogger = winston.createLogger({
  level: log_level,
  defaultMeta: {
    service,
    hostname,
    pid: global.process.pid,
  },
  transports: winstonOutputPlugins,
  exitOnError: false, // do not exit on handled exceptions
});
