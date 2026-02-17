/**
 * Safe Array Utilities
 * Prevents "filter is not a function" and similar errors
 */

/**
 * Safely filters an array, returns empty array if input is not array
 */
export function safeFilter<T>(
  array: any,
  predicate: (value: T, index: number, array: T[]) => boolean
): T[] {
  if (!Array.isArray(array)) {
    console.warn('⚠️ safeFilter: Attempted to filter non-array:', typeof array, array);
    return [];
  }
  return array.filter(predicate);
}

/**
 * Safely maps an array, returns empty array if input is not array
 */
export function safeMap<T, U>(
  array: any,
  callback: (value: T, index: number, array: T[]) => U
): U[] {
  if (!Array.isArray(array)) {
    console.warn('⚠️ safeMap: Attempted to map non-array:', typeof array, array);
    return [];
  }
  return array.map(callback);
}

/**
 * Safely gets array length, returns 0 if not array
 */
export function safeLength(array: any): number {
  if (!Array.isArray(array)) {
    return 0;
  }
  return array.length;
}

/**
 * Ensures value is an array (wraps in array if not)
 */
export function ensureArray<T>(value: any): T[] {
  if (Array.isArray(value)) {
    return value;
  }
  if (value === null || value === undefined) {
    return [];
  }
  // If it's an object, return array of values
  if (typeof value === 'object') {
    return Object.values(value);
  }
  // For other types, wrap in array
  return [value];
}

/**
 * Global array safety patch (call this early in app)
 */
export function installArraySafety(): void {
  if (typeof window === 'undefined') return;
  
  const originalFilter = Array.prototype.filter;
  const originalMap = Array.prototype.map;
  
  Array.prototype.filter = function(...args: any[]) {
    if (!Array.isArray(this)) {
      console.warn('⚠️ Global safety: Attempted to filter non-array, returning empty array');
      return [];
    }
    return originalFilter.apply(this, args);
  };
  
  Array.prototype.map = function(...args: any[]) {
    if (!Array.isArray(this)) {
      console.warn('⚠️ Global safety: Attempted to map non-array, returning empty array');
      return [];
    }
    return originalMap.apply(this, args);
  };
  
  console.log('✅ Array safety installed');
}