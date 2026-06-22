import bcrypt from 'bcryptjs';

const hash = '$2a$10$8K1p/a0dL1LXMIgoEDFrwOfMQkfAjkMBcGkYx8Kv5Yq5Z5YK5YWm';

const candidates = [
  'password', 'admin', 'test', 'test123', 'admin123', 
  'rania', 'sanimar', 'changeme', '123456', 'letmein',
  'welcome', 'P@ssw0rd', 'Rania2024', 'Rania123', 'Dili2024',
  'SuperSecret', 'sanimer', 'lusanimar',
];

console.log('Cracking mock admin password hash...\n');
let found = false;
for (const pwd of candidates) {
  const match = await bcrypt.compare(pwd, hash);
  if (match) {
    console.log(`✓ MATCH FOUND: password = "${pwd}"`);
    found = true;
  } else {
    console.log(`✗ "${pwd}"`);
  }
}
if (!found) console.log('\nNo match found.');