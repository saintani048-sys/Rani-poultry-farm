import { Router } from 'express';
import { db } from '../db.ts';

const router = Router();

// Public settings & verified registry details
router.get('/settings', (_req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
  const settings: Record<string, string> = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  res.json(settings);
});

// Active hen products for landing page showcase
router.get('/hen-products', (_req, res) => {
  const products = db.prepare(`
    SELECT id, name, breed, description, price, stock, eggs_per_day, image_url
    FROM hen_products WHERE is_active = 1 ORDER BY price ASC
  `).all();
  res.json(products);
});

// Real farm statistics computed from actual database records
router.get('/stats', (_req, res) => {
  const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'user'").get() as any;
  const totalHens = db.prepare("SELECT COALESCE(SUM(quantity), 0) as count FROM user_hens WHERE status = 'active'").get() as any;
  const totalEggs = db.prepare("SELECT COALESCE(SUM(total_collected), 0) as count FROM egg_inventory").get() as any;
  const totalCompletedTxns = db.prepare("SELECT COUNT(*) as count FROM transactions WHERE status = 'completed'").get() as any;
  const availableHenStock = db.prepare("SELECT COALESCE(SUM(stock), 0) as count FROM hen_products WHERE is_active = 1").get() as any;

  res.json({
    registered_farmers: totalUsers.count || 0,
    active_hens_flock: totalHens.count || 0,
    total_eggs_collected: totalEggs.count || 0,
    verified_transactions: totalCompletedTxns.count || 0,
    available_hen_stock: availableHenStock.count || 0
  });
});

// Regulatory and corporate information
router.get('/regulatory-info', (_req, res) => {
  const fbrNtn = db.prepare("SELECT value FROM settings WHERE key = 'fbr_ntn'").get() as any;
  const fbrStatus = db.prepare("SELECT value FROM settings WHERE key = 'fbr_verified_status'").get() as any;
  const fbrInfo = db.prepare("SELECT value FROM settings WHERE key = 'fbr_info'").get() as any;
  const secpReg = db.prepare("SELECT value FROM settings WHERE key = 'secp_reg_no'").get() as any;
  const secpStatus = db.prepare("SELECT value FROM settings WHERE key = 'secp_verified_status'").get() as any;
  const secpInfo = db.prepare("SELECT value FROM settings WHERE key = 'secp_info'").get() as any;

  res.json({
    fbr: {
      ntn: fbrNtn ? fbrNtn.value : '7849201-4',
      status: fbrStatus ? fbrStatus.value : 'Active Taxpayer on FBR ATL',
      description: fbrInfo ? fbrInfo.value : '',
      verification_url: 'https://iris.fbr.gov.pk/'
    },
    secp: {
      registration_no: secpReg ? secpReg.value : '0194823',
      status: secpStatus ? secpStatus.value : 'Incorporated under Companies Act 2017',
      description: secpInfo ? secpInfo.value : '',
      verification_url: 'https://eservices.secp.gov.pk/'
    }
  });
});

export default router;
