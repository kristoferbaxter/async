const SILENT = true;

/**
 * Conditionally log a message
 * @param {string} message
 * @param {Array<any>} passed
 */
export function log(message, ...passed) {
  if (!SILENT) {
    console.log(message, ...passed);
  }
}