// Console blocking utility for non-admin users
let originalConsole: any = {};
let isConsoleBlocked = false;
let isConsoleStored = false;

// Store original console methods safely
const storeOriginalConsole = () => {
  if (isConsoleStored) return;

  try {
    // Store original methods
    originalConsole = {
      log: console.log.bind(console),
      error: console.error.bind(console),
      warn: console.warn.bind(console),
      info: console.info.bind(console),
      debug: console.debug.bind(console),
      trace: console.trace.bind(console),
      table: console.table.bind(console),
      group: console.group.bind(console),
      groupEnd: console.groupEnd.bind(console),
      groupCollapsed: console.groupCollapsed.bind(console),
      clear: console.clear.bind(console),
      count: console.count.bind(console),
      countReset: console.countReset.bind(console),
      time: console.time.bind(console),
      timeEnd: console.timeEnd.bind(console),
      timeLog: console.timeLog.bind(console),
      assert: console.assert.bind(console),
      dir: console.dir.bind(console),
      dirxml: console.dirxml.bind(console)
    };
    isConsoleStored = true;
  } catch (e) {
    // Fallback if binding fails
    originalConsole = { ...console };
    isConsoleStored = true;
  }
};

// Block console for non-admin users
export const blockConsole = () => {
  if (isConsoleBlocked) return;

  storeOriginalConsole();

  const noop = () => {};

  try {
    // Use Object.defineProperty for better control
    const consoleMethods = [
      'log', 'error', 'warn', 'info', 'debug', 'trace', 'table',
      'group', 'groupEnd', 'groupCollapsed', 'clear', 'count',
      'countReset', 'time', 'timeEnd', 'timeLog', 'assert', 'dir', 'dirxml'
    ];

    consoleMethods.forEach(method => {
      try {
        Object.defineProperty(console, method, {
          value: noop,
          writable: true,
          configurable: true
        });
      } catch (e) {
        // Fallback for read-only properties
        try {
          (console as any)[method] = noop;
        } catch (e2) {
          // If all else fails, ignore this method
        }
      }
    });

    isConsoleBlocked = true;
  } catch (e) {
    // If blocking fails entirely, at least try direct assignment
    try {
      console.log = noop;
      console.error = noop;
      console.warn = noop;
      console.info = noop;
      isConsoleBlocked = true;
    } catch (e2) {
      // Complete fallback - console cannot be blocked
    }
  }
};

// Restore console for admin users
export const restoreConsole = () => {
  if (!isConsoleBlocked || !isConsoleStored) return;

  try {
    const consoleMethods = [
      'log', 'error', 'warn', 'info', 'debug', 'trace', 'table',
      'group', 'groupEnd', 'groupCollapsed', 'clear', 'count',
      'countReset', 'time', 'timeEnd', 'timeLog', 'assert', 'dir', 'dirxml'
    ];

    consoleMethods.forEach(method => {
      if (originalConsole[method]) {
        try {
          Object.defineProperty(console, method, {
            value: originalConsole[method],
            writable: true,
            configurable: true
          });
        } catch (e) {
          // Fallback for read-only properties
          try {
            (console as any)[method] = originalConsole[method];
          } catch (e2) {
            // If restoration fails, ignore this method
          }
        }
      }
    });

    isConsoleBlocked = false;
  } catch (e) {
    // If restoration fails entirely, try direct assignment
    try {
      console.log = originalConsole.log || (() => {});
      console.error = originalConsole.error || (() => {});
      console.warn = originalConsole.warn || (() => {});
      console.info = originalConsole.info || (() => {});
      isConsoleBlocked = false;
    } catch (e2) {
      // Complete fallback - reload page to restore console
      setTimeout(() => window.location.reload(), 100);
    }
  }
};

// Set console access based on admin status
export const setConsoleAccess = (isAdmin: boolean, userEmail: string) => {
  const hasAccess = isAdmin || userEmail === 'admin@valant.com' || userEmail === 'meenal@valant.com';

  if (hasAccess) {
    restoreConsole();
  } else {
    blockConsole();
  }
};