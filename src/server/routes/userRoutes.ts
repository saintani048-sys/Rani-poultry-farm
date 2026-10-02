import { Router, Response } from 'express';
import { db } from '../db.ts';
import { AuthenticatedRequest, requireAuth } from '../auth.ts';

const router = Router();
router.use(requireAuth);

// Helper to generate unique reference numbers
function genRef(prefix: string): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${timestamp}-${random}`;
}

// 1. Dashboard summary
router.get('/dashboard-summary', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  const user = db.prepare(`
    SELECT id, full_name, username, mobile, email, balance, status, referral_code
    FROM users WHERE id = ?
  `).get(userId) as any;

  const hensSummary = db.prepare(`
    SELECT COALESCE(SUM(quantity), 0) as total_hens FROM user_hens WHERE user_id = ? AND status = 'active'
  `).get(userId) as any;

  const eggInv = db.prepare(`
    SELECT current_eggs, total_collected, total_sold FROM egg_inventory WHERE user_id = ?
  `).get(userId) as any || { current_eggs: 0, total_collected: 0, total_sold: 0 };

  const deposits = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total_deposited FROM deposit_requests WHERE user_id = ? AND status = 'approved'
  `).get(userId) as any;

  const withdrawals = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total_withdrawn FROM withdrawal_requests WHERE user_id = ? AND status = 'approved'
  `).get(userId) as any;

  const eggSalesRevenue = db.prepare(`
    SELECT COALESCE(SUM(total_amount), 0) as total_egg_revenue FROM egg_sales WHERE user_id = ? AND status = 'approved'
  `).get(userId) as any;

  const pendingRequestsCount = db.prepare(`
    SELECT (
      (SELECT COUNT(*) FROM hen_purchases WHERE user_id = ? AND status = 'pending') +
      (SELECT COUNT(*) FROM egg_sales WHERE user_id = ? AND status = 'pending') +
      (SELECT COUNT(*) FROM deposit_requests WHERE user_id = ? AND status = 'pending') +
      (SELECT COUNT(*) FROM withdrawal_requests WHERE user_id = ? AND status = 'pending')
    ) as pending_count
  `).get(userId, userId, userId, userId) as any;

  const completedTransactionsCount = db.prepare(`
    SELECT COUNT(*) as count FROM transactions WHERE user_id = ? AND status = 'completed'
  `).get(userId) as any;

  const eggPriceSetting = db.prepare("SELECT value FROM settings WHERE key = 'egg_sell_price'").get() as any;
  const eggPrice = eggPriceSetting ? parseInt(eggPriceSetting.value, 10) : 35;

  // Calculate eligible eggs to collect right now
  const userHens = db.prepare(`
    SELECT id, quantity, last_collected_at, purchased_at FROM user_hens WHERE user_id = ? AND status = 'active'
  `).all(userId) as any[];

  const intervalSetting = db.prepare("SELECT value FROM settings WHERE key = 'collection_interval_hours'").get() as any;
  const intervalHours = intervalSetting ? parseInt(intervalSetting.value, 10) : 12;

  let eligibleEggsToCollect = 0;
  const nowMs = Date.now();

  for (const hen of userHens) {
    const lastCollect = new Date(hen.last_collected_at).getTime();
    const diffHours = (nowMs - lastCollect) / (1000 * 60 * 60);
    if (diffHours >= intervalHours) {
      const cycles = Math.min(Math.floor(diffHours / intervalHours), 5); // Max 5 cycles accumulated
      eligibleEggsToCollect += (hen.quantity * cycles);
    }
  }

  // Recent 5 transactions
  const recentTransactions = db.prepare(`
    SELECT reference_no, type, amount, balance_after, description, created_at, status
    FROM transactions WHERE user_id = ? ORDER BY id DESC LIMIT 5
  `).all(userId);

  res.json({
    user: {
      id: user.id,
      full_name: user.full_name,
      username: user.username,
      mobile: user.mobile,
      email: user.email,
      balance: user.balance,
      referral_code: user.referral_code
    },
    metrics: {
      balance: user.balance,
      total_deposited: deposits.total_deposited,
      total_withdrawn: withdrawals.total_withdrawn,
      total_hens: hensSummary.total_hens,
      current_eggs: eggInv.current_eggs,
      total_collected: eggInv.total_collected,
      total_sold: eggInv.total_sold,
      total_egg_revenue: eggSalesRevenue.total_egg_revenue,
      pending_requests: pendingRequestsCount.pending_count,
      completed_transactions: completedTransactionsCount.count,
      egg_price: eggPrice,
      eligible_eggs_to_collect: eligibleEggsToCollect,
      collection_interval_hours: intervalHours
    },
    recent_transactions: recentTransactions
  });
});

// 2. Buy Hen module
router.get('/hen-products', (_req, res) => {
  const products = db.prepare(`
    SELECT id, name, breed, description, price, stock, eggs_per_day, image_url, is_active
    FROM hen_products WHERE is_active = 1 ORDER BY price ASC
  `).all();
  res.json(products);
});

router.post('/buy-hen', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { productId, quantity, paymentMethod, paymentRef, paymentProof } = req.body;

  const qty = parseInt(quantity, 10);
  if (!qty || qty < 1) {
    return res.status(400).json({ error: 'Quantity must be at least 1.' });
  }

  const product = db.prepare('SELECT * FROM hen_products WHERE id = ? AND is_active = 1').get(productId) as any;
  if (!product) {
    return res.status(404).json({ error: 'Selected hen product is currently unavailable.' });
  }

  if (product.stock < qty) {
    return res.status(400).json({ error: `Not enough stock available. Only ${product.stock} hens left.` });
  }

  const totalAmount = product.price * qty;
  const referenceNo = genRef('HEN');

  if (paymentMethod === 'balance') {
    // Check balance and execute atomic transaction
    db.exec('BEGIN TRANSACTION;');
    try {
      const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId) as any;
      if (user.balance < totalAmount) {
        db.exec('ROLLBACK;');
        return res.status(400).json({
          error: `Insufficient wallet balance. Total required is PKR ${totalAmount.toLocaleString()}, but your balance is PKR ${user.balance.toLocaleString()}. Please deposit funds or choose direct transfer.`
        });
      }

      // 1. Deduct balance
      const newBalance = user.balance - totalAmount;
      db.prepare("UPDATE users SET balance = ?, updated_at = datetime('now') WHERE id = ?").run(newBalance, userId);

      // 2. Decrement stock
      db.prepare('UPDATE hen_products SET stock = stock - ? WHERE id = ?').run(qty, product.id);

      // 3. Add to user hens
      const existingHen = db.prepare("SELECT id, quantity FROM user_hens WHERE user_id = ? AND product_id = ? AND status = 'active'")
        .get(userId, product.id) as any;

      if (existingHen) {
        db.prepare("UPDATE user_hens SET quantity = quantity + ?, updated_at = datetime('now') WHERE id = ?")
          .run(qty, existingHen.id);
      } else {
        db.prepare(`
          INSERT INTO user_hens (user_id, product_id, quantity, last_collected_at)
          VALUES (?, ?, ?, datetime('now', '-12 hours'))
        `).run(userId, product.id, qty);
      }

      // 4. Record purchase request as approved
      db.prepare(`
        INSERT INTO hen_purchases (reference_no, user_id, product_id, quantity, unit_price, total_amount, payment_method, status, admin_notes, reviewed_at, reviewed_by)
        VALUES (?, ?, ?, ?, ?, ?, 'balance', 'approved', 'Instant wallet deduction', datetime('now'), 'SYSTEM')
      `).run(referenceNo, userId, product.id, qty, product.price, totalAmount);

      // 5. Record transaction in financial ledger
      db.prepare(`
        INSERT INTO transactions (reference_no, user_id, type, amount, balance_before, balance_after, status, description, related_reference, processed_by)
        VALUES (?, ?, 'hen_purchase', ?, ?, ?, 'completed', ?, ?, 'SYSTEM')
      `).run(
        genRef('TXN'),
        userId,
        -totalAmount,
        user.balance,
        newBalance,
        `Purchased ${qty}x ${product.name}`,
        referenceNo
      );

      db.exec('COMMIT;');
      return res.json({
        message: `Success! You have purchased ${qty} ${product.name}(s). Your flock is now active.`,
        reference_no: referenceNo,
        new_balance: newBalance
      });
    } catch (err: any) {
      db.exec('ROLLBACK;');
      console.error('Hen purchase error:', err);
      return res.status(500).json({ error: 'Purchase processing failed. Please try again.' });
    }
  } else {
    // Manual payment method: bank_transfer, easypaisa, jazzcash
    if (!paymentRef || !paymentRef.trim()) {
      return res.status(400).json({ error: 'Please enter the transaction reference / TID from your payment receipt.' });
    }

    db.prepare(`
      INSERT INTO hen_purchases (reference_no, user_id, product_id, quantity, unit_price, total_amount, payment_method, payment_ref, payment_proof, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(
      referenceNo,
      userId,
      product.id,
      qty,
      product.price,
      totalAmount,
      paymentMethod,
      paymentRef.trim(),
      paymentProof || null
    );

    return res.json({
      message: 'Purchase request submitted successfully. Once the farm administrator verifies your payment, the hens will be added to your account.',
      reference_no: referenceNo
    });
  }
});

router.get('/hen-purchases', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const purchases = db.prepare(`
    SELECT hp.*, p.name as product_name, p.breed as product_breed, p.image_url as product_image
    FROM hen_purchases hp
    JOIN hen_products p ON hp.product_id = p.id
    WHERE hp.user_id = ?
    ORDER BY hp.id DESC
  `).all(userId);
  res.json(purchases);
});

// 3. User Hens Owned
router.get('/my-hens', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const hens = db.prepare(`
    SELECT uh.id, uh.quantity, uh.purchased_at, uh.last_collected_at, uh.status,
           p.name, p.breed, p.description, p.eggs_per_day, p.image_url
    FROM user_hens uh
    JOIN hen_products p ON uh.product_id = p.id
    WHERE uh.user_id = ? AND uh.status = 'active'
    ORDER BY uh.id DESC
  `).all(userId);
  res.json(hens);
});

// 4. Collect Eggs module
router.get('/egg-collection-status', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  const intervalSetting = db.prepare("SELECT value FROM settings WHERE key = 'collection_interval_hours'").get() as any;
  const intervalHours = intervalSetting ? parseInt(intervalSetting.value, 10) : 12;

  const userHens = db.prepare(`
    SELECT uh.id, uh.quantity, uh.last_collected_at, p.name, p.eggs_per_day
    FROM user_hens uh
    JOIN hen_products p ON uh.product_id = p.id
    WHERE uh.user_id = ? AND uh.status = 'active'
  `).all(userId) as any[];

  let totalEligibleEggs = 0;
  const nowMs = Date.now();
  let nextAvailableInMinutes = 0;

  for (const hen of userHens) {
    const lastCollectMs = new Date(hen.last_collected_at).getTime();
    const diffHours = (nowMs - lastCollectMs) / (1000 * 60 * 60);

    if (diffHours >= intervalHours) {
      const cycles = Math.min(Math.floor(diffHours / intervalHours), 5);
      totalEligibleEggs += (hen.quantity * cycles);
    } else {
      const remainingMins = Math.ceil((intervalHours - diffHours) * 60);
      if (nextAvailableInMinutes === 0 || remainingMins < nextAvailableInMinutes) {
        nextAvailableInMinutes = remainingMins;
      }
    }
  }

  const eggInv = db.prepare('SELECT current_eggs, total_collected, total_sold FROM egg_inventory WHERE user_id = ?')
    .get(userId) as any || { current_eggs: 0, total_collected: 0, total_sold: 0 };

  const history = db.prepare(`
    SELECT id, quantity, collected_at, notes
    FROM egg_collections WHERE user_id = ? ORDER BY id DESC LIMIT 10
  `).all(userId);

  res.json({
    eligible_eggs: totalEligibleEggs,
    current_inventory_eggs: eggInv.current_eggs,
    total_collected: eggInv.total_collected,
    total_sold: eggInv.total_sold,
    interval_hours: intervalHours,
    next_collection_in_minutes: nextAvailableInMinutes,
    history
  });
});

router.post('/collect-eggs', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  const intervalSetting = db.prepare("SELECT value FROM settings WHERE key = 'collection_interval_hours'").get() as any;
  const intervalHours = intervalSetting ? parseInt(intervalSetting.value, 10) : 12;

  db.exec('BEGIN TRANSACTION;');
  try {
    const userHens = db.prepare(`
      SELECT uh.id, uh.quantity, uh.last_collected_at
      FROM user_hens uh
      WHERE uh.user_id = ? AND uh.status = 'active'
    `).all(userId) as any[];

    if (!userHens || userHens.length === 0) {
      db.exec('ROLLBACK;');
      return res.status(400).json({ error: 'You do not own any active hens yet. Please purchase hens first to start collecting eggs.' });
    }

    const nowMs = Date.now();
    let totalCollected = 0;
    const updateHenStmt = db.prepare("UPDATE user_hens SET last_collected_at = datetime('now') WHERE id = ?");

    for (const hen of userHens) {
      const lastCollectMs = new Date(hen.last_collected_at).getTime();
      const diffHours = (nowMs - lastCollectMs) / (1000 * 60 * 60);

      if (diffHours >= intervalHours) {
        const cycles = Math.min(Math.floor(diffHours / intervalHours), 5);
        const collectedForHen = hen.quantity * cycles;
        totalCollected += collectedForHen;
        updateHenStmt.run(hen.id);
      }
    }

    if (totalCollected === 0) {
      db.exec('ROLLBACK;');
      return res.status(400).json({
        error: 'No eggs are eligible for collection right now. Hens produce eggs every interval cycle. Please check back later!'
      });
    }

    // Update egg inventory
    db.prepare(`
      UPDATE egg_inventory
      SET current_eggs = current_eggs + ?,
          total_collected = total_collected + ?,
          updated_at = datetime('now')
      WHERE user_id = ?
    `).run(totalCollected, totalCollected, userId);

    // Record collection
    db.prepare(`
      INSERT INTO egg_collections (user_id, quantity, notes)
      VALUES (?, ?, ?)
    `).run(userId, totalCollected, `Collected ${totalCollected} fresh farm eggs`);

    db.exec('COMMIT;');

    const updatedInv = db.prepare('SELECT current_eggs, total_collected FROM egg_inventory WHERE user_id = ?').get(userId) as any;

    return res.json({
      message: `Successfully collected ${totalCollected} fresh eggs from your flock!`,
      collected_eggs: totalCollected,
      current_inventory_eggs: updatedInv.current_eggs
    });
  } catch (err: any) {
    db.exec('ROLLBACK;');
    console.error('Egg collection error:', err);
    return res.status(500).json({ error: 'Failed to process egg collection.' });
  }
});

// 5. Sell Eggs module
router.get('/sell-eggs-status', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const eggInv = db.prepare('SELECT current_eggs, total_sold FROM egg_inventory WHERE user_id = ?').get(userId) as any || { current_eggs: 0, total_sold: 0 };
  const eggPriceSetting = db.prepare("SELECT value FROM settings WHERE key = 'egg_sell_price'").get() as any;
  const eggPrice = eggPriceSetting ? parseInt(eggPriceSetting.value, 10) : 35;

  const salesHistory = db.prepare(`
    SELECT * FROM egg_sales WHERE user_id = ? ORDER BY id DESC
  `).all(userId);

  res.json({
    available_eggs: eggInv.current_eggs,
    total_sold: eggInv.total_sold,
    unit_price: eggPrice,
    sales_history: salesHistory
  });
});

router.post('/sell-eggs', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { quantity, paymentDestination, accountDetails } = req.body;

  const qty = parseInt(quantity, 10);
  if (!qty || qty < 1) {
    return res.status(400).json({ error: 'Please enter a valid egg quantity of at least 1.' });
  }

  const eggPriceSetting = db.prepare("SELECT value FROM settings WHERE key = 'egg_sell_price'").get() as any;
  const unitPrice = eggPriceSetting ? parseInt(eggPriceSetting.value, 10) : 35;
  const totalAmount = qty * unitPrice;
  const referenceNo = genRef('EGG');

  db.exec('BEGIN TRANSACTION;');
  try {
    const eggInv = db.prepare('SELECT current_eggs FROM egg_inventory WHERE user_id = ?').get(userId) as any;
    if (!eggInv || eggInv.current_eggs < qty) {
      db.exec('ROLLBACK;');
      return res.status(400).json({
        error: `Insufficient eggs in inventory. You have ${eggInv ? eggInv.current_eggs : 0} eggs available to sell, but requested ${qty}.`
      });
    }

    // Deduct available eggs from inventory (held during pending sale)
    db.prepare(`
      UPDATE egg_inventory
      SET current_eggs = current_eggs - ?,
          updated_at = datetime('now')
      WHERE user_id = ?
    `).run(qty, userId);

    // Insert sale request
    db.prepare(`
      INSERT INTO egg_sales (reference_no, user_id, quantity, unit_price, total_amount, payment_destination, account_details, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(
      referenceNo,
      userId,
      qty,
      unitPrice,
      totalAmount,
      paymentDestination || 'wallet_balance',
      accountDetails || null
    );

    db.exec('COMMIT;');

    return res.json({
      message: `Sale request for ${qty} eggs (PKR ${totalAmount.toLocaleString()}) submitted. Farm admin will review and approve payment into your account.`,
      reference_no: referenceNo,
      total_amount: totalAmount
    });
  } catch (err: any) {
    db.exec('ROLLBACK;');
    console.error('Egg sale error:', err);
    return res.status(500).json({ error: 'Failed to process egg sale request.' });
  }
});

// 6. Deposits
router.post('/deposit', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { amount, paymentMethod, senderAccount, senderName, transactionRef, proofImage } = req.body;

  const amt = parseInt(amount, 10);
  if (!amt || amt < 100) {
    return res.status(400).json({ error: 'Minimum deposit amount is PKR 100.' });
  }
  if (!transactionRef || !transactionRef.trim()) {
    return res.status(400).json({ error: 'Please enter the transaction reference / TID number.' });
  }

  const existing = db.prepare('SELECT id FROM deposit_requests WHERE transaction_ref = ?').get(transactionRef.trim());
  if (existing) {
    return res.status(400).json({ error: 'This transaction reference (TID) has already been submitted.' });
  }

  const referenceNo = genRef('DEP');
  db.prepare(`
    INSERT INTO deposit_requests (reference_no, user_id, amount, payment_method, sender_account, sender_name, transaction_ref, proof_image, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `).run(
    referenceNo,
    userId,
    amt,
    paymentMethod || 'bank_transfer',
    senderAccount || '',
    senderName || '',
    transactionRef.trim(),
    proofImage || null
  );

  res.json({
    message: 'Deposit verification request submitted successfully! Funds will be credited after admin verification.',
    reference_no: referenceNo
  });
});

router.get('/deposits', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const deposits = db.prepare(`
    SELECT * FROM deposit_requests WHERE user_id = ? ORDER BY id DESC
  `).all(userId);
  res.json(deposits);
});

// 7. Withdrawals
router.post('/withdraw', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { amount, paymentMethod, accountTitle, accountNumber } = req.body;

  const amt = parseInt(amount, 10);
  if (!amt || amt < 500) {
    return res.status(400).json({ error: 'Minimum withdrawal amount is PKR 500.' });
  }
  if (!accountTitle || !accountNumber) {
    return res.status(400).json({ error: 'Please provide both account title and account/mobile number.' });
  }

  db.exec('BEGIN TRANSACTION;');
  try {
    const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId) as any;
    if (user.balance < amt) {
      db.exec('ROLLBACK;');
      return res.status(400).json({
        error: `Insufficient balance. Available: PKR ${user.balance.toLocaleString()}, requested: PKR ${amt.toLocaleString()}.`
      });
    }

    // Deduct balance upfront (held in escrow during pending review)
    const newBalance = user.balance - amt;
    db.prepare("UPDATE users SET balance = ?, updated_at = datetime('now') WHERE id = ?").run(newBalance, userId);

    const referenceNo = genRef('WTH');
    db.prepare(`
      INSERT INTO withdrawal_requests (reference_no, user_id, amount, payment_method, account_title, account_number, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `).run(
      referenceNo,
      userId,
      amt,
      paymentMethod || 'easypaisa',
      accountTitle.trim(),
      accountNumber.trim()
    );

    // Ledger record
    db.prepare(`
      INSERT INTO transactions (reference_no, user_id, type, amount, balance_before, balance_after, status, description, related_reference)
      VALUES (?, ?, 'withdrawal', ?, ?, ?, 'pending', ?, ?)
    `).run(
      genRef('TXN'),
      userId,
      -amt,
      user.balance,
      newBalance,
      `Withdrawal request to ${accountTitle} (${paymentMethod})`,
      referenceNo
    );

    db.exec('COMMIT;');
    res.json({
      message: 'Withdrawal request submitted! Funds will be disbursed to your account after verification.',
      reference_no: referenceNo,
      new_balance: newBalance
    });
  } catch (err: any) {
    db.exec('ROLLBACK;');
    console.error('Withdrawal error:', err);
    res.status(500).json({ error: 'Failed to process withdrawal request.' });
  }
});

router.get('/withdrawals', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const withdrawals = db.prepare(`
    SELECT * FROM withdrawal_requests WHERE user_id = ? ORDER BY id DESC
  `).all(userId);
  res.json(withdrawals);
});

// 8. Transactions ledger
router.get('/transactions', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const transactions = db.prepare(`
    SELECT * FROM transactions WHERE user_id = ? ORDER BY id DESC LIMIT 50
  `).all(userId);
  res.json(transactions);
});

// 9. Referral program
router.get('/referrals', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const user = db.prepare('SELECT referral_code FROM users WHERE id = ?').get(userId) as any;

  const referredUsers = db.prepare(`
    SELECT u.id, u.full_name, u.username, u.created_at,
           (SELECT COUNT(*) FROM user_hens WHERE user_id = u.id) as hens_purchased,
           r.bonus_amount, r.status
    FROM users u
    JOIN referrals r ON r.referee_id = u.id
    WHERE r.referrer_id = ?
    ORDER BY u.id DESC
  `).all(userId);

  const bonusSetting = db.prepare("SELECT value FROM settings WHERE key = 'referral_bonus_pkr'").get() as any;
  const bonusPerReferral = bonusSetting ? parseInt(bonusSetting.value, 10) : 100;

  const totalEarned = db.prepare(`
    SELECT COALESCE(SUM(bonus_amount), 0) as total FROM referrals WHERE referrer_id = ? AND status = 'completed'
  `).get(userId) as any;

  res.json({
    referral_code: user.referral_code,
    bonus_per_referral: bonusPerReferral,
    total_referred: referredUsers.length,
    total_bonus_earned: totalEarned.total,
    referred_users: referredUsers
  });
});

// 10. Support tickets
router.post('/support-ticket', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { subject, message, priority } = req.body;

  if (!subject || !message) {
    return res.status(400).json({ error: 'Please enter both subject and message details.' });
  }

  db.prepare(`
    INSERT INTO support_tickets (user_id, subject, message, priority, status)
    VALUES (?, ?, ?, ?, 'open')
  `).run(userId, subject.trim(), message.trim(), priority || 'medium');

  res.json({ message: 'Support ticket submitted. Farm representative will respond shortly.' });
});

router.get('/support-tickets', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const tickets = db.prepare(`
    SELECT * FROM support_tickets WHERE user_id = ? ORDER BY id DESC
  `).all(userId);
  res.json(tickets);
});

export default router;
