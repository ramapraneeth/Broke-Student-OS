import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pg from 'pg';
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// === NODEMAILER EMAIL TRANSPORTER ===
const GMAIL_USER = process.env.GMAIL_USER || 'infodesk.college@gmail.com';
const GMAIL_APP_PASSWORD = (process.env.GMAIL_APP_PASSWORD || 'dtlz boee luyv kgpk').replace(/\s+/g, '');

const mailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD,
  },
});

/**
 * Dispatch Branded HTML Email for 1-Minute Expiring OTP Verification
 */
async function sendOtpEmail(toEmail, otpCode, reason) {
  const reasonTitles = {
    login: 'Login Security Verification',
    signup: 'Confirm Your Registration',
    link_child: 'Student Account Linking Consent',
    forgot_password: 'Password Reset Verification',
  };

  const title = reasonTitles[reason] || 'Security Verification Code';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; margin: 0; padding: 20px; }
          .card { max-width: 500px; margin: 0 auto; background: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08); border: 1px solid #E2E8F0; }
          .header { background: linear-gradient(135deg, #4F46E5 0%, #3730A3 100%); padding: 30px 24px; text-align: center; color: #FFFFFF; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
          .header p { margin: 6px 0 0 0; font-size: 13px; color: #E0E7FF; }
          .body { padding: 32px 24px; text-align: center; }
          .otp-box { background: #EEF2FF; border: 2px dashed #4F46E5; border-radius: 14px; padding: 18px 24px; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #3730A3; margin: 24px 0; display: inline-block; }
          .expiry-badge { display: inline-flex; align-items: center; gap: 6px; background: #FEF2F2; color: #DC2626; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; border: 1px solid #FECACA; }
          .footer { padding: 20px 24px; background: #F8FAFC; border-top: 1px solid #E2E8F0; text-align: center; font-size: 12px; color: #94A3B8; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h1>🛡️ Broke OS</h1>
            <p>${title}</p>
          </div>
          <div class="body">
            <p style="color: #475569; font-size: 15px; margin: 0 0 12px 0;">Use the 6-digit verification code below to verify your email address:</p>
            <div class="otp-box">${otpCode}</div>
            <br>
            <div class="expiry-badge">⏳ Strictly valid for 1 minute (60 seconds)</div>
            <p style="color: #64748B; font-size: 13px; margin: 24px 0 0 0;">If you did not request this verification code, please ignore this email.</p>
          </div>
          <div class="footer">
            Broke OS — Intelligent Personal Finance Manager for Students
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const info = await mailTransporter.sendMail({
      from: `"Broke OS Security" <${GMAIL_USER}>`,
      to: toEmail,
      subject: `🔐 [${otpCode}] Your Broke OS Verification Code (Expires in 1 min)`,
      html,
    });
    console.log(`📧 [Gmail SMTP] OTP email dispatched to ${toEmail} (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.warn(`⚠️ [Gmail SMTP] Email send error for ${toEmail}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Dispatch Branded Expense Alert Email (Monthly Budget Exceeded or Single Limit Exceeded)
 */
async function sendExpenseAlertEmail({
  studentEmail,
  parentEmails,
  expenseData,
  monthlyBudget,
  totalSpent,
  remainingBudget,
  alertType, // 'monthly_limit_exceeded' | 'single_limit_exceeded' | 'near_limit'
  studentName = 'Student'
}) {
  const { title, amount, category, date } = expenseData;

  const isMonthlyExceeded = alertType === 'monthly_limit_exceeded';
  const isNearLimit = alertType === 'near_limit';
  const overspentAmount = Math.max(0, totalSpent - monthlyBudget);

  const headerBg = isMonthlyExceeded
    ? 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)'
    : isNearLimit
    ? 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)'
    : 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)';

  const badgeTitle = isMonthlyExceeded
    ? '🚨 URGENT: Monthly Budget Limit Exceeded!'
    : isNearLimit
    ? '⚠️ Warning: 85%+ of Monthly Budget Reached'
    : '💳 High-Value Expense Alert';

  const subtitle = isMonthlyExceeded
    ? `Monthly limit of ₹${Math.round(monthlyBudget)} has been exceeded by ₹${Math.round(overspentAmount)}`
    : isNearLimit
    ? `Current monthly spending is ₹${Math.round(totalSpent)} out of ₹${Math.round(monthlyBudget)} budget`
    : `An expense of ₹${amount} was recorded`;

  const emailSubject = isMonthlyExceeded
    ? `🚨 URGENT: Monthly Budget Exceeded by ₹${Math.round(overspentAmount)} (${studentName})`
    : isNearLimit
    ? `⚠️ Broke OS Warning: ${studentName} is near their monthly budget limit`
    : `💳 Broke OS Alert: ₹${amount} recorded for "${title}" (${studentName})`;

  const statusCard = isMonthlyExceeded ? `
    <div style="background: #FEF2F2; border: 1.5px solid #FECACA; border-radius: 14px; padding: 16px; text-align: center; margin-top: 20px;">
      <div style="font-size: 13px; color: #991B1B; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Budget Status: Exceeded</div>
      <div style="font-size: 24px; font-weight: 800; color: #DC2626; margin: 4px 0;">Over budget by ₹${Math.round(overspentAmount)}</div>
      <div style="font-size: 13px; color: #7F1D1D;">Total Spent: ₹${Math.round(totalSpent)} / Monthly Budget: ₹${Math.round(monthlyBudget)}</div>
    </div>
  ` : `
    <div style="background: #F0FDF4; border: 1.5px solid #BBF7D0; border-radius: 14px; padding: 16px; text-align: center; margin-top: 20px;">
      <div style="font-size: 13px; color: #166534; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Remaining Monthly Budget</div>
      <div style="font-size: 24px; font-weight: 800; color: #16A34A; margin: 4px 0;">₹${Math.round(remainingBudget)}</div>
      <div style="font-size: 13px; color: #15803D;">Spent so far: ₹${Math.round(totalSpent)} of ₹${Math.round(monthlyBudget)}</div>
    </div>
  `;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F8FAFC; margin: 0; padding: 20px; }
          .card { max-width: 520px; margin: 0 auto; background: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08); border: 1px solid #E2E8F0; }
          .header { background: ${headerBg}; padding: 28px 24px; text-align: center; color: #FFFFFF; }
          .body { padding: 28px 24px; }
          .amount-tag { font-size: 32px; font-weight: 800; color: #0F172A; margin: 8px 0; }
          .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .details-table td { padding: 10px 0; border-bottom: 1px solid #F1F5F9; font-size: 14px; }
          .details-table td:first-child { color: #64748B; font-weight: 600; width: 45%; }
          .details-table td:last-child { color: #0F172A; font-weight: 700; text-align: right; }
          .footer { padding: 18px 24px; background: #F8FAFC; border-top: 1px solid #E2E8F0; text-align: center; font-size: 12px; color: #94A3B8; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h1 style="margin:0; font-size: 20px; font-weight: 800;">${badgeTitle}</h1>
            <p style="margin: 6px 0 0 0; font-size: 13px; color: #FEE2E2;">${subtitle}</p>
          </div>
          <div class="body">
            <div style="text-align: center; margin-bottom: 14px;">
              <div style="font-size: 13px; color: #64748B; font-weight: 600;">Latest Expense Recorded</div>
              <div class="amount-tag">₹${amount}</div>
              <div style="font-size: 15px; color: #475569; font-weight: 700;">"${title}"</div>
            </div>

            <table class="details-table">
              <tr>
                <td>Student</td>
                <td>${studentName} (${studentEmail})</td>
              </tr>
              <tr>
                <td>Expense Category</td>
                <td>${category}</td>
              </tr>
              <tr>
                <td>Transaction Date</td>
                <td>${date}</td>
              </tr>
              <tr>
                <td>Monthly Budget Limit</td>
                <td>₹${Math.round(monthlyBudget)}</td>
              </tr>
              <tr>
                <td>Total Spent This Month</td>
                <td>₹${Math.round(totalSpent)}</td>
              </tr>
            </table>

            ${statusCard}
          </div>
          <div class="footer">
            Broke OS — Family Finance & Safety System • Sent from infodesk.college@gmail.com
          </div>
        </div>
      </body>
    </html>
  `;

  const recipients = [studentEmail, ...parentEmails].filter(Boolean);
  if (recipients.length === 0) return;

  try {
    const info = await mailTransporter.sendMail({
      from: `"Broke OS Family Alerts" <${GMAIL_USER}>`,
      to: recipients.join(','),
      subject: emailSubject,
      html,
    });
    console.log(`📧 [Gmail SMTP] Alert email (${alertType}) successfully delivered to: ${recipients.join(', ')} (MessageId: ${info.messageId})`);
  } catch (err) {
    console.warn('⚠️ [Gmail SMTP] Alert email delivery error:', err.message);
  }
}

// === DATABASE SCHEMA INITIALIZATION ===
async function initDB() {
  try {
    const client = await pool.connect();
    
    // Create Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        mobile_number TEXT,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'student',
        is_setup_complete BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Ensure email and role columns exist
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';
    `);

    // Create Parent-Child Link Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS parent_child_links (
        id TEXT PRIMARY KEY,
        parent_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        child_email TEXT,
        child_mobile TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Ensure child_email column exists and legacy mobile constraints are relaxed
    await client.query(`
      ALTER TABLE parent_child_links ADD COLUMN IF NOT EXISTS child_email TEXT;
      ALTER TABLE parent_child_links ALTER COLUMN child_mobile DROP NOT NULL;
      ALTER TABLE users ALTER COLUMN mobile_number DROP NOT NULL;
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
        custom_threshold_amount NUMERIC DEFAULT 500,
        spending_alerts BOOLEAN DEFAULT TRUE,
        prediction_alerts BOOLEAN DEFAULT TRUE,
        split_bill_alerts BOOLEAN DEFAULT TRUE,
        hostel_alerts BOOLEAN DEFAULT TRUE,
        saving_tips BOOLEAN DEFAULT TRUE,
        dispatched_keys JSONB DEFAULT '[]'::jsonb,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Create Email Verifications Table (Strict 1-Minute Expiration)
    await client.query(`
      CREATE TABLE IF NOT EXISTS email_verifications (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        otp_code TEXT NOT NULL,
        reason TEXT DEFAULT 'general',
        expires_at TIMESTAMPTZ NOT NULL,
        verified BOOLEAN DEFAULT FALSE,
        attempts INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    client.release();
    console.log('✅ Neon PostgreSQL Database Initialized with Email Authentication & 1-Minute Expiry Support');
  } catch (err) {
    console.error('❌ Failed to initialize database tables:', err);
  }
}

initDB();

// === AUTHENTICATION & EMAIL OTP ROUTES ===

// Send Email Verification Code (1-Minute Expiration)
app.post('/api/auth/send-email-otp', async (req, res) => {
  const { email, reason, role } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email address is required.' });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    // 1. Role validation for login
    if (reason === 'login') {
      const userRes = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1', [cleanEmail]);
      if (userRes.rows.length === 0) {
        return res.status(404).json({ error: 'No account found with this email address. Please sign up.' });
      }
      const user = userRes.rows[0];
      const accountRole = user.role || 'student';
      const requestedRole = role || 'student';
      if (requestedRole === 'student' && accountRole === 'parent') {
        return res.status(403).json({ error: 'This account is registered as a Parent / Guardian. Please use the Parent Login portal.' });
      }
      if (requestedRole === 'parent' && accountRole === 'student') {
        return res.status(403).json({ error: 'This account is registered as a Student. Please use the Student Login portal.' });
      }
    }

    // 2. Existing check for signup
    if (reason === 'signup') {
      const userRes = await pool.query('SELECT id FROM users WHERE LOWER(email) = $1', [cleanEmail]);
      if (userRes.rows.length > 0) {
        return res.status(400).json({ error: 'An account with this email address already exists. Please log in.' });
      }
    }

    // 3. Check for child linking
    if (reason === 'link_child') {
      const studentRes = await pool.query('SELECT id, name, role FROM users WHERE LOWER(email) = $1', [cleanEmail]);
      if (studentRes.rows.length === 0) {
        return res.status(404).json({ error: `No student account found with email ${cleanEmail}. Ask student to sign up first.` });
      }
      if (studentRes.rows[0].role !== 'student') {
        return res.status(400).json({ error: 'The specified email belongs to a parent account, not a student.' });
      }
    }

    // 4. Generate 6-digit numeric OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpId = `eotp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    // Invalidate previous unverified OTPs for same email & reason
    await pool.query('DELETE FROM email_verifications WHERE LOWER(email) = $1 AND reason = $2', [cleanEmail, reason || 'general']);

    // Insert with strictly 1-Minute expiration (NOW() + INTERVAL '1 minute')
    await pool.query(`
      INSERT INTO email_verifications (id, email, otp_code, reason, expires_at)
      VALUES ($1, $2, $3, $4, NOW() + INTERVAL '1 minute')
    `, [otpId, cleanEmail, otpCode, reason || 'general']);

    // Send the branded email
    await sendOtpEmail(cleanEmail, otpCode, reason);

    console.log(`📧 [Email OTP] Generated for ${cleanEmail} (${reason}): [ ${otpCode} ] — Valid for 60s`);

    res.json({
      success: true,
      message: `A 6-digit verification code was sent to ${cleanEmail} (valid for 1 minute).`,
      email: cleanEmail,
      otp: otpCode, // Provided for live simulation/toast
      expiresInSeconds: 60,
    });
  } catch (err) {
    console.error('Send Email OTP error:', err);
    res.status(500).json({ error: 'Failed to send email verification code.' });
  }
});

// Verify Email Code (Checks 1-Minute Expiry)
app.post('/api/auth/verify-email-otp', async (req, res) => {
  const { email, otp, reason } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and 6-digit verification code are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanOtp = otp.toString().trim();

  try {
    const result = await pool.query(`
      SELECT * FROM email_verifications
      WHERE LOWER(email) = $1 AND reason = $2 AND verified = FALSE AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `, [cleanEmail, reason || 'general']);

    if (result.rows.length === 0) {
      return res.status(400).json({ 
        error: 'Verification code has expired (1-minute limit) or was not requested. Please request a new code.' 
      });
    }

    const record = result.rows[0];
    if (record.otp_code !== cleanOtp) {
      await pool.query('UPDATE email_verifications SET attempts = attempts + 1 WHERE id = $1', [record.id]);
      return res.status(400).json({ error: 'Invalid verification code. Please check your email and try again.' });
    }

    // Mark verified
    await pool.query('UPDATE email_verifications SET verified = TRUE WHERE id = $1', [record.id]);

    res.json({
      success: true,
      message: 'Email verified successfully!',
      email: cleanEmail,
    });
  } catch (err) {
    console.error('Verify Email OTP error:', err);
    res.status(500).json({ error: 'Failed to verify email code.' });
  }
});

// User Login (Email + Password + Role Check)
app.post('/api/auth/login', async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email address and password are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    const result = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Account not found. Please create an account.' });
    }

    const user = result.rows[0];
    if (user.password !== password) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    const accountRole = user.role || 'student';
    const requestedRole = role || 'student';

    // Strict Role Enforcement:
    if (requestedRole === 'student' && accountRole === 'parent') {
      return res.status(403).json({
        error: 'This account is registered as a Parent / Guardian. Please use the Parent Login portal.',
      });
    }

    if (requestedRole === 'parent' && accountRole === 'student') {
      return res.status(403).json({
        error: 'This account is registered as a Student. Please use the Student Login portal.',
      });
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: accountRole,
        isSetupComplete: user.is_setup_complete,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// User Signup (Name + Email + Password + Role)
app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email address, and password are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const userRole = role || 'student';

  try {
    const existing = await pool.query('SELECT id FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    const userId = `user_${Date.now()}`;
    await pool.query(
      'INSERT INTO users (id, name, email, password, role, is_setup_complete) VALUES ($1, $2, $3, $4, $5, $6)',
      [userId, name, cleanEmail, password, userRole, userRole === 'parent']
    );

    res.json({
      user: {
        id: userId,
        name,
        email: cleanEmail,
        role: userRole,
        isSetupComplete: userRole === 'parent',
      },
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Server error during signup.' });
  }
});

// Reset Password via Email
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Email and new password required.' });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    const result = await pool.query(
      'UPDATE users SET password = $1 WHERE LOWER(email) = $2 RETURNING id',
      [newPassword, cleanEmail]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No account found with this email address.' });
    }

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Password reset error:', err);
    res.status(500).json({ error: 'Server error during password reset.' });
  }
});

// === PARENT & GUARDIAN MONITORING ROUTES ===

// Search Student Accounts by Email or Name
app.get('/api/parent/search-students', async (req, res) => {
  const query = (req.query.query || '').toString().trim().toLowerCase();
  if (!query) {
    return res.json({ students: [] });
  }

  try {
    const result = await pool.query(`
      SELECT id, name, email, is_setup_complete as "isSetupComplete"
      FROM users
      WHERE role = 'student' AND (LOWER(email) LIKE $1 OR LOWER(name) LIKE $1)
      ORDER BY name ASC
      LIMIT 10
    `, [`%${query}%`]);

    res.json({ students: result.rows });
  } catch (err) {
    console.error('Search students error:', err);
    res.status(500).json({ error: 'Failed to search student accounts.' });
  }
});

// Link Student Child via Student Email (with 1-minute OTP consent)
app.post('/api/parent/link-child', async (req, res) => {
  const { parentId, childEmail, otp } = req.body;
  if (!parentId || !childEmail) {
    return res.status(400).json({ error: 'Parent ID and Student email are required.' });
  }

  const cleanChildEmail = childEmail.trim().toLowerCase();

  try {
    const studentRes = await pool.query('SELECT id, name, email, role, is_setup_complete FROM users WHERE LOWER(email) = $1', [cleanChildEmail]);
    if (studentRes.rows.length === 0) {
      return res.status(404).json({ error: `No student account found with email ${cleanChildEmail}. Ask student to sign up first.` });
    }

    const student = studentRes.rows[0];
    if (student.role !== 'student') {
      return res.status(400).json({ error: 'The specified email belongs to a parent account, not a student.' });
    }

    // If OTP provided, verify it
    if (otp) {
      const otpRes = await pool.query(`
        SELECT * FROM email_verifications
        WHERE LOWER(email) = $1 AND reason = 'link_child' AND verified = FALSE AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 1
      `, [cleanChildEmail]);

      if (otpRes.rows.length === 0) {
        return res.status(400).json({ error: 'Student verification code has expired (1-minute limit). Please request a new code.' });
      }

      if (otpRes.rows[0].otp_code !== otp.toString().trim()) {
        return res.status(400).json({ error: 'Incorrect verification code. Please ask the student for the 6-digit code sent to their email.' });
      }

      // Mark verified
      await pool.query('UPDATE email_verifications SET verified = TRUE WHERE id = $1', [otpRes.rows[0].id]);
    }

    const linkId = `link_${parentId}_${student.id}`;

    await pool.query(
      'INSERT INTO parent_child_links (id, parent_id, child_email) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [linkId, parentId, cleanChildEmail]
    );

    res.json({
      success: true,
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
      },
    });
  } catch (err) {
    console.error('Link child error:', err);
    res.status(500).json({ error: 'Failed to link student account.' });
  }
});

// Get Parent's Linked Children
app.get('/api/parent/children/:parentId', async (req, res) => {
  const { parentId } = req.params;
  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.email, u.is_setup_complete as "isSetupComplete", l.created_at as "linkedAt"
      FROM parent_child_links l
      JOIN users u ON LOWER(l.child_email) = LOWER(u.email)
      WHERE l.parent_id = $1
      ORDER BY l.created_at DESC
    `, [parentId]);

    res.json({ children: result.rows });
  } catch (err) {
    console.error('Fetch children error:', err);
    res.status(500).json({ error: 'Failed to fetch linked children.' });
  }
});

// Unlink Child
app.delete('/api/parent/unlink-child', async (req, res) => {
  const { parentId, childEmail } = req.body;
  const cleanEmail = (childEmail || '').trim().toLowerCase();
  try {
    await pool.query('DELETE FROM parent_child_links WHERE parent_id = $1 AND LOWER(child_email) = $2', [parentId, cleanEmail]);
    res.json({ success: true });
  } catch (err) {
    console.error('Unlink child error:', err);
    res.status(500).json({ error: 'Failed to unlink student.' });
  }
});

// === DATA SYNC / FETCH ROUTE ===
app.get('/api/data/:userId/:monthYear', async (req, res) => {
  const { userId, monthYear } = req.params;

  try {
    // 1. Get User
    const userRes = await pool.query('SELECT id, name, email, role, is_setup_complete FROM users WHERE id = $1', [userId]);
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
    console.error('Data fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

// Update Budget
app.post('/api/budget', async (req, res) => {
  const { userId, monthYear, amount } = req.body;
  const monthlyBudget = parseFloat(amount);

  try {
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

// === EXPENSE ROUTES (WITH THRESHOLD-BASED EMAIL ALERTS) ===
app.post('/api/expenses', async (req, res) => {
  const { userId, title, amount, category, date, note, type, refId } = req.body;
  const id = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  const numericAmount = parseFloat(amount);

  try {
    await pool.query(
      'INSERT INTO expenses (id, user_id, title, amount, category, date, note, type, ref_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [id, userId, title, numericAmount, category, date, note || null, type || 'personal', refId || null]
    );

    res.json({
      id,
      title,
      amount: numericAmount,
      category,
      date,
      note,
      type: type || 'personal',
      refId,
      createdAt: new Date().toISOString(),
    });

    // Asynchronously evaluate if monthly budget is exceeded or expense exceeds single threshold for email alert
    (async () => {
      try {
        // 1. Fetch student user details
        const studentRes = await pool.query('SELECT name, email FROM users WHERE id = $1', [userId]);
        if (studentRes.rows.length === 0) return;
        const student = studentRes.rows[0];
        const studentEmail = student.email;
        const studentName = student.name || 'Student';

        // 2. Fetch user notification settings for threshold
        const settingsRes = await pool.query('SELECT custom_threshold_enabled, custom_threshold_amount FROM notification_settings WHERE user_id = $1', [userId]);
        const settings = settingsRes.rows[0];
        const threshold = (settings && settings.custom_threshold_enabled) 
          ? parseFloat(settings.custom_threshold_amount || 500)
          : 500; // Default single transaction threshold ₹500

        const expDate = date || new Date().toISOString().split('T')[0];
        const currentMonthYear = expDate.slice(0, 7);

        const budgetRes = await pool.query(
          'SELECT monthly_budget FROM budgets WHERE user_id = $1 AND month_year = $2',
          [userId, currentMonthYear]
        );
        const monthlyBudget = budgetRes.rows.length > 0 ? parseFloat(budgetRes.rows[0].monthly_budget) : 1000;

        const totalSpentRes = await pool.query(
          "SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = $1 AND date LIKE $2",
          [userId, `${currentMonthYear}%`]
        );
        const totalSpent = parseFloat(totalSpentRes.rows[0].total) || 0;
        const remaining = Math.max(0, monthlyBudget - totalSpent);

        // Check Trigger Conditions:
        // A. Monthly limit exceeded (total spent > monthly budget)
        const isMonthlyLimitExceeded = monthlyBudget > 0 && totalSpent > monthlyBudget;
        // B. Single expense exceeds specified threshold
        const isSingleLimitExceeded = numericAmount >= threshold;

        if (isMonthlyLimitExceeded || isSingleLimitExceeded) {
          const alertType = isMonthlyLimitExceeded ? 'monthly_limit_exceeded' : 'single_limit_exceeded';

          // Query linked parents
          const parentsRes = await pool.query(`
            SELECT u.email 
            FROM parent_child_links pcl
            JOIN users u ON pcl.parent_id = u.id
            WHERE LOWER(pcl.child_email) = $1
          `, [studentEmail.toLowerCase()]);

          const parentEmails = parentsRes.rows.map(r => r.email).filter(Boolean);

          await sendExpenseAlertEmail({
            studentEmail,
            parentEmails,
            expenseData: { title, amount: numericAmount, category, date: expDate },
            monthlyBudget,
            totalSpent,
            remainingBudget: remaining,
            alertType,
            studentName,
          });
        }
      } catch (alertErr) {
        console.error('Expense alert background check error:', alertErr);
      }
    })();
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
      [title, parseFloat(amount), category, date, note || null, id]
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
      totalAmount,
      paidBy,
      participants,
      splitType,
      date,
      userShare,
      totalReceivable,
      totalPayable,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Add split bill error:', err);
    res.status(500).json({ error: 'Failed to add split bill' });
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
      totalAmount,
      paidBy,
      members,
      splitMethod,
      shares,
      date,
      userShare,
      roomName: roomName || 'Room 204',
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Add hostel expense error:', err);
    res.status(500).json({ error: 'Failed to add hostel expense' });
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

// === NOTIFICATIONS ROUTES ===
app.get('/api/notifications/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(
      'SELECT id, type, title, message, read, event_key as "eventKey", monthly_cycle as "monthlyCycle", created_at as "createdAt" FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [userId]
    );
    res.json({ notifications: result.rows });
  } catch (err) {
    console.error('Fetch notifications error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

app.post('/api/notifications', async (req, res) => {
  const { userId, type, title, message, eventKey, monthlyCycle } = req.body;
  const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

  try {
    await pool.query(
      'INSERT INTO notifications (id, user_id, type, title, message, event_key, monthly_cycle) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [id, userId, type, title, message, eventKey, monthlyCycle]
    );

    res.json({
      id,
      type,
      title,
      message,
      read: false,
      eventKey,
      monthlyCycle,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Add notification error:', err);
    res.status(500).json({ error: 'Failed to record notification' });
  }
});

app.put('/api/notifications/read/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE notifications SET read = TRUE WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

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

// Notification Settings
app.get('/api/notifications/settings/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(
      `SELECT 
        browser_notifications as "browserNotifications",
        budget_alerts as "budgetAlerts",
        custom_threshold_enabled as "customThresholdEnabled",
        custom_threshold_amount as "customThresholdAmount",
        spending_alerts as "spendingAlerts",
        prediction_alerts as "predictionAlerts",
        split_bill_alerts as "splitBillAlerts",
        hostel_alerts as "hostelAlerts",
        saving_tips as "savingTips",
        dispatched_keys as "dispatchedKeys"
      FROM notification_settings WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({ settings: null });
    }

    const s = result.rows[0];
    res.json({
      settings: {
        ...s,
        customThresholdAmount: parseFloat(s.customThresholdAmount),
      },
    });
  } catch (err) {
    console.error('Fetch settings error:', err);
    res.status(500).json({ error: 'Failed to fetch notification settings' });
  }
});

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
        saving_tips
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
        updated_at = NOW();
    `, [
      userId,
      browserNotifications ?? true,
      budgetAlerts ?? true,
      customThresholdEnabled ?? false,
      customThresholdAmount ?? 500,
      spendingAlerts ?? true,
      predictionAlerts ?? true,
      splitBillAlerts ?? true,
      hostelAlerts ?? true,
      savingTips ?? true,
    ]);

    res.json({ success: true });
  } catch (err) {
    console.error('Save settings error:', err);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// Serve frontend in production
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Broke OS Backend running at http://0.0.0.0:${PORT}`);
});
