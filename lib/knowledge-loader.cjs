const fs = require('fs');
const path = require('path');

const rootDir = path.resolve('knowledge');

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function loadMarkdown(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.split(/\r?\n/);
  const titleLine = lines.find((line) => /^#\s+/.test(line));
  const title = titleLine ? titleLine.replace(/^#\s+/, '').trim() : path.basename(filePath, '.md');
  return {
    id: slugify(path.relative(rootDir, filePath)),
    type: 'document',
    source: path.relative(rootDir, filePath).replace(/\\/g, '/'),
    title,
    content: text,
    category: path.dirname(path.relative(rootDir, filePath)).replace(/\\/g, '/'),
  };
}

function normalizeItem(item, key, relPath) {
  const result = { ...(item && typeof item === 'object' ? item : {}) };
  if (!result.id) {
    result.id = String(key || result.id || slugify(relPath));
  }
  if (typeof result.name === 'string') {
    result.name = { en: result.name };
  }
  if (!result.name) {
    result.name = { en: String(result.id) };
  }
  if (typeof result.description === 'string') {
    result.description = { en: result.description };
  }
  if (!result.description) {
    result.description = { en: '' };
  }
  if (!result.country) {
    const segments = relPath.split('/');
    result.country = segments[0] || '';
  }
  if (!result.region) {
    result.region = result.region || result.province || '';
  }
  result.source = relPath;
  return result;
}

function loadJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(raw);
  const relPath = path.relative(rootDir, filePath).replace(/\\/g, '/');
  const items = [];

  if (Array.isArray(parsed)) {
    for (let index = 0; index < parsed.length; index += 1) {
      const item = parsed[index];
      if (item && typeof item === 'object') {
        const normalized = normalizeItem(item, item.id || index, relPath);
        normalized.type = normalized.type || path.basename(filePath, '.json');
        items.push(normalized);
      }
    }
  } else {
    for (const [key, value] of Object.entries(parsed)) {
      const normalized = normalizeItem(value, key, relPath);
      normalized.type = normalized.type || path.basename(filePath, '.json');
      items.push(normalized);
    }
  }

  return {
    source: relPath,
    kind: 'json',
    count: items.length,
    items,
  };
}

function walk(dir) {
  const entries = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      entries.push(...walk(full));
    } else if (entry.isFile()) {
      entries.push(full);
    }
  }
  return entries;
}

function loadKnowledge() {
  const files = walk(rootDir);
  const loaded = { documents: [], json: [], items: [] };
  for (const file of files) {
    if (file.endsWith('.md')) {
      const doc = loadMarkdown(file);
      loaded.documents.push(doc);
      loaded.items.push(doc);
    } else if (file.endsWith('.json')) {
      const jsonData = loadJson(file);
      loaded.json.push(jsonData);
      loaded.items.push(...jsonData.items);
    }
  }
  return loaded;
}

module.exports = { loadKnowledge, loadJson, loadMarkdown, normalizeItem };
