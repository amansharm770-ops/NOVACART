import readline from 'node:readline';
import bcrypt from 'bcryptjs';
import { connectDB, closeDB } from '../config/db.js';
import User from '../models/User.js';

// Usage: npm run create-admin -- --email you@example.com --name "Your Name"   (password is asked, hidden)
function ask(question, hidden = false) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) rl._writeToOutput = (s) => { if (s.includes(question)) rl.output.write(s); };
    rl.question(question, (a) => { rl.close(); if (hidden) process.stdout.write('\n'); resolve(a.trim()); });
  });
}

const arg = (k) => { const i = process.argv.indexOf(`--${k}`); return i > -1 ? process.argv[i + 1] : undefined; };

const email = (arg('email') || process.env.ADMIN_EMAIL || (await ask('Admin email: '))).toLowerCase();
const name = arg('name') || process.env.ADMIN_NAME || (await ask('Admin name: ')) || 'Admin';
const pw = process.env.ADMIN_PASSWORD || (await ask('Admin password (min 8, letter + number): ', true));

if (!/^\S+@\S+\.\S+$/.test(email) || pw.length < 8 || pw.length > 72 || !/[A-Za-z]/.test(pw) || !/\d/.test(pw)) {
  console.error('Invalid email or weak password (min 8 chars, with a letter and a number).');
  process.exit(1);
}

try {
  await connectDB();
} catch (e) {
  console.error(`Database connection failed: ${e.message}`);
  process.exit(1);
}
const passwordHash = await bcrypt.hash(pw, 12);
const user = await User.findOneAndUpdate(
  { email },
  { $set: { name, role: 'admin', isActive: true, passwordHash, failedLoginCount: 0, lockUntil: null } },
  { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
);
console.log(`Admin ready: ${user.email}`);
await closeDB();
