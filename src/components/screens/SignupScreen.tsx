import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, ArrowRight, Lock, Phone, User, ArrowLeft, ShieldCheck, GraduationCap } from 'lucide-react';

export const SignupScreen: React.FC = () => {
  const { signup } = useFinance();
  const navigate = useNavigate();

  const [role, setRole] = useState<'student' | 'parent'>('student');
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errorName, setErrorName] = useState('');
  const [errorMobile, setErrorMobile] = useState('');
  const [errorPassword, setErrorPassword] = useState('');
  const [errorConfirm, setErrorConfirm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    const cleanMobile = mobileNumber.replace(/\D/g, '');
    if (!cleanMobile) {
      setErrorMobile('Please enter your 10-digit mobile number.');
      isValid = false;
    } else if (cleanMobile.length !== 10) {
      setErrorMobile('Mobile number must be exactly 10 digits.');
      isValid = false;
    } else {
      setErrorMobile('');
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
    const result = await signup(name.trim(), cleanMobile, password, role);
    setIsSubmitting(false);

    if (result.success) {
      if (role === 'parent') {
        navigate('/admin');
      } else {
        navigate('/setup');
      }
    } else {
      setErrorMobile(result.error || 'Failed to create account.');
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
          style={{ padding: '4px 0', marginBottom: '16px', color: '#4F46E5', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <ArrowLeft size={16} />
          <span>Back to Login</span>
        </Link>

        {/* Title Header */}
        <div style={{ marginBottom: '18px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              background: '#EEF2FF',
              color: '#4F46E5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '10px',
            }}
          >
            <UserPlus size={22} />
          </div>
          <h1 style={{ fontSize: '1.7rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
            Create Account
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '2px' }}>
            {role === 'student' ? 'Manage your allowance and split bills' : 'Monitor student child expenses and savings'}
          </p>
        </div>

        {/* Role Selection Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            background: '#F1F5F9',
            padding: '4px',
            borderRadius: '12px',
            marginBottom: '18px',
          }}
        >
          <button
            type="button"
            onClick={() => setRole('student')}
            style={{
              padding: '9px 8px',
              borderRadius: '9px',
              border: 'none',
              background: role === 'student' ? '#FFFFFF' : 'transparent',
              color: role === 'student' ? '#4F46E5' : '#64748B',
              fontWeight: 700,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: role === 'student' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            <GraduationCap size={15} />
            <span>Student Account</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('parent')}
            style={{
              padding: '9px 8px',
              borderRadius: '9px',
              border: 'none',
              background: role === 'parent' ? '#FFFFFF' : 'transparent',
              color: role === 'parent' ? '#4F46E5' : '#64748B',
              fontWeight: 700,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: role === 'parent' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            <ShieldCheck size={15} />
            <span>Parent / Admin</span>
          </button>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="signup-name">
              {role === 'student' ? 'Student Full Name' : 'Parent / Admin Name'}
            </label>
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
                placeholder={role === 'student' ? 'e.g. Chiya or Rahul' : 'e.g. Ramesh Sharma'}
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
            <label className="form-label" htmlFor="signup-mobile">Mobile Number</label>
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
                id="signup-mobile"
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
                placeholder="Re-enter password"
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
            style={{ marginTop: '10px', height: '48px' }}
          >
            {isSubmitting ? (
              <span>Creating Account...</span>
            ) : (
              <>
                <span>REGISTER AS {role.toUpperCase()}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '22px' }}>
          <p style={{ fontSize: '0.875rem', color: '#64748B' }}>
            Already have an account?{' '}
            <Link
              to="/login"
              style={{ color: '#4F46E5', fontWeight: 700, textDecoration: 'none', marginLeft: '4px' }}
            >
              Sign In
            </Link>
          </p>
        </div>

        <div
          style={{
            marginTop: '20px',
            padding: '12px',
            background: '#F8FAFC',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <ShieldCheck size={18} color="#10B981" />
          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
            Persisted securely on Neon PostgreSQL cloud database.
          </span>
        </div>
      </div>
    </div>
  );
};
