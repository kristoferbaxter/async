import { promises as fs } from 'fs';
import acorn from 'acorn';
import importMeta from 'acorn-import-meta';
import MagicString from 'magic-string';
import { log } from './log.mjs';

const DEFAULT_ACORN_OPTIONS = {
  ecmaVersion: 2020,
  sourceType: 'module',
  preserveParens: false,
  ranges: true,
};

/**
 * Parse filePath contents into a Program.
 * @param {string} filePath
 * @return {[Promise<acorn.Program>, MagicString]}
 */
export async function parse(filePath) {
  try {
    const contents = await fs.readFile(filePath, 'utf8');
    const parse = acorn.Parser.extend(importMeta).parse(contents, DEFAULT_ACORN_OPTIONS);
    const magic = new MagicString(contents);
    return [parse, magic];
  } catch (e) {
    log(`Acorn: Parse exception in ${filePath}`);
    throw e;
  }
}
