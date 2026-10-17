const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

console.log('Running automated linting and syntax verification...');

function findJsFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        findJsFiles(filePath, fileList);
      }
    } else if (file.endsWith('.js')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const jsFiles = findJsFiles(path.join(__dirname, '..', 'src')).concat(
  findJsFiles(path.join(__dirname, '..', 'tests'))
);

for (const file of jsFiles) {
  try {
    execSync(`node --check "${file}"`);
    console.log(`✓ Syntax valid: ${path.relative(path.join(__dirname, '..'), file)}`);
  } catch (err) {
    console.error(`✗ Syntax error in ${file}:`, err.message);
    process.exit(1);
  }
}

console.log('All automated lint checks passed successfully!');
