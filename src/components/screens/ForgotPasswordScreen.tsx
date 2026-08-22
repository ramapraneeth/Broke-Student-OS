import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useNavigate, Link } from 'react-router-dom';
import { KeyRound, ArrowRight, ArrowLeft, Phone, Lock, CheckCircle2 } from 'lucide-react';

export const ForgotPasswordScreen: React.FC = () => {
  const { resetPassword } = useFinance();
  const navigate = useNavigate();

  const [mobileNumber, setMobileNumber] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errorMobile, setErrorMobile] = useState('');
  const [errorPassword, setErrorPassword] = useState('');
  const [errorConfirm, setErrorConfirm] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    let isValid = true;
    const cleanMobile = mobileNumber.replace(/\D/g, '');
    if (!cleanMobile || cleanMobile.length !== 10) {
      setErrorMobile('Please enter a valid 10-digit mobile number.');
      isValid = false;
    } else {
      setErrorMobile('');
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
    const result = await resetPassword(cleanMobile, newPassword);
    setIsSubmitting(false);

    if (result.success) {
      setIsSuccess(true);
    } else {
      setErrorMobile(result.error || 'No account found with this number.');
    }
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
            Enter your registered mobile number to set a new password
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
              style={{ background: '#10B981' }}
              onClick={() => navigate('/login')}
            >
              <span>Go to Login</span>
              <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="forgot-mobile">Registered Mobile Number</label>
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
                  <Phone size={18} />
                </span>
                <input
                  id="forgot-mobile"
                  type="tel"
                  className={`input-field ${errorMobile ? 'input-error' : ''}`}
                  style={{ paddingLeft: '42px' }}
                  placeholder="10-digit mobile number"
                  value={mobileNumber}
                  onChange={e => {
                    setMobileNumber(e.target.value);
                    if (errorMobile) setErrorMobile('');
                  }}
                  maxLength={10}
                  required
                />
              </div>
              {errorMobile && <span className="error-text">⚠️ {errorMobile}</span>}
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
                  placeholder="Enter new password"
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
                  placeholder="Re-enter new password"
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
              className="btn-primary"
              disabled={isSubmitting}
              style={{ marginTop: '14px', height: '48px' }}
            >
              {isSubmitting ? (
                <span>Resetting...</span>
              ) : (
                <>
                  <span>RESET PASSWORD</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
