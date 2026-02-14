
// 🔓 Console Blocker - DISABLED FOR DEBUGGING
// This file previously blocked console access for non-admin users.
// It has been neutralized to allow full debugging capabilities.

export const initializeConsoleBlocking = () => {
  // No-op: Console blocking disabled
  console.log('🔓 Console blocking is disabled by default.');
};

export const setUserStatus = (isAdmin: boolean, userEmail: string) => {
  // No-op: Do not restrict console based on user status
  // We want to see logs for everyone during this critical debugging phase
  console.log(`👤 User status set: Admin=${isAdmin}, Email=${userEmail || 'none'}`);
};

// Keep these for backward compatibility if called elsewhere
(window as any).debugConsoleBlocker = () => {
  console.log('Console Blocker is DISABLED');
};

(window as any).testConsoleBlocking = () => {
  return 'Console blocking is disabled';
};

(window as any).simulatePreOpenF12Attack = () => {
  return 'Simulation disabled';
};