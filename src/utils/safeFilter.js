// Safe array filter utility
export function safeFilter(array, predicate) {
  if (!Array.isArray(array)) {
    console.warn('⚠️ safeFilter: Input is not an array:', array);
    return [];
  }
  return array.filter(predicate);
}

// Global patch for Array.prototype.filter
if (typeof window !== 'undefined') {
  const originalFilter = Array.prototype.filter;
  Array.prototype.filter = function(predicate, thisArg) {
    if (!this) {
      console.warn('⚠️ Array.filter called on null/undefined');
      return [];
    }
    if (!Array.isArray(this)) {
      console.warn('⚠️ Array.filter called on non-array:', this);
      return [];
    }
    return originalFilter.call(this, predicate, thisArg);
  };
  
  console.log('✅ Safe filter patch applied');
}