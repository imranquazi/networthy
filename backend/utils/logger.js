// Simple logging utility to control log output and reduce Railway rate limits
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Get log level from environment, default to WARN in production
const getLogLevel = () => {
  const level = process.env.LOG_LEVEL?.toUpperCase() || 'WARN';
  return LOG_LEVELS[level] || LOG_LEVELS.WARN;
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