// Override console methods globally - store them first
const originalMethods = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug,
  trace: console.trace,
  table: console.table,
  group: console.group,
  groupEnd: console.groupEnd,
  groupCollapsed: console.groupCollapsed,
  clear: console.clear,
  count: console.count,
  countReset: console.countReset,
  time: console.time,
  timeEnd: console.timeEnd,
  timeLog: console.timeLog,
  assert: console.assert,
  dir: console.dir,
  dirxml: console.dirxml
};

// Simple and reliable console blocking for non-admin users
let adminAccess = false; // Start with NO ACCESS
let initialized = false;

// Set admin access
export const setAdminAccess = (isAdmin: boolean, userEmail: string) => {
  const newAdminAccess = isAdmin || userEmail === 'admin@valant.com' || userEmail === 'meenal@valant.com';

  // If admin user detected, restore original console completely
  if (newAdminAccess && !adminAccess) {
    originalMethods.log('🔧 ADMIN DETECTED - Restoring full console access...');

    // Restore original console methods completely for admin
    console.log = originalMethods.log;
    console.error = originalMethods.error;
    console.warn = originalMethods.warn;
    console.info = originalMethods.info;
    console.debug = originalMethods.debug;
    console.trace = originalMethods.trace;
    console.table = originalMethods.table;
    console.group = originalMethods.group;
    console.groupEnd = originalMethods.groupEnd;
    console.groupCollapsed = originalMethods.groupCollapsed;
    console.clear = originalMethods.clear;
    console.count = originalMethods.count;
    console.countReset = originalMethods.countReset;
    console.time = originalMethods.time;
    console.timeEnd = originalMethods.timeEnd;
    console.timeLog = originalMethods.timeLog;
    console.assert = originalMethods.assert;
    console.dir = originalMethods.dir;
    console.dirxml = originalMethods.dirxml;

    console.log('✅ ADMIN CONSOLE FULLY RESTORED - All logging should work now!');
  }

  adminAccess = newAdminAccess;
};

// Check if user has admin access
export const hasAdminAccess = () => adminAccess;

// Debug function to manually enable console (temporary)
export const enableConsoleForTesting = () => {
  adminAccess = true;
  // Don't log anything here
};

// Make this available globally for debugging
(window as any).enableConsole = enableConsoleForTesting;
(window as any).checkAdminAccess = () => {
  originalMethods.log('🔍 Current admin access status:', adminAccess);
  return adminAccess;
};
(window as any).forceAdminAccess = (force: boolean = true) => {
  adminAccess = force;
  originalMethods.log('🔧 Admin access forcefully set to:', adminAccess);
};
(window as any).debugConsoleState = () => {
  originalMethods.log('🔍 Console Debug State:', {
    adminAccess,
    initialized,
    authDebug: (window as any).authDebug,
    timestamp: new Date().toISOString()
  });
};

// Initialize console blocking
export const initConsoleBlock = () => {
  if (initialized) return;

  // Initialize silently - no logging

  // Override console methods with admin check
  console.log = (...args: any[]) => {
    if (adminAccess) {
      originalMethods.log(...args);
    }
    // Completely silent for non-admin users
  };

  console.error = (...args: any[]) => {
    if (adminAccess) {
      originalMethods.error(...args);
    }
  };

  console.warn = (...args: any[]) => {
    if (adminAccess) {
      originalMethods.warn(...args);
    }
  };

  console.info = (...args: any[]) => {
    if (adminAccess) {
      originalMethods.info(...args);
    }
  };

  console.debug = (...args: any[]) => {
    if (adminAccess) {
      originalMethods.debug(...args);
    }
  };

  console.trace = (...args: any[]) => {
    if (adminAccess) {
      originalMethods.trace(...args);
    }
  };

  console.table = (...args: any[]) => {
    if (adminAccess) {
      originalMethods.table(...args);
    }
  };

  console.group = (...args: any[]) => {
    if (adminAccess) {
      originalMethods.group(...args);
    }
  };

  console.groupEnd = () => {
    if (adminAccess) {
      originalMethods.groupEnd();
    }
  };

  console.groupCollapsed = (...args: any[]) => {
    if (adminAccess) {
      originalMethods.groupCollapsed(...args);
    }
  };

  console.clear = () => {
    if (adminAccess) {
      originalMethods.clear();
    }
  };

  console.count = (...args: any[]) => {
    if (adminAccess) {
      originalMethods.count(...args);
    }
  };

  console.countReset = (...args: any[]) => {
    if (adminAccess) {
      originalMethods.countReset(...args);
    }
  };

  console.time = (...args: any[]) => {
    if (adminAccess) {
      originalMethods.time(...args);
    }
  };

  console.timeEnd = (...args: any[]) => {
    if (adminAccess) {
      originalMethods.timeEnd(...args);
    }
  };

  console.timeLog = (...args: any[]) => {
    if (adminAccess) {
      originalMethods.timeLog(...args);
    }
  };

  console.assert = (...args: any[]) => {
    if (adminAccess) {
      originalMethods.assert(...args);
    }
  };

  console.dir = (...args: any[]) => {
    if (adminAccess) {
      originalMethods.dir(...args);
    }
  };

  console.dirxml = (...args: any[]) => {
    if (adminAccess) {
      originalMethods.dirxml(...args);
    }
  };

  initialized = true;
  // Console blocked for everyone by default
};