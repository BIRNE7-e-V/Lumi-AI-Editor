/**
 * Creates a pre-built zip of all H5P library folders (no content/, no h5p.json).
 * Output: public/h5p/interactive-book-libraries.zip
 *
 * Run: node scripts/create-h5p-base.mjs
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { zipSync } from 'fflate';

const H5P_DIR = 'public/h5p/interactive-book';
const OUT_FILE = 'public/h5p/interactive-book-libraries.zip';

// Skip these at the top level
const SKIP_NAMES = new Set(['.DS_Store', 'content', 'h5p.json']);

function readDirRecursive(dir, baseDir, files = {}) {
  for (const entry of readdirSync(dir)) {
    if (entry === '.DS_Store') continue;

    const fullPath = join(dir, entry);
    const relPath = relative(baseDir, fullPath).replace(/\\/g, '/');

    if (statSync(fullPath).isDirectory()) {
      readDirRecursive(fullPath, baseDir, files);
    } else {
      files[relPath] = readFileSync(fullPath);
    }
  }
  return files;
}

const allFiles = {};
for (const entry of readdirSync(H5P_DIR)) {
  if (SKIP_NAMES.has(entry)) continue;
  const fullPath = join(H5P_DIR, entry);
  if (statSync(fullPath).isDirectory()) {
    readDirRecursive(fullPath, H5P_DIR, allFiles);
  }
}

const zipped = zipSync(allFiles, { level: 6 });
writeFileSync(OUT_FILE, zipped);
console.log(`Written: ${OUT_FILE} (${Math.round(zipped.length / 1024)} KB, ${Object.keys(allFiles).length} files)`);
