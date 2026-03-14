#!/usr/bin/env node
/**
 * Cross-platform syntax check for JS files.
 * Replaces: node --check public/js/*.js public/js/screens/*.js public/sw.js
 */
import { readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const toPath = (...p) => p.join('/');
const files = [
  'public/sw.js',
  ...readdirSync(join(root, 'public/js'))
    .filter((f) => f.endsWith('.js'))
    .map((f) => toPath('public', 'js', f)),
  ...readdirSync(join(root, 'public/js/screens'))
    .filter((f) => f.endsWith('.js'))
    .map((f) => toPath('public', 'js', 'screens', f)),
];

let failed = 0;
for (const file of files) {
  const full = join(root, file);
  if (!statSync(full).isFile()) continue;
  const r = spawnSync(process.execPath, ['--check', full], {
    cwd: root,
    stdio: 'pipe',
    encoding: 'utf8',
  });
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout);
    failed++;
  }
}
process.exit(failed > 0 ? 1 : 0);
