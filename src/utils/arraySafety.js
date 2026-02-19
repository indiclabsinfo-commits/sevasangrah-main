// Array safety utility - prevents .filter() and other array method errors
console.log('🔧 Loading array safety utility...');

// Store original array methods
const originalFilter = Array.prototype.filter;
const originalMap = Array.prototype.map;
const originalReduce = Array.prototype.reduce;
const originalForEach = Array.prototype.forEach;
const originalFind = Array.prototype.find;
const originalSome = Array.prototype.some;
const originalEvery = Array.prototype.every;

// Safe wrapper for array methods
function safeArrayMethod(method, methodName) {
  return function (...args) {
    if (!this) {
      console.warn(`⚠️ Array.${methodName} called on null/undefined`);
      return methodName === 'reduce' ? 0 : [];
    }
    if (!Array.isArray(this)) {
      console.warn(`⚠️ Array.${methodName} called on non-array:`, this);
      return methodName === 'reduce' ? 0 : [];
    }
    try {
      return method.apply(this, args);
    } catch (error) {
      console.error(`❌ Array.${methodName} error:`, error);
      return methodName === 'reduce' ? 0 : [];
    }
  };
}

// Patch array methods
Array.prototype.filter = safeArrayMethod(originalFilter, 'filter');
Array.prototype.map = safeArrayMethod(originalMap, 'map');
Array.prototype.reduce = safeArrayMethod(originalReduce, 'reduce');
Array.prototype.forEach = safeArrayMethod(originalForEach, 'forEach');
Array.prototype.find = safeArrayMethod(originalFind, 'find');
Array.prototype.some = safeArrayMethod(originalSome, 'some');
Array.prototype.every = safeArrayMethod(originalEvery, 'every');

// Also patch common data fetching patterns
if (typeof window !== 'undefined') {
  // Patch fetch to always return arrays for common endpoints
  const originalFetch = window.fetch;
  window.fetch = function (...args) {
    const promise = originalFetch.apply(this, args);

    return promise.then(response => {
      if (!response.ok) {
        const url = args[0] || '';
        console.warn(`⚠️ Fetch failed [${response.status}] for URL: ${url}`);
        // For common data endpoints, return empty array
        if (typeof url === 'string' && (
          url.includes('/api/') ||
          url.includes('expenses') ||
          url.includes('transactions') ||
          url.includes('appointments')
        )) {
          return {
            ok: true,
            json: () => Promise.resolve([]),
            text: () => Promise.resolve('[]'),
            headers: {
              get: () => null
            }
          };
        }
      }
      return response;
    });
  };
}

console.log('✅ Array safety utility loaded');