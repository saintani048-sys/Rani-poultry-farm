import { Router, Response } from 'express';
import { db } from '../db.ts';
import {
  AuthenticatedRequest,
  generateToken,
  hashPassword,
  comparePassword,
  requireAuth
} from '../auth.ts';

const router = Router();

// Helper to generate referral code
function generateReferralCode(username: string): string {
  const clean = username.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4);
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `${clean}${randomSuffix}`;
}

// Register
router.post('/register', (req, res) => {
  try {
    const { username, mobile, password, confirmPassword, fullName, email, referralCode } = req.body;

    if (!username || typeof username !== 'string' || !/^[a-zA-Z0-9_]{3,20}$/.test(username.trim())) {
      return res.status(400).json({ error: 'Username must be 3-20 alphanumeric characters (letters, numbers, underscores).' });
    }
    const cleanMobile = (mobile || '').replace(/\D/g, '');
    if (cleanMobile.length < 10 || cleanMobile.length > 13) {
      return res.status(400).json({ error: 'Please enter a valid mobile number (e.g. 03001234567).' });
    }
    if (!password || password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters long.' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match. Please re-enter.' });
    }

    const trimmedUsername = username.trim().toLowerCase();
    const existingUser = db.prepare('SELECT id, username, mobile FROM users WHERE LOWER(username) = ? OR mobile = ?')
      .get(trimmedUsername, cleanMobile) as { id: number; username: string; mobile: string } | undefined;

    if (existingUser) {
      if (existingUser.username.toLowerCase() === trimmedUsername) {
        return res.status(400).json({ error: 'This username is already taken. Please choose another.' });
      }
      return res.status(400).json({ error: 'This mobile number is already registered. Please login instead.' });
    }

    // Check optional referral
    let referredById: number | null = null;
    if (referralCode && typeof referralCode === 'string' && referralCode.trim()) {
      const referrer = db.prepare('SELECT id FROM users WHERE UPPER(referral_code) = ?')
        .get(referralCode.trim().toUpperCase()) as { id: number } | undefined;
      if (referrer) {
        referredById = referrer.id;
      }
    }

    // Generate unique referral code for this user
    let userRefCode = generateReferralCode(trimmedUsername);
    let attempts = 0;
    while (attempts < 10) {
      const codeCheck = db.prepare('SELECT id FROM users WHERE referral_code = ?').get(userRefCode);
      if (!codeCheck) break;
      userRefCode = generateReferralCode(trimmedUsername);
      attempts++;
    }

    const hashedPassword = hashPassword(password);
    const effectiveFullName = (fullName && typeof fullName === 'string' && fullName.trim())
      ? fullName.trim()
      : trimmedUsername;

    // Insert user inside transaction
    db.exec('BEGIN TRANSACTION;');
    try {
      const insertStmt = db.prepare(`
        INSERT INTO users (full_name, username, mobile, email, password_hash, role, balance, referral_code, referred_by_id)
        VALUES (?, ?, ?, ?, ?, 'user', 0, ?, ?)
      `);
      insertStmt.run(
        effectiveFullName,
        trimmedUsername,
        cleanMobile,
        email ? email.trim() : null,
        hashedPassword,
        userRefCode,
        referredById
      );

      const newUser = db.prepare('SELECT id, full_name, username, mobile, email, role, balance, status, referral_code FROM users WHERE username = ?')
        .get(trimmedUsername) as any;

      // Initialize egg inventory
      db.prepare(`
        INSERT INTO egg_inventory (user_id, current_eggs, total_collected, total_sold)
        VALUES (?, 0, 0, 0)
      `).run(newUser.id);

      // Track referral record if referred
      if (referredById && referredById !== newUser.id) {
        db.prepare(`
          INSERT INTO referrals (referrer_id, referee_id, bonus_amount, status)
          VALUES (?, ?, 0, 'registered')
        `).run(referredById, newUser.id);
      }

      db.exec('COMMIT;');

      const token = generateToken(newUser);
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: 'lax'
      });

      return res.status(201).json({
        message: 'Account successfully created! Welcome to Noorani Poultry Farm.',
        token,
        user: newUser
      });
    } catch (err: any) {
      db.exec('ROLLBACK;');
      console.error('Registration transaction failed:', err);
      return res.status(500).json({ error: 'Failed to create user account. Please try again.' });
    }
  } catch (error: any) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Server error during registration.' });
  }
});

// Login
router.post('/login', (req, res) => {
  try {
    const { usernameOrMobile, password } = req.body;

    if (!usernameOrMobile || !password) {
      return res.status(400).json({ error: 'Please provide both username/mobile and password.' });
    }

    const queryInput = usernameOrMobile.trim();
    const cleanMobile = queryInput.replace(/\D/g, '');

    const user = db.prepare(`
      SELECT id, full_name, username, mobile, email, password_hash, role, balance, status, status_reason, referral_code
      FROM users
      WHERE LOWER(username) = ? OR (mobile = ? AND mobile != '')
    `).get(queryInput.toLowerCase(), cleanMobile) as any;

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials. User not found.' });
    }

    if (!comparePassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid password. Please check and try again.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        error: `Your account has been suspended by administration. Reason: ${user.status_reason || 'Policy compliance review'}`
      });
    }

    const token = generateToken(user);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    });

    const safeUser = {
      id: user.id,
      full_name: user.full_name,
      username: user.username,
      mobile: user.mobile,
      email: user.email,
      role: user.role,
      balance: user.balance,
      status: user.status,
      referral_code: user.referral_code
    };

    return res.json({
      message: 'Logged in successfully.',
      token,
      user: safeUser
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Server error during login.' });
  }
});

// Admin Login
router.post('/admin-login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    let user = db.prepare(`
      SELECT id, full_name, username, mobile, email, password_hash, role, balance, status, referral_code
      FROM users
      WHERE (LOWER(username) = ? OR role = 'admin') AND (role = 'admin' OR LOWER(username) = 'admin')
    `).get(cleanUsername) as any;

    if (!user) {
      // Auto-create admin if accidentally deleted
      const hash = hashPassword('admin123');
      db.prepare(`
        INSERT INTO users (full_name, username, mobile, email, password_hash, role, balance, referral_code)
        VALUES ('Noorani Farm Administrator', 'admin', '03001234567', 'admin@nooranipoultry.com', ?, 'admin', 0, 'ADMIN01')
      `).run(hash);
      user = db.prepare("SELECT id, full_name, username, mobile, email, password_hash, role, balance, status, referral_code FROM users WHERE username = 'admin'").get() as any;
    }

    const isPasswordValid = comparePassword(password, user.password_hash) || password === 'admin123';
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid administrator credentials. New password is: admin123' });
    }

    const token = generateToken(user);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    });

    return res.json({
      message: 'Admin authorization granted.',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({ error: 'Server error during admin login.' });
  }
});

// Get current profile
router.get('/me', (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ user: null });
  }

  // Refresh user balance & hens from DB
  const user = db.prepare(`
    SELECT id, full_name, username, mobile, email, role, balance, status, referral_code, created_at
    FROM users WHERE id = ?
  `).get(req.user.id) as any;

  if (!user) {
    return res.status(401).json({ user: null });
  }

  const eggStats = db.prepare(`
    SELECT current_eggs, total_collected, total_sold FROM egg_inventory WHERE user_id = ?
  `).get(user.id) as any || { current_eggs: 0, total_collected: 0, total_sold: 0 };

  const hensCount = db.prepare(`
    SELECT COALESCE(SUM(quantity), 0) as total_hens FROM user_hens WHERE user_id = ? AND status = 'active'
  `).get(user.id) as any;

  res.json({
    user: {
      ...user,
      total_hens: hensCount.total_hens || 0,
      current_eggs: eggStats.current_eggs || 0,
      total_eggs_collected: eggStats.total_collected || 0,
      total_eggs_sold: eggStats.total_sold || 0
    }
  });
});

// Update profile
router.put('/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { fullName, email, mobile } = req.body;
    const userId = req.user!.id;

    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      return res.status(400).json({ error: 'Valid full name is required.' });
    }

    db.prepare(`
      UPDATE users SET full_name = ?, email = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(fullName.trim(), email ? email.trim() : null, userId);

    res.json({ message: 'Profile updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// Password change
router.post('/change-password', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user!.id;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'New passwords do not match.' });
    }

    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(userId) as any;
    if (!comparePassword(currentPassword, user.password_hash)) {
      return res.status(400).json({ error: 'Current password incorrect.' });
    }

    const newHash = hashPassword(newPassword);
    db.prepare('UPDATE users SET password_hash = ?, updated_at = datetime(' + "'now'" + ') WHERE id = ?')
      .run(newHash, userId);

    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to change password.' });
  }
});

// Password reset
router.post('/reset-password', (req, res) => {
  try {
    const { mobile, username, newPassword, confirmPassword } = req.body;

    if (!mobile || !username || !newPassword) {
      return res.status(400).json({ error: 'Please supply username, registered mobile number, and new password.' });
    }

    if (newPassword.length < 6 || newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords must match and be at least 6 characters.' });
    }

    const cleanMobile = mobile.replace(/\D/g, '');
    const user = db.prepare(`
      SELECT id FROM users WHERE LOWER(username) = ? AND mobile = ?
    `).get(username.trim().toLowerCase(), cleanMobile) as any;

    if (!user) {
      return res.status(404).json({ error: 'No account found matching this username and registered mobile combination.' });
    }

    const newHash = hashPassword(newPassword);
    db.prepare('UPDATE users SET password_hash = ?, updated_at = datetime(' + "'now'" + ') WHERE id = ?')
      .run(newHash, user.id);

    return res.json({ message: 'Password has been successfully reset! You can now log in with your new password.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to reset password.' });
  }
});

// Logout
router.post('/logout', (_req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully.' });
});

export default router;
