import glob from 'fast-glob';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { stdout, exit } from 'process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

(async function () {
  const files: Array<string> = await glob(__dirname + '/**/*.test.mjs');
  let failure = false;

  if (files.length > 0) {
    stdout.write('Executing Tests\n');
  }
  for (const file of files) {
    try {
      const { tests } = await import(file);
      for (const [name, test] of tests) {
        stdout.write(`.. ${name}`);
        try {
          await test();
        } catch (err) {
          stdout.write(` - FAILURE\nErr: ${err}`);
          failure = true;
          continue;
        }
        stdout.write(' - SUCCESS\n');
      }
    } catch (e) {
      stdout.write(`TestLoader: failed to execute ${file}, verify its contents include a 'test' export.\n${e}\n`);
    }
  }

  if (failure) {
    exit(5);
  }
})();
