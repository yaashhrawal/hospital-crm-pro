// Developer tools and console protection for non-admin users
let isDevToolsBlocked = false;
let adminAccess = false;

export const blockDevTools = () => {
  if (isDevToolsBlocked) return;

  // Disable right-click context menu (only for non-admin users)
  document.addEventListener('contextmenu', (e) => {
    if (!adminAccess) {
      e.preventDefault();
      return false;
    }
  });

  // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U (only for non-admin users)
  document.addEventListener('keydown', (e) => {
    // Only block if user is not admin
    if (!adminAccess) {
      // F12 key
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }

      // Ctrl+Shift+I (Dev Tools)
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        return false;
      }

      // Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        return false;
      }

      // Ctrl+U (View Source)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        return false;
      }

      // Ctrl+Shift+K (Console in Firefox)
      if (e.ctrlKey && e.shiftKey && e.key === 'K') {
        e.preventDefault();
        return false;
      }
    }
  });

  // Skip console override - handled by smartConsoleBlocker
  // The console blocking is now handled by the smartConsoleBlocker utility

  // Console clearing handled by smartConsoleBlocker

  isDevToolsBlocked = true;
};

export const allowDevTools = () => {
  if (!isDevToolsBlocked) return;

  // Remove event listeners (simplified approach - reload page for full restore)
  window.location.reload();
};

export const setDevToolsAccess = (isAdmin: boolean, userEmail: string) => {
  const hasAccess = isAdmin || userEmail === 'admin@valant.com' || userEmail === 'meenal@valant.com';
  adminAccess = hasAccess;

  if (!hasAccess) {
    blockDevTools();

    // Additional security: Clear console if devtools are already open
    try {
      if (console.clear) {
        console.clear();
      }

      // Set up periodic console clearing for non-admin users
      const clearingInterval = setInterval(() => {
        if (!adminAccess) {
          try {
            if (console.clear) {
              console.clear();
            }
          } catch (e) {
            // Ignore errors
          }
        } else {
          clearInterval(clearingInterval);
        }
      }, 3000); // Clear every 3 seconds
    } catch (e) {
      // Ignore console clearing errors
    }
  }
  // Admin users have access - F12 should work
};