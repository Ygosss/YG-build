// Simple script to remove trailing ".ts" from import/export paths in .ts files under src/
// Usage: node scripts/remove-ts-extensions.js
const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      results.push(file);
    }
  });
  return results;
}

const root = path.resolve(process.cwd(), 'src');
if (!fs.existsSync(root)) {
  console.error('src directory not found. Run this script from project root.');
  process.exit(1);
}

const files = walk(root).filter(f => f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.jsx'));
let changed = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // Replace import/export statements like: from './foo.ts' or from "../../lib/bar.ts";
  // Keep quotes single/double/backtick
  const newContent = content.replace(/(from\s+|import\s+.*\s+from\s+|export\s+.*\s+from\s+)(['"`])((?:\.\.\/|\.\/|\/|[A-Za-z0-9_\-@])+[^'"]+?)\.ts\2/g, (m, prefix, q, p) => {
    return prefix + q + p + q;
  }).replace(/(import\(|require\()\s*(['"`])((?:\.\.\/|\.\/|\/|[A-Za-z0-9_\-@])+[^'"]+?)\.ts\2/g, (m, p1, q, p) => {
    return p1 + q + p + q;
  });

  if (newContent !== content) {
    fs.writeFileSync(file, newContent, 'utf8');
    changed++;
    console.log('Updated:', path.relative(process.cwd(), file));
  }
});

console.log('Done. Files changed:', changed);