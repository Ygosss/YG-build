// url: (local script) - run with node scripts/fix-clone-and-query.js
// What it does:
// 1) Replace occurrences of `.cloneNode(true).firstElementChild`
//    with `(template.content.cloneNode(true) as DocumentFragment).firstElementChild`
// 2) Replace occurrences of `someEl.querySelector<Type>(selector)`
//    with `someEl.querySelector(selector) as Type | null`
// NOTE: This script is conservative but still modify files — please review changes before commit.

const fs = require('fs');
const path = require('path');

function walk(dir) {
  let list = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      list = list.concat(walk(full));
    } else {
      list.push(full);
    }
  }
  return list;
}

function processFile(file) {
  const ext = path.extname(file).toLowerCase();
  if (!['.ts', '.tsx', '.js', '.jsx'].includes(ext)) return false;
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // 1) cloneNode(true).firstElementChild -> cast to DocumentFragment
  // handle common pattern: template.content.cloneNode(true).firstElementChild
  content = content.replace(
    /(\.content\.cloneNode\(\s*true\s*\))\.firstElementChild/g,
    (m, p1) => `( ${p1} as DocumentFragment ).firstElementChild`
  );

  // 2) querySelector<Type>(selector) -> querySelector(selector) as Type | null
  // We'll replace patterns like: modalEl.querySelector<HTMLButtonElement>("#id")
  // We'll avoid touching dynamic import(...) and require(...) by focusing on ".querySelector<"
  content = content.replace(
    /([A-Za-z0-9_\)\]\>\"\']+?)\.querySelector\<([^\>]+)\>\(\s*([^\)]+)\s*\)/g,
    (m, root, typeArg, selector) => {
      // preserve spacing
      return `${root}.querySelector(${selector}) as ${typeArg.trim()} | null`;
    }
  );

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated:', file);
    return true;
  }
  return false;
}

const root = path.join(process.cwd(), 'src');
if (!fs.existsSync(root)) {
  console.error('ERROR: src directory not found. Run from project root.');
  process.exit(1);
}

const files = walk(root);
let changed = 0;
for (const f of files) {
  try {
    if (processFile(f)) changed++;
  } catch (err) {
    console.error('Failed to process', f, err.message);
  }
}

console.log('Done. Files changed:', changed);