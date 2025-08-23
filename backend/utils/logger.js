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

// Logging utility to control log output and reduce Railway rate limits
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Get log level from environment, default to INFO in production
const getLogLevel = () => {
  const level = process.env.LOG_LEVEL?.toUpperCase() || 'INFO';
  return LOG_LEVELS[level] || LOG_LEVELS.INFO;
};

// Rate limiting for logs
const logCache = new Map();
const LOG_RATE_LIMIT = 1000; // 1 second between same log messages

const shouldLog = (message, level = 'INFO') => {
  const currentLevel = getLogLevel();
  const messageLevel = LOG_LEVELS[level] || LOG_LEVELS.INFO;
  
  // Check log level
  if (messageLevel > currentLevel) {
    return false;
  }
  
  // Rate limiting for non-error logs
  if (level !== 'ERROR') {
    const now = Date.now();
    const lastLog = logCache.get(message);
    
    if (lastLog && (now - lastLog) < LOG_RATE_LIMIT) {
      return false;
    }
    
    logCache.set(message, now);
    
    // Clean up old entries
    if (logCache.size > 100) {
      const cutoff = now - 60000; // 1 minute
      for (const [key, timestamp] of logCache.entries()) {
        if (timestamp < cutoff) {
          logCache.delete(key);
        }
      }
    }
  }
  
  return true;
};

const logger = {
  error: (message, ...args) => {
    if (shouldLog(message, 'ERROR')) {
      console.error(`❌ ${message}`, ...args);
    }
  },
  
  warn: (message, ...args) => {
    if (shouldLog(message, 'WARN')) {
      console.warn(`⚠️ ${message}`, ...args);
    }
  },
  
  info: (message, ...args) => {
    if (shouldLog(message, 'INFO')) {
      console.log(`ℹ️ ${message}`, ...args);
    }
  },
  
  debug: (message, ...args) => {
    if (shouldLog(message, 'DEBUG')) {
      console.log(`🔍 ${message}`, ...args);
    }
  },
  
  // Special method for startup messages (always logged)
  startup: (message, ...args) => {
    console.log(`🚀 ${message}`, ...args);
  },
  
  // Special method for critical errors (always logged)
  critical: (message, ...args) => {
    console.error(`💥 ${message}`, ...args);
  }
};

export default logger; 