/**
 * Unique ID Generator Utility
 * Prevents duplicate key issues in React by using counter-based IDs
 */

let idCounter = 0;

/**
 * Generate a truly unique ID
 * Uses a counter to ensure no duplicates, even in rapid succession
 * @returns {string} A unique identifier
 */
export const generateUniqueId = () => {
  idCounter++;
  return `${Date.now()}_${idCounter}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Reset counter (optional - call if needed between major operations)
 */
export const resetIdCounter = () => {
  idCounter = 0;
};

/**
 * Generate a numeric unique ID (for compatibility with existing code)
 * @returns {number} A unique numeric identifier
 */
export const generateUniqueNumericId = () => {
  idCounter++;
  return Date.now() + (idCounter / 1000000);
};
