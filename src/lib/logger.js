const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'secret',
  'token',
  'auth_secret',
  'authorization',
  'cookie',
]);

/**
 * Recursively redacts sensitive keys from log context objects
 * @param {any} obj
 * @returns {any}
 */
function sanitizeContext(obj, depth = 0) {
  if (depth > 5 || obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeContext(item, depth + 1));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeContext(value, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLogLevel =
  process.env.LOG_LEVEL?.toLowerCase() in LOG_LEVELS
    ? LOG_LEVELS[process.env.LOG_LEVEL.toLowerCase()]
    : process.env.NODE_ENV === 'production'
      ? LOG_LEVELS.info
      : LOG_LEVELS.debug;

function formatLog(level, message, context) {
  const timestamp = new Date().toISOString();
  const entry = {
    timestamp,
    level,
    message,
  };

  if (context && Object.keys(context).length > 0) {
    entry.context = sanitizeContext(context);
  }

  if (process.env.NODE_ENV === 'production') {
    return JSON.stringify(entry);
  }

  const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
}

export const logger = {
  debug(message, context = {}) {
    if (currentLogLevel <= LOG_LEVELS.debug) {
      console.debug(formatLog('debug', message, context));
    }
  },

  info(message, context = {}) {
    if (currentLogLevel <= LOG_LEVELS.info) {
      console.info(formatLog('info', message, context));
    }
  },

  warn(message, context = {}) {
    if (currentLogLevel <= LOG_LEVELS.warn) {
      console.warn(formatLog('warn', message, context));
    }
  },

  error(message, error = null, context = {}) {
    if (currentLogLevel <= LOG_LEVELS.error) {
      const errorContext = {
        ...context,
        errorMessage: error?.message || String(error),
        errorCode: error?.code,
      };
      if (process.env.NODE_ENV !== 'production' && error?.stack) {
        errorContext.stack = error.stack;
      }
      console.error(formatLog('error', message, errorContext));
    }
  },
};
