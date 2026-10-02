import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';

const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'noorani_poultry.db');
export const db = new DatabaseSync(dbPath);

// Enable WAL mode for high concurrency & foreign keys
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      mobile TEXT UNIQUE NOT NULL,
      email TEXT,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user', -- 'user' | 'admin'
      balance INTEGER NOT NULL DEFAULT 0, -- stored in PKR as integer
      status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'suspended'
      status_reason TEXT,
      referral_code TEXT UNIQUE NOT NULL,
      referred_by_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (referred_by_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS hen_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      breed TEXT NOT NULL,
      description TEXT NOT NULL,
      price INTEGER NOT NULL, -- price in PKR
      stock INTEGER NOT NULL DEFAULT 0,
      eggs_per_day INTEGER NOT NULL DEFAULT 1,
      image_url TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS user_hens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      purchased_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_collected_at TEXT NOT NULL DEFAULT (datetime('now')),
      status TEXT NOT NULL DEFAULT 'active',
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES hen_products(id)
    );

    CREATE TABLE IF NOT EXISTS egg_inventory (
      user_id INTEGER PRIMARY KEY,
      current_eggs INTEGER NOT NULL DEFAULT 0,
      total_collected INTEGER NOT NULL DEFAULT 0,
      total_sold INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS egg_collections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      collected_at TEXT NOT NULL DEFAULT (datetime('now')),
      notes TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS hen_purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reference_no TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price INTEGER NOT NULL,
      total_amount INTEGER NOT NULL,
      payment_method TEXT NOT NULL, -- 'balance' | 'bank_transfer' | 'easypaisa' | 'jazzcash'
      payment_ref TEXT,
      payment_proof TEXT,
      status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected' | 'cancelled'
      admin_notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      reviewed_at TEXT,
      reviewed_by TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES hen_products(id)
    );

    CREATE TABLE IF NOT EXISTS egg_sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reference_no TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price INTEGER NOT NULL,
      total_amount INTEGER NOT NULL,
      payment_destination TEXT NOT NULL DEFAULT 'wallet_balance', -- 'wallet_balance' | 'bank_account' | 'mobile_wallet'
      account_details TEXT,
      status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
      admin_notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      reviewed_at TEXT,
      reviewed_by TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reference_no TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL, -- 'deposit' | 'withdrawal' | 'hen_purchase' | 'egg_sale' | 'referral_bonus' | 'admin_adjustment'
      amount INTEGER NOT NULL, -- positive or negative
      balance_before INTEGER NOT NULL,
      balance_after INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'completed', -- 'pending' | 'completed' | 'failed'
      description TEXT NOT NULL,
      related_reference TEXT,
      processed_by TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS deposit_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reference_no TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      amount INTEGER NOT NULL,
      payment_method TEXT NOT NULL,
      sender_account TEXT,
      sender_name TEXT,
      transaction_ref TEXT NOT NULL,
      proof_image TEXT,
      status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
      admin_notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      reviewed_at TEXT,
      reviewed_by TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS withdrawal_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reference_no TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      amount INTEGER NOT NULL,
      payment_method TEXT NOT NULL,
      account_title TEXT NOT NULL,
      account_number TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
      admin_notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      reviewed_at TEXT,
      reviewed_by TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS referrals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      referrer_id INTEGER NOT NULL,
      referee_id INTEGER NOT NULL,
      bonus_amount INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'completed',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (referee_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(referrer_id, referee_id)
    );

    CREATE TABLE IF NOT EXISTS support_tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'medium', -- 'low' | 'medium' | 'high'
      status TEXT NOT NULL DEFAULT 'open', -- 'open' | 'in_progress' | 'resolved' | 'closed'
      admin_reply TEXT,
      replied_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER,
      admin_username TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT,
      details TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Ensure default admin exists and has password updated to new password: admin123
  const newAdminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(newAdminPassword, salt);
  const adminCheck = db.prepare("SELECT id FROM users WHERE role = 'admin' OR LOWER(username) = 'admin'").get() as { id: number } | undefined;
  if (!adminCheck) {
    db.prepare(`
      INSERT INTO users (full_name, username, mobile, email, password_hash, role, balance, referral_code)
      VALUES (?, ?, ?, ?, ?, 'admin', 0, 'ADMIN01')
    `).run('Noorani Farm Administrator', 'admin', '03001234567', 'admin@nooranipoultry.com', hash);
  } else {
    // Explicitly update existing admin password to new password
    db.prepare(`
      UPDATE users SET password_hash = ? WHERE role = 'admin' OR LOWER(username) = 'admin'
    `).run(hash);
  }

  // Seed sample products if none exist
  const productCount = db.prepare('SELECT COUNT(*) as count FROM hen_products').get() as { count: number };
  if (productCount.count === 0) {
    const insertProduct = db.prepare(`
      INSERT INTO hen_products (name, breed, description, price, stock, eggs_per_day, image_url, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `);

    insertProduct.run(
      'Golden Misri Layer Hen',
      'Golden Misri (Indigenous Cross)',
      'Highly resilient domestic layer hen adapted to Pakistan weather. Consistent layer with strong immunity and high egg yield.',
      1850,
      120,
      1,
      '/src/assets/images/golden_misri_hen_1790910506803.jpg'
    );

    insertProduct.run(
      'Black Australorp Heavy Layer',
      'Australorp Pure Heritage',
      'World-record egg layer breed with high organic egg output, docile temperament, and glossy beetle-green plumage.',
      2400,
      85,
      1,
      '/src/assets/images/black_australorp_hen_1790910517842.jpg'
    );

    insertProduct.run(
      'Pure Desi Aseel Breeding Hen',
      'Sindhi / Punjabi Aseel',
      'Authentic pure-blood Pakistani Desi breed known for premium nutrient-dense eggs, hardiness, and exceptional vigor.',
      3200,
      45,
      1,
      '/src/assets/images/golden_misri_hen_1790910506803.jpg'
    );

    insertProduct.run(
      'Rhode Island Red (RIR)',
      'Rhode Island Red',
      'Hardy commercial farm layer producing extra-large rich brown eggs with continuous daily productivity.',
      2100,
      95,
      1,
      '/src/assets/images/fresh_egg_basket_1790910528714.jpg'
    );
  }

  // Seed default settings
  const defaultSettings: Record<string, string> = {
    site_name: 'Noorani Poultry Farm',
    site_tagline: 'Leading Organic Poultry & Commercial Egg Management in Pakistan',
    egg_sell_price: '35', // 35 PKR per egg
    collection_interval_hours: '12', // Can collect eggs every 12 hours
    referral_bonus_pkr: '100', // 100 PKR credited on first purchase
    support_phone: '+92 300 1234567',
    support_whatsapp: '+92 300 1234567',
    support_email: 'support@nooranipoultry.com',
    farm_address: 'Noorani Agro Farm, Chak 45-SB, Sargodha Bypass Road, Punjab, Pakistan',
    bank_name: 'Meezan Bank Limited',
    bank_title: 'Noorani Poultry Farm Ltd',
    bank_account: '02010108923451',
    bank_iban: 'PK45MEZN0002010108923451',
    easypaisa_no: '03001234567 (Account: Noorani Farm)',
    jazzcash_no: '03017654321 (Account: Noorani Farm)',
    fbr_ntn: '7849201-4',
    fbr_verified_status: 'Active Taxpayer on FBR ATL (Livestock Enterprise)',
    fbr_info: 'Noorani Poultry Farm is an organized agricultural and livestock farming enterprise registered with the Federal Board of Revenue (FBR). Under Section 41 of the Income Tax Ordinance 2001, income derived from poultry farming and egg production operates under regulated agricultural livestock provisions.',
    secp_reg_no: '0194823',
    secp_verified_status: 'Registered under Companies Act 2017',
    secp_info: 'Noorani Agro & Poultry Farms (Pvt) Ltd is duly incorporated with the Securities and Exchange Commission of Pakistan (SECP) under Corporate Unique Identification Number 0194823. Official statutory filings and corporate documentation are maintained transparently with the registrar of companies.',
    maintenance_mode: 'false',
    payment_instructions: 'Please transfer the exact amount to any of our official verified accounts above. Note down the Transaction ID (TID) or take a screenshot of your transfer receipt, and submit it with your request for immediate verification.'
  };

  const getSetting = db.prepare('SELECT value FROM settings WHERE key = ?');
  const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');

  for (const [key, val] of Object.entries(defaultSettings)) {
    const existing = getSetting.get(key);
    if (!existing) {
      insertSetting.run(key, val);
    }
  }
}
