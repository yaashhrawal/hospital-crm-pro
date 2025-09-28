// Simple logging utility that uses console directly
// The console blocking is handled at the console level, not here
export const setLoggerPermissions = (userIsAdmin: boolean, userEmail: string) => {
  // No longer needed - console blocking handles this
};

export const logger = {
  log: (...args: any[]) => {
    // Let console blocking handle admin access - just use console directly
    console.log(...args);
  },
  error: (...args: any[]) => {
    // Let console blocking handle admin access - just use console directly
    console.error(...args);
  },
  warn: (...args: any[]) => {
    // Let console blocking handle admin access - just use console directly
    console.warn(...args);
  },
  info: (...args: any[]) => {
    // Let console blocking handle admin access - just use console directly
    console.info(...args);
  }
};

// For critical errors that should always be logged
export const criticalLogger = {
  error: (...args: any[]) => {
    console.error(...args);
  }
};