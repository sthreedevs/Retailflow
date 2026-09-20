/**
 * Escapes special regex characters in a string to safely use in dynamic RegExp constructions,
 * preventing regular expression injection and ReDoS vulnerabilities.
 *
 * @param {string} str
 * @returns {string}
 */
export function escapeRegex(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
