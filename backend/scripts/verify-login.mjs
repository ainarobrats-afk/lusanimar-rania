// Quick script to find the plaintext password for the mock admin hash
import bcrypt from 'bcryptjs';

const hash = '$2a$10$8K1p/a0dL1LXMIgoEDFrwOfMQkfAjkMBcGkYx8Kv5Yq5Z5YK5YWm';

const candidates = [
  'password', 'admin', 'secret', 'rania', 'sanimar',
  'test', 'test123', 'admin123', 'password123', 'admin@rania.tl',
  'super@rania.tl', 'ops@rania.tl', 'finance@rania.tl',
  'changeme', '123456', 'letmein', 'welcome',
  'Rania2024', 'Rania123', 'Sanimar', 'Dili2024',
];

console.log('Testing common passwords against mock admin hash...\n');
for (const pwd of candidates) {
  const match = await bcrypt.compare(pwd, hash);
  if (match) {
    console.log(`✓ MATCH FOUND: "${pwd}"`);
    process.exit(0);
  } else {
    console.log(`✗ "${pwd}"`);
  }
}
console.log('\nNo match found in candidate list.');
process.exit(1);