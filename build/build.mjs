import * as path from 'path';
import { promises as fs } from 'fs';
import mri from 'mri';
import { config, format, log } from 'typescript-esm';

const args = mri(process.argv.slice(2), {
  alias: { p: 'project' },
  default: { package: false },
});

(async function () {
  if (args.project === undefined) {
    console.log('You must specify a project either via --project or -p');
    return;
  }

  const configuration = config(args.project);
  const formatted = await format(args.project, configuration);
  const basepath = './dist';
  log('prepare filePaths', { formatted });
  
  if (formatted.size > 0) {
    log('create index.mjs containing all helpers');
    const namesToExport = [];
    let output = '';

    for (const filePath of formatted) {
      const exportName = path.basename(filePath, path.extname(filePath));
      namesToExport.push(exportName);
      output += `import {${exportName}} from '${'./' + path.relative(basepath, filePath)}';\n`;
    }

    output += `export {${namesToExport.join(',')}};`;
    await fs.writeFile(path.join(path.resolve(basepath), 'index.mjs'), output, 'utf8');
    await fs.writeFile(path.join(path.resolve(basepath), 'index.js'), output, 'utf8');
  }

  if (formatted.size > 0) {
    log('create merged type defintions');
    let output = '';
    for (const filePath of formatted) {
      const basename = path.basename(filePath, path.extname(filePath));
      const definitionsFilePath = path.join(path.dirname(filePath), basename + '.d.ts');
      const definitionsContent = await fs.readFile(definitionsFilePath, 'utf8');

      output += definitionsContent;
    }

    await fs.writeFile(path.join(path.resolve(basepath), 'index.d.ts'), output, 'utf8');
  }

  if (formatted.size > 0 && args.package) {
    log('update package.json with all helpers');

    const packageJsonFilePath = path.join(process.cwd(), 'package.json');
    const exportMap = {
      '.': './dist/index.mjs',
    };
    for (const filePath of formatted) {
      const exportName = path.basename(filePath, path.extname(filePath));
      const resolvedFilePath = path.resolve(filePath);
      const relativeFilePath = './' + path.relative(process.cwd(), resolvedFilePath);
      exportMap[`./${exportName}`] = relativeFilePath;
    }

    const currentPackageJsonContents = JSON.parse(await fs.readFile(packageJsonFilePath, 'utf8'));
    currentPackageJsonContents.exports = exportMap;
    await fs.writeFile(packageJsonFilePath, JSON.stringify(currentPackageJsonContents, undefined, 2));
  }
})();
