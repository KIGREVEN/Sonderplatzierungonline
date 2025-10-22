const bcrypt = require('bcrypt');

async function generateHash(password) {
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);
  console.log(`Password: ${password}`);
  console.log(`Hash: ${hash}`);
  
  // Verifikation testen
  const isValid = await bcrypt.compare(password, hash);
  console.log(`Verification: ${isValid}`);
  console.log('---');
  
  return hash;
}

async function main() {
  console.log('=== Generating fresh bcrypt hashes ===');
  const adminHash = await generateHash('admin123');
  const viewerHash = await generateHash('viewer123');
  
  console.log('\n=== SQL Commands ===');
  console.log(`UPDATE users SET password_hash = '${adminHash}' WHERE username = 'admin';`);
  console.log(`UPDATE users SET password_hash = '${viewerHash}' WHERE username = 'viewer';`);
}

main().catch(console.error);
