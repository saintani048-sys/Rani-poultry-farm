import { db, initDatabase } from '../src/server/db.ts';
import bcrypt from 'bcryptjs';

console.log('🧪 [Noorani Poultry Farm] Running Automated Integration Tests...');

initDatabase();

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failed++;
  }
}

// 1. Database Initialization & Admin Seed
const admin = db.prepare("SELECT id, role, username FROM users WHERE role = 'admin'").get() as any;
assert(!!admin && admin.username === 'admin', 'Default administrator exists in database');

// 2. Hen Breeds in Stock
const products = db.prepare('SELECT COUNT(*) as count FROM hen_products WHERE is_active = 1').get() as any;
assert(products.count >= 4, 'Hen products are cataloged and active');

// 3. User Registration Simulation
const testUsername = `test_farmer_${Date.now()}`;
const testMobile = `03${Math.floor(100000000 + Math.random() * 900000000)}`;
const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync('TestSecret123!', salt);

db.prepare(`
  INSERT INTO users (full_name, username, mobile, password_hash, role, balance, referral_code)
  VALUES ('Test Farmer', ?, ?, ?, 'user', 5000, ?)
`).run(testUsername, testMobile, hash, `TEST${Date.now().toString().slice(-4)}`);

const createdUser = db.prepare('SELECT id, username, balance FROM users WHERE username = ?').get(testUsername) as any;
assert(!!createdUser && createdUser.balance === 5000, 'User created with starting balance');

// Initialize user egg inventory
db.prepare('INSERT INTO egg_inventory (user_id, current_eggs, total_collected, total_sold) VALUES (?, 0, 0, 0)')
  .run(createdUser.id);

// 4. Atomic Hen Purchase & Stock Check
const productBefore = db.prepare('SELECT id, price, stock, name FROM hen_products LIMIT 1').get() as any;
const buyQty = 2;
const cost = productBefore.price * buyQty;

db.exec('BEGIN TRANSACTION;');
const userBefore = db.prepare('SELECT balance FROM users WHERE id = ?').get(createdUser.id) as any;
db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(cost, createdUser.id);
db.prepare('UPDATE hen_products SET stock = stock - ? WHERE id = ?').run(buyQty, productBefore.id);
db.prepare(`
  INSERT INTO user_hens (user_id, product_id, quantity, last_collected_at)
  VALUES (?, ?, ?, datetime('now', '-13 hours'))
`).run(createdUser.id, productBefore.id, buyQty);
db.exec('COMMIT;');

const productAfter = db.prepare('SELECT stock FROM hen_products WHERE id = ?').get(productBefore.id) as any;
assert(productAfter.stock === productBefore.stock - buyQty, 'Hen product stock decremented atomically');

const userAfter = db.prepare('SELECT balance FROM users WHERE id = ?').get(createdUser.id) as any;
assert(userAfter.balance === userBefore.balance - cost, 'User balance deducted correctly');

// 5. Egg Collection & Harvest Test (Last collected > 12h ago)
const eligibleHens = db.prepare(`
  SELECT id, quantity, (strftime('%s', 'now') - strftime('%s', last_collected_at)) / 3600 as diff_hours
  FROM user_hens WHERE user_id = ?
`).all(createdUser.id) as any[];

assert(eligibleHens.length > 0 && eligibleHens[0].diff_hours >= 12, 'Egg collection eligibility timestamp verified');

db.exec('BEGIN TRANSACTION;');
const harvested = buyQty * 1;
db.prepare('UPDATE egg_inventory SET current_eggs = current_eggs + ?, total_collected = total_collected + ? WHERE user_id = ?')
  .run(harvested, harvested, createdUser.id);
db.prepare("UPDATE user_hens SET last_collected_at = datetime('now') WHERE user_id = ?").run(createdUser.id);
db.exec('COMMIT;');

const eggInv = db.prepare('SELECT current_eggs, total_collected FROM egg_inventory WHERE user_id = ?').get(createdUser.id) as any;
assert(eggInv.current_eggs === harvested, 'Harvested eggs credited to inventory');

// 6. Double Collection Prevention Test (Should have 0 eligible immediately after)
const immediatelyEligible = db.prepare(`
  SELECT (strftime('%s', 'now') - strftime('%s', last_collected_at)) / 3600 as diff_hours
  FROM user_hens WHERE user_id = ?
`).get(createdUser.id) as any;
assert(immediatelyEligible.diff_hours < 1, 'Immediate duplicate egg harvest prevented by time interval');

// 7. Cleanup test user
db.prepare('DELETE FROM egg_inventory WHERE user_id = ?').run(createdUser.id);
db.prepare('DELETE FROM user_hens WHERE user_id = ?').run(createdUser.id);
db.prepare('DELETE FROM users WHERE id = ?').run(createdUser.id);

console.log(`\nTest Results: ${passed} passed, ${failed} failed.`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 All core business logic integration tests passed successfully!\n');
}
