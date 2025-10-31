/**
 * Global Log Capture System
 * Captures all console logs before any components load
 * Must be imported at the very top of _layout.tsx
 */

const logStorage: string[] = [];
const MAX_LOGS = 200;

// Store original console methods
const originalLog = console.log.bind(console);
const originalError = console.error.bind(console);
const originalWarn = console.warn.bind(console);
const originalInfo = console.info?.bind(console);

// Override console.log
console.log = (...args: any[]) => {
  originalLog(...args);
  try {
    const message = args.map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');
    const timestamp = new Date().toLocaleTimeString();
    logStorage.push(`[LOG] ${timestamp}: ${message}`);
    if (logStorage.length > MAX_LOGS) logStorage.shift();
  } catch (err) {
    // Silently fail if log capture itself fails
  }
};

// Override console.error
console.error = (...args: any[]) => {
  originalError(...args);
  try {
    const message = args.map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');
    const timestamp = new Date().toLocaleTimeString();
    logStorage.push(`[ERROR] ${timestamp}: ${message}`);
    if (logStorage.length > MAX_LOGS) logStorage.shift();
  } catch (err) {
    // Silently fail if log capture itself fails
  }
};

// Override console.warn
console.warn = (...args: any[]) => {
  originalWarn(...args);
  try {
    const message = args.map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');
    const timestamp = new Date().toLocaleTimeString();
    logStorage.push(`[WARN] ${timestamp}: ${message}`);
    if (logStorage.length > MAX_LOGS) logStorage.shift();
  } catch (err) {
    // Silently fail if log capture itself fails
  }
};

// Capture unhandled promise rejections
if (typeof global !== 'undefined') {
  const originalRejectionHandler = global.HermesInternal?.enablePromiseRejectionTracker;
  if (global.HermesInternal && typeof originalRejectionHandler === 'function') {
    global.HermesInternal.enablePromiseRejectionTracker({
      allRejections: true,
      onUnhandled: (id: number, error: Error) => {
        console.error('[UNHANDLED_REJECTION]', error.message, error.stack);
      }
    });
  }
}

// Export functions to access logs
export function getLogs(): string[] {
  return [...logStorage];
}

export function clearLogs(): void {
  logStorage.length = 0;
}

export function getLogCount(): number {
  return logStorage.length;
}

// Log that log capture is initialized
console.log('[LOG_CAPTURE] Global log capture system initialized');

