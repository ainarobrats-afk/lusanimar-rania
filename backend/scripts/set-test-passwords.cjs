// Sets known plaintext passwords for mock admin users so live RBAC tests can run.
// This script rewrites backend/src/routes/admin.js to use bcrypt('password').

import fs from 'fs';

const adminPath = 'backend/src/routes/admin.js';
let content = fs.readFileSync(adminPath, 'utf8');

// Replace all occurrences of the unknown hash with a known hash for 'password'
// The script uses dynamic import because bcrypt might be ESM-only in this project.
const hash = '$2a$10$8K1p/a0dL1LXMIgoEDFrwOfMQkfAjkMBcGkYx8Kv5Yq5Z5YK5YWm';
const knownHash = '$2a$10$RBY6gvsM.9wljGQo0L5WxOdq3PjAGLjN6rX4eT.zHx5S.z9f8qS92'; // bcrypt('password')

if (!content.includes(knownHash)) {
  const newContent = content.replace(new RegExp(hash.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), knownHash);
  fs.writeFileSync(adminPath, newContent, 'utf8');
  console.log('Updated mock admin passwords to known value: "password"');
} else {
  console.log('Mock admin passwords already set to known value.');
}