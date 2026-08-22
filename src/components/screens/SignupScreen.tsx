import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, ArrowRight, Lock, Mail, User, ArrowLeft, ShieldCheck, GraduationCap } from 'lucide-react';
import { EmailVerificationModal } from '../common/EmailVerificationModal';

export const SignupScreen: React.FC = () => {
  const { signup, sendEmailOtp, verifyEmailOtp } = useFinance();
  const navigate = useNavigate();

  const [role, setRole] = useState<'student' | 'parent'>('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errorName, setErrorName] = useState('');
  const [errorEmail, setErrorEmail] = useState('');
  const [errorPassword, setErrorPassword] = useState('');
  const [errorConfirm, setErrorConfirm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Email Verification Modal state
  const [showOtpModal, setShowOtpModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    let isValid = true;

    if (!name.trim()) {
      setErrorName('Please enter your full name.');
      isValid = false;
    } else {
      setErrorName('');
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorEmail('Please enter your email address.');
      isValid = false;
    } else if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorEmail('Please enter a valid email address.');
      isValid = false;
    } else {
      setErrorEmail('');
    }

    if (!password || password.length < 4) {
      setErrorPassword('Password must be at least 4 characters.');
      isValid = false;
    } else {
      setErrorPassword('');
    }

    if (password !== confirmPassword) {
      setErrorConfirm('Passwords do not match.');
      isValid = false;
    } else {
      setErrorConfirm('');
    }

    if (!isValid) return;

    setIsSubmitting(true);
    // Send 1-minute email verification code
    const otpRes = await sendEmailOtp(cleanEmail, 'signup', role);
    setIsSubmitting(false);

    if (otpRes.success) {
      setShowOtpModal(true);
    } else {
      setErrorEmail(otpRes.error || 'Failed to send verification code.');
    }
  };

  const handleVerifyOtp = async (otpCode: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const verifyRes = await verifyEmailOtp(cleanEmail, otpCode, 'signup');
    if (!verifyRes.success) {
      return verifyRes;
    }

    // After verifying email, create the account
    const result = await signup(name.trim(), cleanEmail, password, role);
    if (result.success) {
      setShowOtpModal(false);
      if (role === 'parent') {
        navigate('/admin');
      } else {
        navigate('/setup');
      }
      return { success: true };
    } else {
      return { success: false, error: result.error || 'Failed to complete registration.' };
    }
  };

  const handleResendOtp = async () => {
    const cleanEmail = email.trim().toLowerCase();
    return await sendEmailOtp(cleanEmail, 'signup', role);
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
          style={{ padding: '4px 0', marginBottom: '16px', color: '#4F46E5', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <ArrowLeft size={16} />
          <span>Back to Login</span>
        </Link>

        {/* Title Header */}
        <div style={{ marginBottom: '18px' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em' }}>
            Create an Account
          </h1>
          <p style={{ fontSize: '0.88rem', color: '#64748B', marginTop: '4px' }}>
            Join Broke OS to manage student expenses or monitor family finances
          </p>
        </div>

        {/* Account Role Selector */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            backgroundColor: '#F1F5F9',
            padding: '4px',
            borderRadius: '14px',
            marginBottom: '20px',
          }}
        >
          <button
            type="button"
            onClick={() => setRole('student')}
            style={{
              padding: '10px 12px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: role === 'student' ? '#FFFFFF' : 'transparent',
              color: role === 'student' ? '#4F46E5' : '#64748B',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: role === 'student' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <GraduationCap size={16} />
            <span>Student</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('parent')}
            style={{
              padding: '10px 12px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: role === 'parent' ? '#FFFFFF' : 'transparent',
              color: role === 'parent' ? '#2563EB' : '#64748B',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: role === 'parent' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <ShieldCheck size={16} />
            <span>Parent / Admin</span>
          </button>
        </div>

        {/* Role Helper Banner */}
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '12px',
            backgroundColor: role === 'student' ? '#EEF2FF' : '#EFF6FF',
            border: `1px solid ${role === 'student' ? '#C7D2FE' : '#BFDBFE'}`,
            marginBottom: '20px',
            fontSize: '0.82rem',
            color: role === 'student' ? '#3730A3' : '#1E40AF',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {role === 'student' ? (
            <>
              <GraduationCap size={16} style={{ flexShrink: 0 }} />
              <span>Full hostel split, predictive budget & AI expense manager</span>
            </>
          ) : (
            <>
              <ShieldCheck size={16} style={{ flexShrink: 0 }} />
              <span>Parent safety dashboard: link children & monitor spending</span>
            </>
          )}
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="signup-name">Full Name</label>
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
                <User size={18} />
              </span>
              <input
                id="signup-name"
                type="text"
                className={`input-field ${errorName ? 'input-error' : ''}`}
                style={{ paddingLeft: '42px' }}
                placeholder={role === 'student' ? 'e.g. Chiya' : 'e.g. Rajesh Kumar'}
                value={name}
                onChange={e => {
                  setName(e.target.value);
                  if (errorName) setErrorName('');
                }}
                required
              />
            </div>
            {errorName && <span className="error-text">⚠️ {errorName}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-email">Email Address</label>
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
                id="signup-email"
                type="email"
                className={`input-field ${errorEmail ? 'input-error' : ''}`}
                style={{ paddingLeft: '42px' }}
                placeholder={role === 'student' ? 'student@university.edu' : 'parent@example.com'}
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
            <label className="form-label" htmlFor="signup-password">Password</label>
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
                id="signup-password"
                type="password"
                className={`input-field ${errorPassword ? 'input-error' : ''}`}
                style={{ paddingLeft: '42px' }}
                placeholder="Create password"
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  if (errorPassword) setErrorPassword('');
                }}
                required
              />
            </div>
            {errorPassword && <span className="error-text">⚠️ {errorPassword}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-confirm-password">Confirm Password</label>
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
                id="signup-confirm-password"
                type="password"
                className={`input-field ${errorConfirm ? 'input-error' : ''}`}
                style={{ paddingLeft: '42px' }}
                placeholder="Confirm password"
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
                <UserPlus size={18} />
                <span>Verify Email & Create Account</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <p style={{ fontSize: '0.88rem', color: '#64748B' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#4F46E5', fontWeight: 700, textDecoration: 'none' }}>
              Sign In
            </Link>
          </p>
        </div>
      </div>

      {/* 1-Minute Expiring Email OTP Verification Modal */}
      <EmailVerificationModal
        isOpen={showOtpModal}
        email={email.trim().toLowerCase()}
        reason="signup"
        onClose={() => setShowOtpModal(false)}
        onVerify={handleVerifyOtp}
        onResend={handleResendOtp}
      />
    </div>
  );
};
