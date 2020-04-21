import mri from 'mri';

const args = mri(process.argv.slice(2), {
  default: { silent: true },
});

/**
 * Conditionally log a message
 * @param {string} message
 * @param {Array<any>} passed
 */
export function log(message, ...passed) {
  if (!args.silent) {
    console.log(message, ...passed);
  }
}