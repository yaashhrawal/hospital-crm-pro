// Robust console blocking system that handles all scenarios
let currentUserIsAdmin = false;
let consoleIsInitialized = false;

// Store REAL original console methods immediately at module load
const ORIGINAL_CONSOLE = {
  log: Function.prototype.bind.call(console.log, console),
  error: Function.prototype.bind.call(console.error, console),
  warn: Function.prototype.bind.call(console.warn, console),
  info: Function.prototype.bind.call(console.info, console),
  debug: Function.prototype.bind.call(console.debug, console),
  trace: Function.prototype.bind.call(console.trace, console),
  table: Function.prototype.bind.call(console.table, console),
  group: Function.prototype.bind.call(console.group, console),
  groupEnd: Function.prototype.bind.call(console.groupEnd, console),
  groupCollapsed: Function.prototype.bind.call(console.groupCollapsed, console),
  clear: Function.prototype.bind.call(console.clear, console)
};

// Admin-aware console wrapper function
const createConsoleMethod = (originalMethod: Function) => {
  return (...args: any[]) => {
    if (currentUserIsAdmin) {
      // Admin users get full console access
      originalMethod(...args);
    }
    // Non-admin users get nothing (completely silent)
  };
};

// Initialize console blocking immediately
export const initializeConsoleBlocking = () => {
  if (consoleIsInitialized) return;

  try {
    // Override all console methods with admin-aware versions
    console.log = createConsoleMethod(ORIGINAL_CONSOLE.log);
    console.error = createConsoleMethod(ORIGINAL_CONSOLE.error);
    console.warn = createConsoleMethod(ORIGINAL_CONSOLE.warn);
    console.info = createConsoleMethod(ORIGINAL_CONSOLE.info);
    console.debug = createConsoleMethod(ORIGINAL_CONSOLE.debug);
    console.trace = createConsoleMethod(ORIGINAL_CONSOLE.trace);
    console.table = createConsoleMethod(ORIGINAL_CONSOLE.table);
    console.group = createConsoleMethod(ORIGINAL_CONSOLE.group);
    console.groupEnd = createConsoleMethod(ORIGINAL_CONSOLE.groupEnd);
    console.groupCollapsed = createConsoleMethod(ORIGINAL_CONSOLE.groupCollapsed);
    console.clear = createConsoleMethod(ORIGINAL_CONSOLE.clear);

    consoleIsInitialized = true;
  } catch (error) {
    // Fallback if console override fails
    ORIGINAL_CONSOLE.error('Failed to initialize console blocking:', error);
  }
};

// Clear console for non-admin users
const clearConsoleForNonAdmin = () => {
  if (!currentUserIsAdmin) {
    try {
      // Multiple methods to clear console
      if (console.clear) {
        console.clear();
      }

      // Additional clearing methods
      if ((console as any).API) {
        (console as any).API.clear();
      }

      // Try to clear using different approaches
      setTimeout(() => {
        if (!currentUserIsAdmin && console.clear) {
          console.clear();
        }
      }, 100);
    } catch (e) {
      // Ignore clearing errors
    }
  }
};

// Set user status and manage console access
export const setUserStatus = (isAdmin: boolean, userEmail: string) => {
  const wasAdminBefore = currentUserIsAdmin;

  // Handle empty/null userEmail as non-admin
  const validEmail = userEmail || '';
  currentUserIsAdmin = isAdmin && validEmail && (validEmail === 'admin@valant.com' || validEmail === 'meenal@valant.com');

  // Initialize console blocking if not done
  initializeConsoleBlocking();

  if (currentUserIsAdmin) {
    // Admin user - restore full console and show confirmation
    ORIGINAL_CONSOLE.log('✅ Admin user detected - full console access enabled');
    ORIGINAL_CONSOLE.log('🔧 All console methods are now active for admin user');
    ORIGINAL_CONSOLE.log('📧 Admin email:', validEmail);

    // Test all console methods for admin
    ORIGINAL_CONSOLE.error('🧪 Admin Error Test - This should be visible');
    ORIGINAL_CONSOLE.warn('🧪 Admin Warning Test - This should be visible');
    ORIGINAL_CONSOLE.info('🧪 Admin Info Test - This should be visible');
  } else {
    // Non-admin user or unauthenticated - clear console and ensure blocking
    if (wasAdminBefore) {
      ORIGINAL_CONSOLE.log('🔒 Switching to non-admin user - console access blocked');
    } else if (!validEmail) {
      ORIGINAL_CONSOLE.log('🔒 Unauthenticated user - console access blocked');
    } else {
      ORIGINAL_CONSOLE.log('🔒 Non-admin user - console access blocked');
    }

    // Clear console for non-admin users (handles pre-opened devtools)
    clearConsoleForNonAdmin();

    // Set up periodic console clearing for non-admin users
    const clearInterval = setInterval(() => {
      if (!currentUserIsAdmin) {
        clearConsoleForNonAdmin();
      } else {
        clearInterval(clearInterval);
      }
    }, 1500); // Clear every 1.5 seconds for non-admin users
  }
};

// Debug functions for testing
(window as any).debugConsoleBlocker = () => {
  ORIGINAL_CONSOLE.log('Console Blocker Status:', {
    currentUserIsAdmin,
    consoleIsInitialized,
    timestamp: new Date().toISOString()
  });
};

(window as any).testConsoleBlocking = () => {
  console.log('🧪 Test Log - Should only show for admin');
  console.error('🧪 Test Error - Should only show for admin');
  console.warn('🧪 Test Warning - Should only show for admin');
  console.info('🧪 Test Info - Should only show for admin');
  console.debug('🧪 Test Debug - Should only show for admin');

  if (currentUserIsAdmin) {
    return '✅ Test completed successfully - you should see 5 test messages above';
  } else {
    return '🔒 Test completed - non-admin users should see nothing in console';
  }
};

// Test function for the pre-open F12 scenario
(window as any).simulatePreOpenF12Attack = () => {
  ORIGINAL_CONSOLE.log('🚨 SIMULATING PRE-OPEN F12 ATTACK');
  ORIGINAL_CONSOLE.log('Step 1: Console is open BEFORE login');
  ORIGINAL_CONSOLE.log('Step 2: User will now login as non-admin');
  ORIGINAL_CONSOLE.log('Step 3: Console should be cleared and blocked');

  // Simulate some sensitive data that should be hidden
  ORIGINAL_CONSOLE.log('🔐 SENSITIVE DATA: Database connection string');
  ORIGINAL_CONSOLE.log('🔐 SENSITIVE DATA: API keys and tokens');
  ORIGINAL_CONSOLE.log('🔐 SENSITIVE DATA: User authentication details');

  return 'Attack simulation ready - now login as non-admin user to test blocking';
};

// Initialize console blocking immediately when module loads
initializeConsoleBlocking();