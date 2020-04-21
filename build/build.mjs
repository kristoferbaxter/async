import * as path from 'path';
import { promises as fs } from 'fs';
import glob from 'fast-glob';
import mri from 'mri';
import { log } from './log.mjs';

const args = mri(process.argv.slice(2), {
  alias: { p: 'path' },
  default: { path: process.cwd(), package: false },
});

(async function () {
  const filePaths = await glob(args.path + '/**/*.js');

  log('prepare filePaths', { filePaths });

  const toExport = new Map();
  for (const filePath of filePaths) {
    try {
      const basename = path.basename(filePath, path.extname(filePath));
      const newFilePath = path.join(path.dirname(filePath), basename + '.mjs');
      await fs.rename(filePath, newFilePath);
      toExport.set(path.relative(args.path, newFilePath), [basename]);
    } catch (e) {
      log(`Overall: Error preparing ${filePath}\n`);
      log(e);
    }
  }

  if (toExport.size > 0) {
    log('create index.mjs containing all helpers');
    let output = '';
    const namesToExport = [];
    for (const [filePath, exportedNames] of toExport) {
      output += `import {${exportedNames.join(',')}} from '${filePath}';\n`;
      namesToExport.push(exportedNames);
    }

    output += `export {${namesToExport.join(',')}};`;
    await fs.writeFile(path.join(path.resolve(args.path), 'index.mjs'), output, 'utf8');
  }

  if (toExport.size > 0 && args.package) {
    log('update package.json with all helpers');

    const packageJsonFilePath = path.join(process.cwd(), 'package.json');
    const exportMap = {
      ".": "./dist/index.mjs",
    };
    for (const [filePath, exportedNames] of toExport) {
      const resolvedFilePath = path.join(path.resolve(args.path), filePath);
      const relativeFilePath = './' + path.relative(process.cwd(), resolvedFilePath);
      exportMap[`./${exportedNames}`] = relativeFilePath;
    }

    const currentPackageJsonContents = JSON.parse(await fs.readFile(packageJsonFilePath, 'utf8'));
    currentPackageJsonContents.exports = exportMap;
    await fs.writeFile(packageJsonFilePath, JSON.stringify(currentPackageJsonContents, undefined, 2));
  }
})();
