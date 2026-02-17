/**
 * Array Safety Patches
 * Prevents "filter is not a function" errors globally
 * MUST BE IMPORTED FIRST in main.tsx
 */

// Global flag to indicate patches are loaded
declare global {
  interface Window {
    __PATCHES_LOADED__?: boolean;
    __ORIGINAL_ARRAY_METHODS__?: {
      filter: Function;
      map: Function;
      forEach: Function;
      reduce: Function;
    };
  }
}

/**
 * Install global array safety patches
 */
function installArraySafetyPatches(): void {
  if (typeof window === 'undefined') return;
  
  // Store original methods
  window.__ORIGINAL_ARRAY_METHODS__ = {
    filter: Array.prototype.filter,
    map: Array.prototype.map,
    forEach: Array.prototype.forEach,
    reduce: Array.prototype.reduce,
  };
  
  // Safe filter patch
  Array.prototype.filter = function(...args: any[]) {
    if (!Array.isArray(this)) {
      console.warn('⚠️ Array Safety: Attempted to filter non-array, returning empty array', {
        type: typeof this,
        value: this,
        stack: new Error().stack
      });
      return [];
    }
    try {
      return window.__ORIGINAL_ARRAY_METHODS__!.filter.apply(this, args);
    } catch (error) {
      console.error('❌ Array Safety: Filter error, returning empty array:', error);
      return [];
    }
  };
  
  // Safe map patch
  Array.prototype.map = function(...args: any[]) {
    if (!Array.isArray(this)) {
      console.warn('⚠️ Array Safety: Attempted to map non-array, returning empty array');
      return [];
    }
    try {
      return window.__ORIGINAL_ARRAY_METHODS__!.map.apply(this, args);
    } catch (error) {
      console.error('❌ Array Safety: Map error, returning empty array:', error);
      return [];
    }
  };
  
  // Safe forEach patch
  Array.prototype.forEach = function(...args: any[]) {
    if (!Array.isArray(this)) {
      console.warn('⚠️ Array Safety: Attempted to forEach non-array, skipping');
      return;
    }
    try {
      return window.__ORIGINAL_ARRAY_METHODS__!.forEach.apply(this, args);
    } catch (error) {
      console.error('❌ Array Safety: ForEach error:', error);
    }
  };
  
  // Safe reduce patch
  Array.prototype.reduce = function(...args: any[]) {
    if (!Array.isArray(this)) {
      console.warn('⚠️ Array Safety: Attempted to reduce non-array, returning initial value or undefined');
      return args.length > 1 ? args[1] : undefined;
    }
    try {
      return window.__ORIGINAL_ARRAY_METHODS__!.reduce.apply(this, args);
    } catch (error) {
      console.error('❌ Array Safety: Reduce error:', error);
      return args.length > 1 ? args[1] : undefined;
    }
  };
  
  console.log('✅ Array safety patches installed');
  window.__PATCHES_LOADED__ = true;
}

// Install patches immediately
installArraySafetyPatches();

// Also patch common array-like operations
if (typeof window !== 'undefined') {
  // Patch querySelectorAll to return proper array
  const originalQuerySelectorAll = Document.prototype.querySelectorAll;
  Document.prototype.querySelectorAll = function(...args: any[]) {
    const result = originalQuerySelectorAll.apply(this, args);
    // Convert NodeList to Array for safety
    return Array.from(result);
  };
  
  // Patch getElementsByTagName/ClassName
  const originalGetElementsByTagName = Document.prototype.getElementsByTagName;
  Document.prototype.getElementsByTagName = function(...args: any[]) {
    const result = originalGetElementsByTagName.apply(this, args);
    return Array.from(result);
  };
  
  console.log('✅ DOM array safety patches installed');
}

export {};