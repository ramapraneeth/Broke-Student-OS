import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useNavigate, Link } from 'react-router-dom';
import { KeyRound, ArrowRight, ArrowLeft, Mail, Lock, CheckCircle2 } from 'lucide-react';
import { EmailVerificationModal } from '../common/EmailVerificationModal';

export const ForgotPasswordScreen: React.FC = () => {
  const { resetPassword, sendEmailOtp, verifyEmailOtp } = useFinance();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errorEmail, setErrorEmail] = useState('');
  const [errorPassword, setErrorPassword] = useState('');
  const [errorConfirm, setErrorConfirm] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showOtpModal, setShowOtpModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    let isValid = true;
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorEmail('Please enter a valid registered email address.');
      isValid = false;
    } else {
      setErrorEmail('');
    }

    if (!newPassword || newPassword.length < 4) {
      setErrorPassword('New password must be at least 4 characters.');
      isValid = false;
    } else {
      setErrorPassword('');
    }

    if (newPassword !== confirmPassword) {
      setErrorConfirm('Passwords do not match.');
      isValid = false;
    } else {
      setErrorConfirm('');
    }

    if (!isValid) return;

    setIsSubmitting(true);
    // Send 1-minute security code to email
    const otpRes = await sendEmailOtp(cleanEmail, 'forgot_password');
    setIsSubmitting(false);

    if (otpRes.success) {
      setShowOtpModal(true);
    } else {
      setErrorEmail(otpRes.error || 'Failed to dispatch verification code.');
    }
  };

  const handleVerifyOtp = async (otpCode: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const verifyRes = await verifyEmailOtp(cleanEmail, otpCode, 'forgot_password');
    if (!verifyRes.success) {
      return verifyRes;
    }

    // Reset password
    const result = await resetPassword(cleanEmail, newPassword);
    if (result.success) {
      setShowOtpModal(false);
      setIsSuccess(true);
      return { success: true };
    } else {
      return { success: false, error: result.error || 'Failed to update password.' };
    }
  };

  const handleResendOtp = async () => {
    const cleanEmail = email.trim().toLowerCase();
    return await sendEmailOtp(cleanEmail, 'forgot_password');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '30px 24px',
      }}
    >
      <div style={{ maxWidth: '400px', margin: '0 auto', width: '100%' }}>
        {/* Back to Login Link */}
        <Link
          to="/login"
          className="btn-ghost"
          style={{ padding: '4px 0', marginBottom: '20px', color: '#4F46E5', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <ArrowLeft size={16} />
          <span>Back to Login</span>
        </Link>

        {/* Title */}
        <div style={{ marginBottom: '24px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: '#FFFBEB',
              color: '#F59E0B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px',
            }}
          >
            <KeyRound size={24} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
            Reset Password
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#64748B', marginTop: '2px' }}>
            Enter your registered email address to verify and set a new password
          </p>
        </div>

        {isSuccess ? (
          <div
            className="white-card"
            style={{
              textAlign: 'center',
              padding: '24px 20px',
              border: '1px solid #A7F3D0',
              background: '#ECFDF5',
            }}
          >
            <CheckCircle2 size={42} color="#10B981" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#065F46' }}>
              Password Reset Successful!
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#047857', marginTop: '6px', marginBottom: '20px' }}>
              Your password has been updated in Neon DB. You can now login with your new credentials.
            </p>
            <button
              type="button"
              className="btn-primary"
              style={{ background: '#10B981', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              onClick={() => navigate('/login')}
            >
              <span>Go to Login</span>
              <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="forgot-email">Registered Email Address</label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94A3B8',
                    display: 'flex',
                  }}
                >
                  <Mail size={18} />
                </span>
                <input
                  id="forgot-email"
                  type="email"
                  className={`input-field ${errorEmail ? 'input-error' : ''}`}
                  style={{ paddingLeft: '42px' }}
                  placeholder="yourname@example.com"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    if (errorEmail) setErrorEmail('');
                  }}
                  required
                />
              </div>
              {errorEmail && <span className="error-text">⚠️ {errorEmail}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="forgot-new-password">New Password</label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94A3B8',
                    display: 'flex',
                  }}
                >
                  <Lock size={18} />
                </span>
                <input
                  id="forgot-new-password"
                  type="password"
                  className={`input-field ${errorPassword ? 'input-error' : ''}`}
                  style={{ paddingLeft: '42px' }}
                  placeholder="At least 4 characters"
                  value={newPassword}
                  onChange={e => {
                    setNewPassword(e.target.value);
                    if (errorPassword) setErrorPassword('');
                  }}
                  required
                />
              </div>
              {errorPassword && <span className="error-text">⚠️ {errorPassword}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="forgot-confirm-password">Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94A3B8',
                    display: 'flex',
                  }}
                >
                  <Lock size={18} />
                </span>
                <input
                  id="forgot-confirm-password"
                  type="password"
                  className={`input-field ${errorConfirm ? 'input-error' : ''}`}
                  style={{ paddingLeft: '42px' }}
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={e => {
                    setConfirmPassword(e.target.value);
                    if (errorConfirm) setErrorConfirm('');
                  }}
                  required
                />
              </div>
              {errorConfirm && <span className="error-text">⚠️ {errorConfirm}</span>}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '12px', padding: '14px' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span>Sending Verification Code...</span>
              ) : (
                <>
                  <span>Verify Email & Update Password</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* 1-Minute Expiring Email OTP Verification Modal */}
      <EmailVerificationModal
        isOpen={showOtpModal}
        email={email.trim().toLowerCase()}
        reason="forgot_password"
        onClose={() => setShowOtpModal(false)}
        onVerify={handleVerifyOtp}
        onResend={handleResendOtp}
      />
    </div>
  );
};
