import { Router, Response } from 'express';
import { db } from '../db.ts';
import { AuthenticatedRequest, requireAuth, requireAdmin } from '../auth.ts';

const router = Router();
router.use(requireAuth, requireAdmin);

function logAudit(adminId: number, adminUsername: string, action: string, targetType: string, targetId: string | number, details: string) {
  try {
    db.prepare(`
      INSERT INTO audit_logs (admin_id, admin_username, action, target_type, target_id, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(adminId, adminUsername, action, targetType, String(targetId), details);
  } catch (err) {
    console.error('Audit log failure:', err);
  }
}

function genRef(prefix: string): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${timestamp}-${random}`;
}

// 1. Admin Analytics
router.get('/analytics', (req: AuthenticatedRequest, res: Response) => {
  const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'user'").get() as any;
  const activeUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'user' AND status = 'active'").get() as any;
  const suspendedUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'user' AND status = 'suspended'").get() as any;

  const pendingHens = db.prepare("SELECT COUNT(*) as count FROM hen_purchases WHERE status = 'pending'").get() as any;
  const pendingEggs = db.prepare("SELECT COUNT(*) as count FROM egg_sales WHERE status = 'pending'").get() as any;
  const pendingDeposits = db.prepare("SELECT COUNT(*) as count FROM deposit_requests WHERE status = 'pending'").get() as any;
  const pendingWithdrawals = db.prepare("SELECT COUNT(*) as count FROM withdrawal_requests WHERE status = 'pending'").get() as any;

  const totalHenSales = db.prepare("SELECT COALESCE(SUM(total_amount), 0) as total, COUNT(*) as count FROM hen_purchases WHERE status = 'approved'").get() as any;
  const totalEggPurchasesFromUsers = db.prepare("SELECT COALESCE(SUM(total_amount), 0) as total, COUNT(*) as count FROM egg_sales WHERE status = 'approved'").get() as any;
  const totalDepositsApproved = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM deposit_requests WHERE status = 'approved'").get() as any;
  const totalWithdrawalsApproved = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM withdrawal_requests WHERE status = 'approved'").get() as any;

  const totalStockAvailable = db.prepare("SELECT COALESCE(SUM(stock), 0) as count FROM hen_products WHERE is_active = 1").get() as any;
  const totalHensActiveWithUsers = db.prepare("SELECT COALESCE(SUM(quantity), 0) as count FROM user_hens WHERE status = 'active'").get() as any;
  const totalEggsCollectedAllTime = db.prepare("SELECT COALESCE(SUM(total_collected), 0) as count FROM egg_inventory").get() as any;

  // Real Database Chart Data: User registrations grouped by date (last 14 days)
  const registrationTimeline = db.prepare(`
    SELECT date(created_at) as day, COUNT(*) as count
    FROM users
    WHERE role = 'user' AND created_at >= date('now', '-14 days')
    GROUP BY date(created_at)
    ORDER BY day ASC
  `).all() as any[];

  // Hen purchases over time
  const purchaseTimeline = db.prepare(`
    SELECT date(created_at) as day, COALESCE(SUM(total_amount), 0) as volume
    FROM hen_purchases
    WHERE status = 'approved' AND created_at >= date('now', '-14 days')
    GROUP BY date(created_at)
    ORDER BY day ASC
  `).all() as any[];

  // Egg sales over time
  const salesTimeline = db.prepare(`
    SELECT date(created_at) as day, COALESCE(SUM(total_amount), 0) as volume
    FROM egg_sales
    WHERE status = 'approved' AND created_at >= date('now', '-14 days')
    GROUP BY date(created_at)
    ORDER BY day ASC
  `).all() as any[];

  res.json({
    metrics: {
      total_users: totalUsers.count || 0,
      active_users: activeUsers.count || 0,
      suspended_users: suspendedUsers.count || 0,
      pending_requests: {
        hens: pendingHens.count || 0,
        eggs: pendingEggs.count || 0,
        deposits: pendingDeposits.count || 0,
        withdrawals: pendingWithdrawals.count || 0,
        total: (pendingHens.count + pendingEggs.count + pendingDeposits.count + pendingWithdrawals.count)
      },
      financials: {
        hen_sales_pkr: totalHenSales.total || 0,
        hen_orders_count: totalHenSales.count || 0,
        egg_sales_pkr: totalEggPurchasesFromUsers.total || 0,
        egg_orders_count: totalEggPurchasesFromUsers.count || 0,
        deposits_verified_pkr: totalDepositsApproved.total || 0,
        withdrawals_verified_pkr: totalWithdrawalsApproved.total || 0
      },
      inventory: {
        available_hen_stock: totalStockAvailable.count || 0,
        active_hens_flock: totalHensActiveWithUsers.count || 0,
        total_eggs_collected: totalEggsCollectedAllTime.count || 0
      }
    },
    charts: {
      registrations: registrationTimeline,
      purchases: purchaseTimeline,
      sales: salesTimeline
    }
  });
});

// 2. User Management
router.get('/users', (req: AuthenticatedRequest, res: Response) => {
  const search = req.query.search ? String(req.query.search).trim() : '';

  let query = `
    SELECT u.id, u.full_name, u.username, u.mobile, u.email, u.role, u.balance, u.status, u.status_reason, u.referral_code, u.created_at,
           (SELECT COALESCE(SUM(quantity), 0) FROM user_hens WHERE user_id = u.id AND status = 'active') as active_hens,
           (SELECT current_eggs FROM egg_inventory WHERE user_id = u.id) as current_eggs
    FROM users u
    WHERE u.role = 'user'
  `;
  const params: any[] = [];

  if (search) {
    query += ` AND (LOWER(u.username) LIKE ? OR LOWER(u.full_name) LIKE ? OR u.mobile LIKE ?)`;
    const term = `%${search.toLowerCase()}%`;
    params.push(term, term, term);
  }

  query += ` ORDER BY u.id DESC LIMIT 100`;

  const users = db.prepare(query).all(...params);
  res.json(users);
});

router.get('/users/:id', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.params.id;
  const user = db.prepare(`
    SELECT id, full_name, username, mobile, email, role, balance, status, status_reason, referral_code, created_at, updated_at
    FROM users WHERE id = ?
  `).get(userId) as any;

  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const userHens = db.prepare(`
    SELECT uh.*, p.name as breed_name, p.eggs_per_day
    FROM user_hens uh
    JOIN hen_products p ON uh.product_id = p.id
    WHERE uh.user_id = ?
  `).all(userId);

  const eggInv = db.prepare('SELECT * FROM egg_inventory WHERE user_id = ?').get(userId) as any || { current_eggs: 0, total_collected: 0, total_sold: 0 };
  const transactions = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY id DESC LIMIT 20').all(userId);
  const referrals = db.prepare(`
    SELECT u.id, u.full_name, u.username, u.created_at, r.bonus_amount, r.status
    FROM referrals r
    JOIN users u ON r.referee_id = u.id
    WHERE r.referrer_id = ?
  `).all(userId);

  res.json({
    user,
    hens: userHens,
    egg_inventory: eggInv,
    transactions,
    referrals
  });
});

router.put('/users/:id/status', (req: AuthenticatedRequest, res: Response) => {
  const admin = req.user!;
  const userId = req.params.id;
  const { status, reason } = req.body;

  if (!['active', 'suspended'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Must be active or suspended.' });
  }

  db.prepare(`
    UPDATE users SET status = ?, status_reason = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(status, reason || null, userId);

  logAudit(admin.id, admin.username, `user_${status}`, 'user', userId, `Changed status to ${status}. Reason: ${reason || 'N/A'}`);

  res.json({ message: `User status successfully updated to ${status}.` });
});

router.post('/users/:id/adjust-balance', (req: AuthenticatedRequest, res: Response) => {
  const admin = req.user!;
  const userId = req.params.id;
  const { amount, reason, type } = req.body; // type: 'credit' | 'debit'

  const amt = parseInt(amount, 10);
  if (!amt || amt <= 0) {
    return res.status(400).json({ error: 'Valid adjustment amount required.' });
  }
  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: 'Reason for balance adjustment is required for audit logs.' });
  }

  db.exec('BEGIN TRANSACTION;');
  try {
    const user = db.prepare('SELECT id, balance, username FROM users WHERE id = ?').get(userId) as any;
    if (!user) {
      db.exec('ROLLBACK;');
      return res.status(404).json({ error: 'User not found.' });
    }

    let delta = type === 'debit' ? -amt : amt;
    if (type === 'debit' && user.balance < amt) {
      db.exec('ROLLBACK;');
      return res.status(400).json({ error: 'Cannot debit more than user current balance.' });
    }

    const newBalance = user.balance + delta;
    db.prepare("UPDATE users SET balance = ?, updated_at = datetime('now') WHERE id = ?").run(newBalance, userId);

    const ref = genRef('ADJ');
    db.prepare(`
      INSERT INTO transactions (reference_no, user_id, type, amount, balance_before, balance_after, status, description, processed_by)
      VALUES (?, ?, 'admin_adjustment', ?, ?, ?, 'completed', ?, ?)
    `).run(
      ref,
      userId,
      delta,
      user.balance,
      newBalance,
      `Admin adjustment (${type}): ${reason.trim()}`,
      admin.username
    );

    logAudit(admin.id, admin.username, 'adjust_balance', 'user', userId, `${type.toUpperCase()} PKR ${amt}. Reason: ${reason}. Ref: ${ref}`);

    db.exec('COMMIT;');
    res.json({ message: `Balance successfully updated to PKR ${newBalance.toLocaleString()}.`, new_balance: newBalance });
  } catch (err: any) {
    db.exec('ROLLBACK;');
    console.error('Balance adjustment error:', err);
    res.status(500).json({ error: 'Failed to adjust balance.' });
  }
});

// 3. Hen Purchase Requests Queue
router.get('/requests/hens', (req: AuthenticatedRequest, res: Response) => {
  const status = req.query.status ? String(req.query.status) : 'pending';
  const requests = db.prepare(`
    SELECT hp.*, u.full_name as user_name, u.username, u.mobile as user_mobile, u.balance as user_balance,
           p.name as product_name, p.breed as product_breed, p.stock as current_product_stock
    FROM hen_purchases hp
    JOIN users u ON hp.user_id = u.id
    JOIN hen_products p ON hp.product_id = p.id
    WHERE hp.status = ?
    ORDER BY hp.id DESC
  `).all(status);
  res.json(requests);
});

router.post('/requests/hens/:id/action', (req: AuthenticatedRequest, res: Response) => {
  const admin = req.user!;
  const purchaseId = req.params.id;
  const { action, notes } = req.body; // action: 'approve' | 'reject'

  db.exec('BEGIN TRANSACTION;');
  try {
    const purchase = db.prepare(`
      SELECT hp.*, p.stock, p.name as product_name, u.balance, u.username
      FROM hen_purchases hp
      JOIN hen_products p ON hp.product_id = p.id
      JOIN users u ON hp.user_id = u.id
      WHERE hp.id = ?
    `).get(purchaseId) as any;

    if (!purchase) {
      db.exec('ROLLBACK;');
      return res.status(404).json({ error: 'Purchase request not found.' });
    }

    if (purchase.status !== 'pending') {
      db.exec('ROLLBACK;');
      return res.status(400).json({ error: `Request already has status '${purchase.status}'. Cannot re-process.` });
    }

    if (action === 'approve') {
      if (purchase.stock < purchase.quantity) {
        db.exec('ROLLBACK;');
        return res.status(400).json({ error: `Insufficient inventory in stock. Available: ${purchase.stock}, requested: ${purchase.quantity}.` });
      }

      // Deduct stock
      db.prepare('UPDATE hen_products SET stock = stock - ? WHERE id = ?').run(purchase.quantity, purchase.product_id);

      // Add to user hens
      const existing = db.prepare("SELECT id FROM user_hens WHERE user_id = ? AND product_id = ? AND status = 'active'")
        .get(purchase.user_id, purchase.product_id) as any;

      if (existing) {
        db.prepare("UPDATE user_hens SET quantity = quantity + ?, updated_at = datetime('now') WHERE id = ?")
          .run(purchase.quantity, existing.id);
      } else {
        db.prepare(`
          INSERT INTO user_hens (user_id, product_id, quantity, last_collected_at)
          VALUES (?, ?, ?, datetime('now', '-12 hours'))
        `).run(purchase.user_id, purchase.product_id, purchase.quantity);
      }

      // Record transaction ledger
      db.prepare(`
        INSERT INTO transactions (reference_no, user_id, type, amount, balance_before, balance_after, status, description, related_reference, processed_by)
        VALUES (?, ?, 'hen_purchase', ?, ?, ?, 'completed', ?, ?, ?)
      `).run(
        genRef('TXN'),
        purchase.user_id,
        -purchase.total_amount,
        purchase.balance,
        purchase.balance, // Balance was paid via external transfer
        `Approved purchase of ${purchase.quantity}x ${purchase.product_name} (${purchase.payment_method})`,
        purchase.reference_no,
        admin.username
      );

      // Update purchase status
      db.prepare(`
        UPDATE hen_purchases
        SET status = 'approved', admin_notes = ?, reviewed_at = datetime('now'), reviewed_by = ?
        WHERE id = ?
      `).run(notes || 'Approved by farm management', admin.username, purchase.id);

      logAudit(admin.id, admin.username, 'approve_hen_purchase', 'hen_purchase', purchase.id, `Approved ${purchase.quantity}x ${purchase.product_name} for ${purchase.username}`);

    } else if (action === 'reject') {
      db.prepare(`
        UPDATE hen_purchases
        SET status = 'rejected', admin_notes = ?, reviewed_at = datetime('now'), reviewed_by = ?
        WHERE id = ?
      `).run(notes || 'Rejected by administration', admin.username, purchase.id);

      logAudit(admin.id, admin.username, 'reject_hen_purchase', 'hen_purchase', purchase.id, `Rejected order ${purchase.reference_no}. Reason: ${notes || 'N/A'}`);
    }

    db.exec('COMMIT;');
    res.json({ message: `Purchase request ${purchase.reference_no} has been ${action}d.` });
  } catch (err: any) {
    db.exec('ROLLBACK;');
    console.error('Hen request action error:', err);
    res.status(500).json({ error: 'Failed to process request.' });
  }
});

// 4. Egg Sale Requests Queue
router.get('/requests/eggs', (req: AuthenticatedRequest, res: Response) => {
  const status = req.query.status ? String(req.query.status) : 'pending';
  const sales = db.prepare(`
    SELECT es.*, u.full_name as user_name, u.username, u.mobile as user_mobile, u.balance as user_balance
    FROM egg_sales es
    JOIN users u ON es.user_id = u.id
    WHERE es.status = ?
    ORDER BY es.id DESC
  `).all(status);
  res.json(sales);
});

router.post('/requests/eggs/:id/action', (req: AuthenticatedRequest, res: Response) => {
  const admin = req.user!;
  const saleId = req.params.id;
  const { action, notes } = req.body;

  db.exec('BEGIN TRANSACTION;');
  try {
    const sale = db.prepare(`
      SELECT es.*, u.balance, u.username
      FROM egg_sales es
      JOIN users u ON es.user_id = u.id
      WHERE es.id = ?
    `).get(saleId) as any;

    if (!sale) {
      db.exec('ROLLBACK;');
      return res.status(404).json({ error: 'Egg sale request not found.' });
    }

    if (sale.status !== 'pending') {
      db.exec('ROLLBACK;');
      return res.status(400).json({ error: `Request already processed as '${sale.status}'.` });
    }

    if (action === 'approve') {
      // Credit user's wallet balance
      const newBalance = sale.balance + sale.total_amount;
      db.prepare("UPDATE users SET balance = ?, updated_at = datetime('now') WHERE id = ?").run(newBalance, sale.user_id);

      // Record total sold in egg inventory
      db.prepare("UPDATE egg_inventory SET total_sold = total_sold + ?, updated_at = datetime('now') WHERE user_id = ?")
        .run(sale.quantity, sale.user_id);

      // Ledger transaction
      db.prepare(`
        INSERT INTO transactions (reference_no, user_id, type, amount, balance_before, balance_after, status, description, related_reference, processed_by)
        VALUES (?, ?, 'egg_sale', ?, ?, ?, 'completed', ?, ?, ?)
      `).run(
        genRef('TXN'),
        sale.user_id,
        sale.total_amount,
        sale.balance,
        newBalance,
        `Sold ${sale.quantity} farm eggs @ PKR ${sale.unit_price}/egg`,
        sale.reference_no,
        admin.username
      );

      db.prepare(`
        UPDATE egg_sales
        SET status = 'approved', admin_notes = ?, reviewed_at = datetime('now'), reviewed_by = ?
        WHERE id = ?
      `).run(notes || 'Approved and credited to balance', admin.username, sale.id);

      logAudit(admin.id, admin.username, 'approve_egg_sale', 'egg_sale', sale.id, `Approved sale of ${sale.quantity} eggs for PKR ${sale.total_amount}`);

    } else if (action === 'reject') {
      // Restore held eggs back to user inventory!
      db.prepare("UPDATE egg_inventory SET current_eggs = current_eggs + ?, updated_at = datetime('now') WHERE user_id = ?")
        .run(sale.quantity, sale.user_id);

      db.prepare(`
        UPDATE egg_sales
        SET status = 'rejected', admin_notes = ?, reviewed_at = datetime('now'), reviewed_by = ?
        WHERE id = ?
      `).run(notes || 'Rejected by administration', admin.username, sale.id);

      logAudit(admin.id, admin.username, 'reject_egg_sale', 'egg_sale', sale.id, `Rejected egg sale ${sale.reference_no}. Returned ${sale.quantity} eggs to user`);
    }

    db.exec('COMMIT;');
    res.json({ message: `Egg sale request ${sale.reference_no} has been ${action}d.` });
  } catch (err: any) {
    db.exec('ROLLBACK;');
    console.error('Egg sale action error:', err);
    res.status(500).json({ error: 'Failed to process egg sale request.' });
  }
});

// 5. Deposit Requests Queue
router.get('/requests/deposits', (req: AuthenticatedRequest, res: Response) => {
  const status = req.query.status ? String(req.query.status) : 'pending';
  const deposits = db.prepare(`
    SELECT dr.*, u.full_name as user_name, u.username, u.mobile as user_mobile, u.balance as user_balance
    FROM deposit_requests dr
    JOIN users u ON dr.user_id = u.id
    WHERE dr.status = ?
    ORDER BY dr.id DESC
  `).all(status);
  res.json(deposits);
});

router.post('/requests/deposits/:id/action', (req: AuthenticatedRequest, res: Response) => {
  const admin = req.user!;
  const depositId = req.params.id;
  const { action, notes } = req.body;

  db.exec('BEGIN TRANSACTION;');
  try {
    const deposit = db.prepare(`
      SELECT dr.*, u.balance, u.username
      FROM deposit_requests dr
      JOIN users u ON dr.user_id = u.id
      WHERE dr.id = ?
    `).get(depositId) as any;

    if (!deposit) {
      db.exec('ROLLBACK;');
      return res.status(404).json({ error: 'Deposit request not found.' });
    }

    if (deposit.status !== 'pending') {
      db.exec('ROLLBACK;');
      return res.status(400).json({ error: `Deposit request already processed as '${deposit.status}'.` });
    }

    if (action === 'approve') {
      const newBalance = deposit.balance + deposit.amount;
      db.prepare("UPDATE users SET balance = ?, updated_at = datetime('now') WHERE id = ?").run(newBalance, deposit.user_id);

      db.prepare(`
        INSERT INTO transactions (reference_no, user_id, type, amount, balance_before, balance_after, status, description, related_reference, processed_by)
        VALUES (?, ?, 'deposit', ?, ?, ?, 'completed', ?, ?, ?)
      `).run(
        genRef('TXN'),
        deposit.user_id,
        deposit.amount,
        deposit.balance,
        newBalance,
        `Deposit via ${deposit.payment_method} (TID: ${deposit.transaction_ref})`,
        deposit.reference_no,
        admin.username
      );

      db.prepare(`
        UPDATE deposit_requests
        SET status = 'approved', admin_notes = ?, reviewed_at = datetime('now'), reviewed_by = ?
        WHERE id = ?
      `).run(notes || 'Payment verified and credited', admin.username, deposit.id);

      logAudit(admin.id, admin.username, 'approve_deposit', 'deposit_request', deposit.id, `Approved deposit PKR ${deposit.amount} for ${deposit.username} (TID: ${deposit.transaction_ref})`);

    } else if (action === 'reject') {
      db.prepare(`
        UPDATE deposit_requests
        SET status = 'rejected', admin_notes = ?, reviewed_at = datetime('now'), reviewed_by = ?
        WHERE id = ?
      `).run(notes || 'Payment verification failed', admin.username, deposit.id);

      logAudit(admin.id, admin.username, 'reject_deposit', 'deposit_request', deposit.id, `Rejected deposit ${deposit.reference_no}. Reason: ${notes || 'N/A'}`);
    }

    db.exec('COMMIT;');
    res.json({ message: `Deposit ${deposit.reference_no} has been ${action}d.` });
  } catch (err: any) {
    db.exec('ROLLBACK;');
    console.error('Deposit action error:', err);
    res.status(500).json({ error: 'Failed to process deposit request.' });
  }
});

// 6. Withdrawal Requests Queue
router.get('/requests/withdrawals', (req: AuthenticatedRequest, res: Response) => {
  const status = req.query.status ? String(req.query.status) : 'pending';
  const withdrawals = db.prepare(`
    SELECT wr.*, u.full_name as user_name, u.username, u.mobile as user_mobile, u.balance as user_balance
    FROM withdrawal_requests wr
    JOIN users u ON wr.user_id = u.id
    WHERE wr.status = ?
    ORDER BY wr.id DESC
  `).all(status);
  res.json(withdrawals);
});

router.post('/requests/withdrawals/:id/action', (req: AuthenticatedRequest, res: Response) => {
  const admin = req.user!;
  const withdrawalId = req.params.id;
  const { action, notes } = req.body;

  db.exec('BEGIN TRANSACTION;');
  try {
    const withdrawal = db.prepare(`
      SELECT wr.*, u.balance, u.username
      FROM withdrawal_requests wr
      JOIN users u ON wr.user_id = u.id
      WHERE wr.id = ?
    `).get(withdrawalId) as any;

    if (!withdrawal) {
      db.exec('ROLLBACK;');
      return res.status(404).json({ error: 'Withdrawal request not found.' });
    }

    if (withdrawal.status !== 'pending') {
      db.exec('ROLLBACK;');
      return res.status(400).json({ error: `Withdrawal already processed as '${withdrawal.status}'.` });
    }

    if (action === 'approve') {
      // Mark transaction status completed
      db.prepare(`
        UPDATE transactions
        SET status = 'completed', processed_by = ?
        WHERE related_reference = ? AND status = 'pending'
      `).run(admin.username, withdrawal.reference_no);

      db.prepare(`
        UPDATE withdrawal_requests
        SET status = 'approved', admin_notes = ?, reviewed_at = datetime('now'), reviewed_by = ?
        WHERE id = ?
      `).run(notes || 'Disbursed via payment provider', admin.username, withdrawal.id);

      logAudit(admin.id, admin.username, 'approve_withdrawal', 'withdrawal_request', withdrawal.id, `Approved withdrawal PKR ${withdrawal.amount} to ${withdrawal.account_title}`);

    } else if (action === 'reject') {
      // Refund balance back to user wallet!
      const newBalance = withdrawal.balance + withdrawal.amount;
      db.prepare("UPDATE users SET balance = ?, updated_at = datetime('now') WHERE id = ?").run(newBalance, withdrawal.user_id);

      // Void the pending transaction record
      db.prepare(`
        UPDATE transactions
        SET status = 'failed', description = description || ' [Rejected: Refunded to balance]'
        WHERE related_reference = ? AND status = 'pending'
      `).run(withdrawal.reference_no);

      db.prepare(`
        UPDATE withdrawal_requests
        SET status = 'rejected', admin_notes = ?, reviewed_at = datetime('now'), reviewed_by = ?
        WHERE id = ?
      `).run(notes || 'Rejected by administration', admin.username, withdrawal.id);

      logAudit(admin.id, admin.username, 'reject_withdrawal', 'withdrawal_request', withdrawal.id, `Rejected withdrawal ${withdrawal.reference_no}. Refunded PKR ${withdrawal.amount} to user`);
    }

    db.exec('COMMIT;');
    res.json({ message: `Withdrawal request ${withdrawal.reference_no} has been ${action}d.` });
  } catch (err: any) {
    db.exec('ROLLBACK;');
    console.error('Withdrawal action error:', err);
    res.status(500).json({ error: 'Failed to process withdrawal action.' });
  }
});

// 7. Hen Products Management
router.get('/products', (_req, res) => {
  const products = db.prepare('SELECT * FROM hen_products ORDER BY id DESC').all();
  res.json(products);
});

router.post('/products', (req: AuthenticatedRequest, res: Response) => {
  const admin = req.user!;
  const { name, breed, description, price, stock, eggsPerDay, imageUrl, isActive } = req.body;

  if (!name || !breed || !price) {
    return res.status(400).json({ error: 'Name, breed, and price are required.' });
  }

  const result = db.prepare(`
    INSERT INTO hen_products (name, breed, description, price, stock, eggs_per_day, image_url, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name.trim(),
    breed.trim(),
    description || '',
    parseInt(price, 10),
    parseInt(stock, 10) || 0,
    parseInt(eggsPerDay, 10) || 1,
    imageUrl || '/src/assets/images/golden_misri_hen_1790910506803.jpg',
    isActive ? 1 : 0
  );

  logAudit(admin.id, admin.username, 'create_product', 'hen_product', Number(result.lastInsertRowid), `Created breed: ${name} (${price} PKR)`);

  res.json({ message: 'Product created successfully.', id: result.lastInsertRowid });
});

router.put('/products/:id', (req: AuthenticatedRequest, res: Response) => {
  const admin = req.user!;
  const productId = req.params.id;
  const { name, breed, description, price, stock, eggsPerDay, imageUrl, isActive } = req.body;

  db.prepare(`
    UPDATE hen_products
    SET name = ?, breed = ?, description = ?, price = ?, stock = ?, eggs_per_day = ?, image_url = ?, is_active = ?
    WHERE id = ?
  `).run(
    name.trim(),
    breed.trim(),
    description || '',
    parseInt(price, 10),
    parseInt(stock, 10) || 0,
    parseInt(eggsPerDay, 10) || 1,
    imageUrl,
    isActive ? 1 : 0,
    productId
  );

  logAudit(admin.id, admin.username, 'update_product', 'hen_product', productId, `Updated product details for ${name}`);

  res.json({ message: 'Product updated successfully.' });
});

router.delete('/products/:id', (req: AuthenticatedRequest, res: Response) => {
  const admin = req.user!;
  const productId = req.params.id;

  // Soft delete / archive
  db.prepare('UPDATE hen_products SET is_active = 0 WHERE id = ?').run(productId);

  logAudit(admin.id, admin.username, 'archive_product', 'hen_product', productId, `Archived product id ${productId}`);

  res.json({ message: 'Product archived successfully.' });
});

// 8. Settings Management
router.get('/settings', (_req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
  const settings: Record<string, string> = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  res.json(settings);
});

router.put('/settings', (req: AuthenticatedRequest, res: Response) => {
  const admin = req.user!;
  const settingsObj = req.body;

  const upsert = db.prepare(`
    INSERT INTO settings (key, value, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
  `);

  db.exec('BEGIN TRANSACTION;');
  try {
    for (const [key, value] of Object.entries(settingsObj)) {
      if (typeof value === 'string' || typeof value === 'number') {
        upsert.run(key, String(value));
      }
    }
    logAudit(admin.id, admin.username, 'update_settings', 'system', 'settings', 'Updated system settings');
    db.exec('COMMIT;');
    res.json({ message: 'System settings successfully saved.' });
  } catch (err: any) {
    db.exec('ROLLBACK;');
    console.error('Settings save error:', err);
    res.status(500).json({ error: 'Failed to save settings.' });
  }
});

// 9. Audit Logs
router.get('/audit-logs', (_req, res) => {
  const logs = db.prepare('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 100').all();
  res.json(logs);
});

// 10. Support Tickets
router.get('/support-tickets', (_req, res) => {
  const tickets = db.prepare(`
    SELECT st.*, u.full_name as user_name, u.username, u.mobile as user_mobile
    FROM support_tickets st
    JOIN users u ON st.user_id = u.id
    ORDER BY st.id DESC
  `).all();
  res.json(tickets);
});

router.post('/support-tickets/:id/reply', (req: AuthenticatedRequest, res: Response) => {
  const admin = req.user!;
  const ticketId = req.params.id;
  const { reply, status } = req.body;

  if (!reply || !reply.trim()) {
    return res.status(400).json({ error: 'Reply message cannot be empty.' });
  }

  db.prepare(`
    UPDATE support_tickets
    SET admin_reply = ?, status = ?, replied_at = datetime('now')
    WHERE id = ?
  `).run(reply.trim(), status || 'resolved', ticketId);

  logAudit(admin.id, admin.username, 'reply_ticket', 'support_ticket', ticketId, `Replied to ticket #${ticketId}`);

  res.json({ message: 'Reply sent successfully.' });
});

export default router;
