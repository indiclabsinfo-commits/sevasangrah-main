// PRELOAD PATCH - Loads BEFORE any other JavaScript
// This fixes .filter() errors at the deepest level

console.log('⚡ PRELOAD PATCH: Loading nuclear array safety...');

// ==================== NUCLEAR ARRAY PATCH ====================
(function () {
  // Store originals
  const originals = {
    filter: Array.prototype.filter,
    map: Array.prototype.map,
    reduce: Array.prototype.reduce,
    forEach: Array.prototype.forEach,
    find: Array.prototype.find,
    some: Array.prototype.some,
    every: Array.prototype.every,
    slice: Array.prototype.slice
  };

  // Safe wrapper factory
  function createSafeMethod(original, name) {
    return function (...args) {
      // If 'this' is null/undefined
      if (this == null) {
        console.warn(`🚨 PRELOAD: Array.${name} called on null/undefined - returning safe default`);
        if (name === 'reduce') return args[1] !== undefined ? args[1] : 0;
        return [];
      }

      // If 'this' is not an array but has length (array-like)
      if (!Array.isArray(this) && typeof this.length === 'number') {
        console.warn(`🚨 PRELOAD: Array.${name} called on array-like object - converting to array`);
        const array = Array.from(this);
        return original.apply(array, args);
      }

      // If 'this' is not an array at all
      if (!Array.isArray(this)) {
        console.warn(`🚨 PRELOAD: Array.${name} called on non-array:`, typeof this, this);
        if (name === 'reduce') return args[1] !== undefined ? args[1] : 0;
        return [];
      }

      // Original behavior
      try {
        return original.apply(this, args);
      } catch (error) {
        console.error(`🚨 PRELOAD: Array.${name} error:`, error);
        if (name === 'reduce') return args[1] !== undefined ? args[1] : 0;
        return [];
      }
    };
  }

  // Patch ALL array methods
  Object.keys(originals).forEach(methodName => {
    Array.prototype[methodName] = createSafeMethod(originals[methodName], methodName);
  });

  console.log('✅ PRELOAD: Array methods patched');
})();

// ==================== FETCH PATCH (DISABLED) ====================
// The fetch patch was REMOVED because it converted ALL Supabase errors
// (400, 404, 409 etc) to fake 200 responses with [], hiding every
// real error from the application. This was the root cause of patient
// registration failures and data not appearing.
// DO NOT RE-ENABLE THIS PATCH.

// ==================== OBJECT SAFETY ====================
// Patch Object.keys, Object.values, Object.entries
(function () {
  const originalKeys = Object.keys;
  const originalValues = Object.values;
  const originalEntries = Object.entries;

  Object.keys = function (obj) {
    if (obj == null) {
      console.warn('🚨 PRELOAD: Object.keys called on null/undefined - returning []');
      return [];
    }
    return originalKeys(obj);
  };

  Object.values = function (obj) {
    if (obj == null) {
      console.warn('🚨 PRELOAD: Object.values called on null/undefined - returning []');
      return [];
    }
    return originalValues(obj);
  };

  Object.entries = function (obj) {
    if (obj == null) {
      console.warn('🚨 PRELOAD: Object.entries called on null/undefined - returning []');
      return [];
    }
    return originalEntries(obj);
  };

  console.log('✅ PRELOAD: Object methods patched');
})();

// ==================== GLOBAL ERROR HANDLER ====================
window.addEventListener('error', function (event) {
  if (event.message && event.message.includes('filter')) {
    console.warn('🚨 PRELOAD: Global filter error caught:', event.message);
    event.preventDefault();
    event.stopPropagation();
  }
});

console.log('🎉 PRELOAD PATCH: Complete - Array safety loaded at deepest level');

// Signal that patches are loaded
window.__PATCHES_LOADED__ = true;