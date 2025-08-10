import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create logs directory if it doesn't exist
import fs from 'fs';
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define which level to log based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Define different log formats
const format = winston.format.combine(
  // Add timestamp
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  // Add colors
  winston.format.colorize({ all: true }),
  // Define format of the message showing the timestamp, the level and the message
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Define which transports the logger must use to print out messages
const transports = [
  // Console transport
  new winston.transports.Console(),
  // File transport for errors
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
  }),
  // File transport for all logs
  new winston.transports.File({
    filename: path.join(logsDir, 'all.log'),
  }),
];

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
});

// Create a stream object for Morgan
logger.stream = {
  write: (message) => logger.http(message.trim()),
};

// Helper functions for different log types
const log = {
  error: (message, meta = {}) => {
    logger.error(message, meta);
  },
  
  warn: (message, meta = {}) => {
    logger.warn(message, meta);
  },
  
  info: (message, meta = {}) => {
    logger.info(message, meta);
  },
  
  http: (message, meta = {}) => {
    logger.http(message, meta);
  },
  
  debug: (message, meta = {}) => {
    logger.debug(message, meta);
  },
  
  // Specialized logging functions
  api: (method, path, statusCode, responseTime) => {
    logger.info(`API ${method} ${path} - ${statusCode} (${responseTime}ms)`);
  },
  
  auth: (action, user, success) => {
    const status = success ? 'SUCCESS' : 'FAILED';
    logger.info(`AUTH ${action} - ${user} - ${status}`);
  },
  
  oauth: (platform, action, user, success) => {
    const status = success ? 'SUCCESS' : 'FAILED';
    logger.info(`OAUTH ${platform} ${action} - ${user} - ${status}`);
  },
  
  database: (action, table, success) => {
    const status = success ? 'SUCCESS' : 'FAILED';
    logger.info(`DB ${action} ${table} - ${status}`);
  },
  
  webhook: (platform, action, success) => {
    const status = success ? 'SUCCESS' : 'FAILED';
    logger.info(`WEBHOOK ${platform} ${action} - ${status}`);
  },
  
  cache: (action, key, success) => {
    const status = success ? 'SUCCESS' : 'FAILED';
    logger.debug(`CACHE ${action} ${key} - ${status}`);
  },
  
  security: (event, details) => {
    logger.warn(`SECURITY ${event} - ${details}`);
  }
};

export default log; 