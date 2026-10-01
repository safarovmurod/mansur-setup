import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === '.git' || file === 'node_modules') continue;
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, fileList);
    } else {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

test('Repository secrets and personal paths audit', () => {
  const allFiles = getAllFiles(repoRoot);
  assert.ok(allFiles.length > 10, 'Repository should contain project files');

  const forbiddenPatterns = [
    { name: 'Hardcoded user path', regex: /[C|c]:\\Users\\safar|[C|c]:\/Users\/safar/ },
    { name: 'Active GitHub Personal Access Token', regex: /ghp_[A-Za-z0-9_]{36,}/ },
    { name: 'Active Google / Gemini API key', regex: /AIza[0-9A-Za-z-_]{35}/ },
    { name: 'Private Key header', regex: /-----BEGIN (RSA|EC|OPENSSH|DSA|PGP|PRIVATE) KEY-----/ },
  ];

  const violations = [];

  for (const file of allFiles) {
    // Only check text files
    const ext = path.extname(file).toLowerCase();
    if (['.json', '.js', '.mjs', '.md', '.txt', '.ps1'].includes(ext)) {
      const content = fs.readFileSync(file, 'utf8');

      for (const pat of forbiddenPatterns) {
        // Special case: docs/INVENTORY.md and docs/TROUBLESHOOTING.md mention "safar" only when describing the original path/audit
        if (pat.name === 'Hardcoded user path' && file.endsWith('.md')) {
          continue;
        }

        if (pat.regex.test(content)) {
          violations.push({
            file: path.relative(repoRoot, file),
            pattern: pat.name,
          });
        }
      }
    }
  }

  assert.deepEqual(violations, [], `Forbidden patterns found in files: ${JSON.stringify(violations, null, 2)}`);
});
