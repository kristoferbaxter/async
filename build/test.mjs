import * as path from 'path';
import { promises as fs } from 'fs';
import glob from 'fast-glob';
import mri from 'mri';
import { asyncWalk as walk } from '@kristoferbaxter/estree-walker';
import { parse } from './parse.mjs';
import { log } from './log.mjs';
import { pathExists } from './paths.mjs';

const args = mri(process.argv.slice(2), {
  alias: { p: 'path' },
  default: { path: process.cwd() },
});

(async function () {
  const filePaths = await glob(args.path + '/**/*.js');

  log('prepare filePaths', { filePaths });
  for (const filePath of filePaths) {
    try {
      const __dirname = path.dirname(filePath);
      const [program, magicString] = await parse(filePath);

      await walk(program, {
        enter: async function (node) {
          if (node.type === 'ImportDeclaration') {
            const { source } = node;

            if (source.value.startsWith('.')) {
              // The first character of the module source is a dot, indicating this could be a path.
              const basePath = path.join(__dirname, source.value);
              if (await pathExists([basePath + '.js', basePath + '.mjs'])) {
                // There is a existing filesystem entry for either an '.mjs' or '.js' version of the import.
                // It is safe to use the '.mjs' extension for this import.
                const [start, end] = source.range;
                magicString.overwrite(start, end, `'${path.resolve(basePath)}.mjs'`);
              }
            }
          }
        },
      });

      const newFilePath = path.join(__dirname, path.basename(filePath, path.extname(filePath)) + '.mjs');
      await fs.writeFile(newFilePath, magicString.toString());
      await fs.unlink(filePath);
    } catch (e) {
      log(`Overall: Error preparing ${filePath}\n`);
      log(e);
    }
  }
})();
