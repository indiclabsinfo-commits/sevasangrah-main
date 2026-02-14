// Developer tools and console protection for non-admin users
let isDevToolsBlocked = false;
let adminAccess = false;

export const blockDevTools = () => {
  // Blocking DISABLED for debugging
  return;

  /*
  if (isDevToolsBlocked) return;
  
  // Disable right-click context menu (only for non-admin users)
  document.addEventListener('contextmenu', (e) => {
    if (!adminAccess) {
      e.preventDefault();
      return false;
    }
  });
  
  // ... (rest of blocking logic commented out)
  */
};

export const allowDevTools = () => {
  // No-op
};

export const setDevToolsAccess = (isAdmin: boolean, userEmail: string) => {
  // No-op: Always allow access
  adminAccess = true;
};