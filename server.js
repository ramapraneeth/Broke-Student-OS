import express from 'express';
import cors from 'cors';
import pg from 'pg';

const { Pool } = pg;
const app = express();
const PORT = process.env.PORT || 3001;

const connectionString = "postgresql://neondb_owner:npg_ZtbPUjeFT39r@ep-damp-wildflower-azwjta3a-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

app.use(cors());
app.use(express.json());

// Initialize Database Schema
async function initDB() {
  try {
    const client = await pool.connect();
    
    // Create Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        mobile_number TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'student',
        is_setup_complete BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Ensure role column exists if table was previously created
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';
    `);

    // Create Parent-Child Link Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS parent_child_links (
        id TEXT PRIMARY KEY,
        parent_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        child_mobile TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(parent_id, child_mobile)
      );
    `);

    // Create Budgets Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS budgets (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        month_year TEXT NOT NULL,
        monthly_budget NUMERIC NOT NULL DEFAULT 1000,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, month_year)
      );
    `);

    // Create Expenses Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        amount NUMERIC NOT NULL,
        category TEXT NOT NULL,
        date TEXT NOT NULL,
        note TEXT,
        type TEXT NOT NULL DEFAULT 'personal',
        ref_id TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Create Split Bills Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS split_bills (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        total_amount NUMERIC NOT NULL,
        paid_by TEXT NOT NULL,
        participants JSONB NOT NULL,
        split_type TEXT NOT NULL DEFAULT 'equal',
        date TEXT NOT NULL,
        user_share NUMERIC NOT NULL DEFAULT 0,
        total_receivable NUMERIC NOT NULL DEFAULT 0,
        total_payable NUMERIC NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Create Hostel Expenses Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS hostel_expenses (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        total_amount NUMERIC NOT NULL,
        paid_by TEXT NOT NULL,
        members JSONB NOT NULL,
        split_method TEXT NOT NULL DEFAULT 'equal',
        shares JSONB NOT NULL,
        date TEXT NOT NULL,
        user_share NUMERIC NOT NULL DEFAULT 0,
        room_name TEXT NOT NULL DEFAULT 'Room 204',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Create Notifications Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        read BOOLEAN DEFAULT FALSE,
        event_key TEXT NOT NULL,
        monthly_cycle TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Create Notification Settings Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notification_settings (
        user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        browser_notifications BOOLEAN DEFAULT TRUE,
        budget_alerts BOOLEAN DEFAULT TRUE,
        custom_threshold_enabled BOOLEAN DEFAULT FALSE,
        custom_threshold_amount NUMERIC DEFAULT 700,
        spending_alerts BOOLEAN DEFAULT TRUE,
        prediction_alerts BOOLEAN DEFAULT TRUE,
        split_bill_alerts BOOLEAN DEFAULT TRUE,
        hostel_alerts BOOLEAN DEFAULT TRUE,
        saving_tips BOOLEAN DEFAULT TRUE,
        dispatched_keys JSONB DEFAULT '[]'::jsonb,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Create Push Subscriptions Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        subscription JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id)
      );
    `);

    client.release();
    console.log('✅ Neon PostgreSQL Database Tables Initialized with Notifications Support');
  } catch (err) {
    console.error('❌ Failed to initialize database tables:', err);
  }
}

initDB();

// === AUTH ROUTES ===

// Login
app.post('/api/auth/login', async (req, res) => {
  const { mobileNumber, password, role } = req.body;
  if (!mobileNumber || !password) {
    return res.status(400).json({ error: 'Mobile number and password required' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE mobile_number = $1', [mobileNumber]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found. Please create an account.' });
    }

    const user = result.rows[0];
    if (user.password !== password) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    // Update role if explicitly provided
    if (role && user.role !== role) {
      await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, user.id]);
      user.role = role;
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        mobileNumber: user.mobile_number,
        role: user.role || role || 'student',
        isSetupComplete: user.is_setup_complete,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Signup
app.post('/api/auth/signup', async (req, res) => {
  const { name, mobileNumber, password, role } = req.body;
  if (!name || !mobileNumber || !password) {
    return res.status(400).json({ error: 'Name, mobile number, and password required' });
  }

  const userRole = role || 'student';

  try {
    const existing = await pool.query('SELECT id FROM users WHERE mobile_number = $1', [mobileNumber]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'An account with this mobile number already exists.' });
    }

    const userId = `user_${Date.now()}`;
    await pool.query(
      'INSERT INTO users (id, name, mobile_number, password, role, is_setup_complete) VALUES ($1, $2, $3, $4, $5, $6)',
      [userId, name, mobileNumber, password, userRole, userRole === 'parent']
    );

    res.json({
      user: {
        id: userId,
        name,
        mobileNumber,
        role: userRole,
        isSetupComplete: userRole === 'parent',
      },
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

// Reset Password
app.post('/api/auth/forgot-password', async (req, res) => {
  const { mobileNumber, newPassword } = req.body;
  if (!mobileNumber || !newPassword) {
    return res.status(400).json({ error: 'Mobile number and new password required' });
  }

  try {
    const result = await pool.query(
      'UPDATE users SET password = $1 WHERE mobile_number = $2 RETURNING id',
      [newPassword, mobileNumber]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No account found with this mobile number.' });
    }

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('Password reset error:', err);
    res.status(500).json({ error: 'Server error during password reset' });
  }
});

// === PARENT & ADMIN MONITORING ROUTES ===

// Link a student child to parent
app.post('/api/parent/link-child', async (req, res) => {
  const { parentId, childMobile } = req.body;
  if (!parentId || !childMobile) {
    return res.status(400).json({ error: 'Parent ID and Student mobile number are required.' });
  }

  try {
    // Check if student exists
    const studentRes = await pool.query('SELECT id, name, mobile_number, is_setup_complete FROM users WHERE mobile_number = $1', [childMobile]);
    if (studentRes.rows.length === 0) {
      return res.status(404).json({ error: `No student account found with mobile ${childMobile}. Ask student to sign up first.` });
    }

    const student = studentRes.rows[0];
    const linkId = `link_${parentId}_${student.id}`;

    await pool.query(
      'INSERT INTO parent_child_links (id, parent_id, child_mobile) VALUES ($1, $2, $3) ON CONFLICT (parent_id, child_mobile) DO NOTHING',
      [linkId, parentId, childMobile]
    );

    res.json({
      success: true,
      student: {
        id: student.id,
        name: student.name,
        mobileNumber: student.mobile_number,
      },
    });
  } catch (err) {
    console.error('Link child error:', err);
    res.status(500).json({ error: 'Failed to link student account.' });
  }
});

// Get parent's linked children
app.get('/api/parent/children/:parentId', async (req, res) => {
  const { parentId } = req.params;
  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.mobile_number as "mobileNumber", u.is_setup_complete as "isSetupComplete", l.created_at as "linkedAt"
      FROM parent_child_links l
      JOIN users u ON l.child_mobile = u.mobile_number
      WHERE l.parent_id = $1
      ORDER BY l.created_at DESC
    `, [parentId]);

    res.json({ children: result.rows });
  } catch (err) {
    console.error('Fetch children error:', err);
    res.status(500).json({ error: 'Failed to fetch linked children' });
  }
});

// Unlink a child
app.delete('/api/parent/unlink-child', async (req, res) => {
  const { parentId, childMobile } = req.body;
  try {
    await pool.query('DELETE FROM parent_child_links WHERE parent_id = $1 AND child_mobile = $2', [parentId, childMobile]);
    res.json({ success: true });
  } catch (err) {
    console.error('Unlink child error:', err);
    res.status(500).json({ error: 'Failed to unlink student' });
  }
});

// === DATA SYNC / FETCH ROUTE ===
app.get('/api/data/:userId/:monthYear', async (req, res) => {
  const { userId, monthYear } = req.params;

  try {
    // 1. Get User
    const userRes = await pool.query('SELECT id, name, mobile_number, role, is_setup_complete FROM users WHERE id = $1', [userId]);
    const user = userRes.rows[0] || null;

    // 2. Get Budget
    const budgetRes = await pool.query('SELECT monthly_budget FROM budgets WHERE user_id = $1 AND month_year = $2', [userId, monthYear]);
    const monthlyBudget = budgetRes.rows.length > 0 ? parseFloat(budgetRes.rows[0].monthly_budget) : 1000;

    // 3. Get Expenses
    const expRes = await pool.query(
      'SELECT id, title, amount, category, date, note, type, ref_id as "refId", created_at as "createdAt" FROM expenses WHERE user_id = $1 ORDER BY date DESC, created_at DESC',
      [userId]
    );
    const expenses = expRes.rows.map(r => ({ ...r, amount: parseFloat(r.amount) }));

    // 4. Get Split Bills
    const splitRes = await pool.query(
      'SELECT id, title, total_amount as "totalAmount", paid_by as "paidBy", participants, split_type as "splitType", date, user_share as "userShare", total_receivable as "totalReceivable", total_payable as "totalPayable", created_at as "createdAt" FROM split_bills WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    const splitBills = splitRes.rows.map(r => ({
      ...r,
      totalAmount: parseFloat(r.totalAmount),
      userShare: parseFloat(r.userShare),
      totalReceivable: parseFloat(r.totalReceivable),
      totalPayable: parseFloat(r.totalPayable),
    }));

    // 5. Get Hostel Expenses
    const hostelRes = await pool.query(
      'SELECT id, title, total_amount as "totalAmount", paid_by as "paidBy", members, split_method as "splitMethod", shares, date, user_share as "userShare", room_name as "roomName", created_at as "createdAt" FROM hostel_expenses WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    const hostelExpenses = hostelRes.rows.map(r => ({
      ...r,
      totalAmount: parseFloat(r.totalAmount),
      userShare: parseFloat(r.userShare),
    }));

    res.json({
      user,
      monthlyBudget,
      expenses,
      splitBills,
      hostelExpenses,
    });
  } catch (err) {
    console.error('Fetch data error:', err);
    res.status(500).json({ error: 'Failed to retrieve data' });
  }
});

// === BUDGET ROUTE ===
app.post('/api/budget', async (req, res) => {
  const { userId, monthYear, name, monthlyBudget } = req.body;
  try {
    if (name) {
      await pool.query('UPDATE users SET name = $1, is_setup_complete = TRUE WHERE id = $2', [name, userId]);
    }
    const budgetId = `bgt_${userId}_${monthYear}`;
    await pool.query(`
      INSERT INTO budgets (id, user_id, month_year, monthly_budget)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, month_year)
      DO UPDATE SET monthly_budget = EXCLUDED.monthly_budget;
    `, [budgetId, userId, monthYear, monthlyBudget]);

    res.json({ success: true, monthlyBudget });
  } catch (err) {
    console.error('Budget update error:', err);
    res.status(500).json({ error: 'Failed to update budget' });
  }
});

// === EXPENSE ROUTES ===
app.post('/api/expenses', async (req, res) => {
  const { userId, title, amount, category, date, note, type, refId } = req.body;
  const id = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

  try {
    await pool.query(
      'INSERT INTO expenses (id, user_id, title, amount, category, date, note, type, ref_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [id, userId, title, amount, category, date, note || null, type || 'personal', refId || null]
    );

    res.json({
      id,
      title,
      amount: parseFloat(amount),
      category,
      date,
      note,
      type: type || 'personal',
      refId,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Add expense error:', err);
    res.status(500).json({ error: 'Failed to add expense' });
  }
});

app.put('/api/expenses/:id', async (req, res) => {
  const { id } = req.params;
  const { title, amount, category, date, note } = req.body;

  try {
    await pool.query(
      'UPDATE expenses SET title = $1, amount = $2, category = $3, date = $4, note = $5 WHERE id = $6',
      [title, amount, category, date, note || null, id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Update expense error:', err);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

app.delete('/api/expenses/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM expenses WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete expense error:', err);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// === SPLIT BILL ROUTES ===
app.post('/api/split-bills', async (req, res) => {
  const { userId, title, totalAmount, paidBy, participants, splitType, date, userShare, totalReceivable, totalPayable } = req.body;
  const id = `split_${Date.now()}`;

  try {
    await pool.query(
      'INSERT INTO split_bills (id, user_id, title, total_amount, paid_by, participants, split_type, date, user_share, total_receivable, total_payable) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
      [id, userId, title, totalAmount, paidBy, JSON.stringify(participants), splitType, date, userShare, totalReceivable, totalPayable]
    );

    res.json({
      id,
      title,
      totalAmount: parseFloat(totalAmount),
      paidBy,
      participants,
      splitType,
      date,
      userShare: parseFloat(userShare),
      totalReceivable: parseFloat(totalReceivable),
      totalPayable: parseFloat(totalPayable),
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Add split bill error:', err);
    res.status(500).json({ error: 'Failed to save split bill' });
  }
});

app.delete('/api/split-bills/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM split_bills WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete split bill error:', err);
    res.status(500).json({ error: 'Failed to delete split bill' });
  }
});

// === HOSTEL EXPENSE ROUTES ===
app.post('/api/hostel-expenses', async (req, res) => {
  const { userId, title, totalAmount, paidBy, members, splitMethod, shares, date, userShare, roomName } = req.body;
  const id = `hostel_${Date.now()}`;

  try {
    await pool.query(
      'INSERT INTO hostel_expenses (id, user_id, title, total_amount, paid_by, members, split_method, shares, date, user_share, room_name) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
      [id, userId, title, totalAmount, paidBy, JSON.stringify(members), splitMethod, JSON.stringify(shares), date, userShare, roomName || 'Room 204']
    );

    res.json({
      id,
      title,
      totalAmount: parseFloat(totalAmount),
      paidBy,
      members,
      splitMethod,
      shares,
      date,
      userShare: parseFloat(userShare),
      roomName: roomName || 'Room 204',
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Add hostel expense error:', err);
    res.status(500).json({ error: 'Failed to save hostel expense' });
  }
});

app.delete('/api/hostel-expenses/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM hostel_expenses WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete hostel expense error:', err);
    res.status(500).json({ error: 'Failed to delete hostel expense' });
  }
});

// === NOTIFICATION ROUTES ===

// Get all notifications and settings for user
app.get('/api/notifications/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const notifsResult = await pool.query(
      'SELECT id, user_id as "userId", type, title, message, read, event_key as "eventKey", monthly_cycle as "monthlyCycle", created_at as "createdAt" FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    const settingsResult = await pool.query(
      'SELECT * FROM notification_settings WHERE user_id = $1',
      [userId]
    );

    let settings = {
      browserNotifications: true,
      budgetAlerts: true,
      customThresholdEnabled: false,
      customThresholdAmount: 700,
      spendingAlerts: true,
      predictionAlerts: true,
      splitBillAlerts: true,
      hostelAlerts: true,
      savingTips: true,
      dispatchedKeys: [],
    };

    if (settingsResult.rows.length > 0) {
      const row = settingsResult.rows[0];
      settings = {
        browserNotifications: row.browser_notifications ?? true,
        budgetAlerts: row.budget_alerts ?? true,
        customThresholdEnabled: row.custom_threshold_enabled ?? false,
        customThresholdAmount: parseFloat(row.custom_threshold_amount || 700),
        spendingAlerts: row.spending_alerts ?? true,
        predictionAlerts: row.prediction_alerts ?? true,
        splitBillAlerts: row.split_bill_alerts ?? true,
        hostelAlerts: row.hostel_alerts ?? true,
        savingTips: row.saving_tips ?? true,
        dispatchedKeys: row.dispatched_keys || [],
      };
    }

    res.json({
      notifications: notifsResult.rows,
      settings,
    });
  } catch (err) {
    console.error('Fetch notifications error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Create / Dispatch a notification with strict duplicate eventKey prevention
app.post('/api/notifications', async (req, res) => {
  const { userId, type, title, message, eventKey, monthlyCycle } = req.body;
  if (!userId || !title || !message || !eventKey) {
    return res.status(400).json({ error: 'Missing required notification fields' });
  }

  try {
    // Check if eventKey already exists in notifications table
    const existing = await pool.query(
      'SELECT id, user_id as "userId", type, title, message, read, event_key as "eventKey", monthly_cycle as "monthlyCycle", created_at as "createdAt" FROM notifications WHERE user_id = $1 AND event_key = $2',
      [userId, eventKey]
    );

    if (existing.rows.length > 0) {
      return res.json({
        duplicate: true,
        message: 'Notification with this eventKey already dispatched',
        notification: existing.rows[0],
      });
    }

    const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const result = await pool.query(
      'INSERT INTO notifications (id, user_id, type, title, message, read, event_key, monthly_cycle) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, user_id as "userId", type, title, message, read, event_key as "eventKey", monthly_cycle as "monthlyCycle", created_at as "createdAt"',
      [id, userId, type, title, message, false, eventKey, monthlyCycle || '2026-08']
    );

    // Update dispatched_keys in notification_settings
    await pool.query(`
      INSERT INTO notification_settings (user_id, dispatched_keys)
      VALUES ($1, jsonb_build_array($2::text))
      ON CONFLICT (user_id)
      DO UPDATE SET dispatched_keys = (
        CASE 
          WHEN notification_settings.dispatched_keys ? $2 THEN notification_settings.dispatched_keys
          ELSE notification_settings.dispatched_keys || jsonb_build_array($2::text)
        END
      ),
      updated_at = NOW()
    `, [userId, eventKey]);

    res.json({
      success: true,
      duplicate: false,
      notification: result.rows[0],
    });
  } catch (err) {
    console.error('Create notification error:', err);
    res.status(500).json({ error: 'Failed to record notification' });
  }
});

// Mark single notification as read
app.put('/api/notifications/:id/read', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE notifications SET read = TRUE WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read for user
app.put('/api/notifications/read-all/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    await pool.query('UPDATE notifications SET read = TRUE WHERE user_id = $1', [userId]);
    res.json({ success: true });
  } catch (err) {
    console.error('Mark all read error:', err);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

// Clear/Delete all notifications for user
app.delete('/api/notifications/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    await pool.query('DELETE FROM notifications WHERE user_id = $1', [userId]);
    res.json({ success: true });
  } catch (err) {
    console.error('Clear notifications error:', err);
    res.status(500).json({ error: 'Failed to clear notifications' });
  }
});

// Save notification settings
app.post('/api/notifications/settings', async (req, res) => {
  const { 
    userId, 
    browserNotifications, 
    budgetAlerts, 
    customThresholdEnabled, 
    customThresholdAmount, 
    spendingAlerts, 
    predictionAlerts, 
    splitBillAlerts, 
    hostelAlerts, 
    savingTips 
  } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    await pool.query(`
      INSERT INTO notification_settings (
        user_id, 
        browser_notifications, 
        budget_alerts, 
        custom_threshold_enabled, 
        custom_threshold_amount, 
        spending_alerts, 
        prediction_alerts, 
        split_bill_alerts, 
        hostel_alerts, 
        saving_tips,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET 
        browser_notifications = EXCLUDED.browser_notifications,
        budget_alerts = EXCLUDED.budget_alerts,
        custom_threshold_enabled = EXCLUDED.custom_threshold_enabled,
        custom_threshold_amount = EXCLUDED.custom_threshold_amount,
        spending_alerts = EXCLUDED.spending_alerts,
        prediction_alerts = EXCLUDED.prediction_alerts,
        split_bill_alerts = EXCLUDED.split_bill_alerts,
        hostel_alerts = EXCLUDED.hostel_alerts,
        saving_tips = EXCLUDED.saving_tips,
        updated_at = NOW()
    `, [
      userId,
      browserNotifications ?? true,
      budgetAlerts ?? true,
      customThresholdEnabled ?? false,
      customThresholdAmount ?? 700,
      spendingAlerts ?? true,
      predictionAlerts ?? true,
      splitBillAlerts ?? true,
      hostelAlerts ?? true,
      savingTips ?? true,
    ]);

    res.json({ success: true });
  } catch (err) {
    console.error('Save notification settings error:', err);
    res.status(500).json({ error: 'Failed to save notification settings' });
  }
});

// Save Web Push Subscription
app.post('/api/notifications/subscribe', async (req, res) => {
  const { userId, subscription } = req.body;
  if (!userId || !subscription) {
    return res.status(400).json({ error: 'User ID and subscription required' });
  }

  try {
    const id = `sub_${Date.now()}`;
    await pool.query(`
      INSERT INTO push_subscriptions (id, user_id, subscription)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id)
      DO UPDATE SET subscription = EXCLUDED.subscription, created_at = NOW()
    `, [id, userId, JSON.stringify(subscription)]);

    res.json({ success: true });
  } catch (err) {
    console.error('Save push subscription error:', err);
    res.status(500).json({ error: 'Failed to save push subscription' });
  }
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Broke OS Neon Backend running at http://0.0.0.0:${PORT}`);
});

