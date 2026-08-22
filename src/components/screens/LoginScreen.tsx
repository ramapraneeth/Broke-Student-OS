import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Lock, Phone, HelpCircle, GraduationCap, ShieldCheck } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login } = useFinance();
  const navigate = useNavigate();

  const [role, setRole] = useState<'student' | 'parent'>('student');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [errorMobile, setErrorMobile] = useState('');
  const [errorPassword, setErrorPassword] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setGeneralError('');
    let isValid = true;
    const cleanMobile = mobileNumber.replace(/\D/g, '');
    if (!cleanMobile) {
      setErrorMobile('Please enter your mobile number.');
      isValid = false;
    } else if (cleanMobile.length !== 10) {
      setErrorMobile('Mobile number must be exactly 10 digits.');
      isValid = false;
    } else {
      setErrorMobile('');
    }

    if (!password || password.trim().length === 0) {
      setErrorPassword('Please enter your password.');
      isValid = false;
    } else {
      setErrorPassword('');
    }

    if (!isValid) return;

    setIsSubmitting(true);
    const result = await login(cleanMobile, password, role);
    setIsSubmitting(false);

    if (result.success) {
      if (result.role === 'parent' || role === 'parent') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } else {
      setGeneralError(result.error || 'Invalid credentials.');
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
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '58px',
              height: '58px',
              borderRadius: '18px',
              background: '#4F46E5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '1.85rem',
              margin: '0 auto 14px auto',
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.25)',
            }}
          >
            B
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em' }}>
            Broke OS
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#64748B', marginTop: '2px', fontWeight: 500 }}>
            {role === 'student' ? 'Intelligent Student Finance Manager' : 'Parent & Guardian Monitoring Hub'}
          </p>
        </div>

        {/* Role Selector Tabs (Student / Child vs Parent / Admin) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            background: '#F1F5F9',
            padding: '4px',
            borderRadius: '12px',
            marginBottom: '20px',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setRole('student');
              setGeneralError('');
            }}
            style={{
              padding: '10px 8px',
              borderRadius: '9px',
              border: 'none',
              background: role === 'student' ? '#FFFFFF' : 'transparent',
              color: role === 'student' ? '#4F46E5' : '#64748B',
              fontWeight: 700,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: role === 'student' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <GraduationCap size={16} />
            <span>Student Login</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRole('parent');
              setGeneralError('');
            }}
            style={{
              padding: '10px 8px',
              borderRadius: '9px',
              border: 'none',
              background: role === 'parent' ? '#FFFFFF' : 'transparent',
              color: role === 'parent' ? '#4F46E5' : '#64748B',
              fontWeight: 700,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: role === 'parent' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <ShieldCheck size={16} />
            <span>Parent Login</span>
          </button>
        </div>

        {/* General Error Banner */}
        {generalError && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              padding: '12px 14px',
              borderRadius: '12px',
              background: '#FEF2F2',
              border: '1.5px solid #FECACA',
              color: '#991B1B',
              fontSize: '0.825rem',
              fontWeight: 600,
              lineHeight: 1.4,
              marginBottom: '16px',
            }}
          >
            <span style={{ fontSize: '1rem' }}>⚠️</span>
            <span>{generalError}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={validateAndSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-mobile">
              {role === 'student' ? 'Student Mobile Number' : 'Parent Mobile Number'}
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
                  alignItems: 'center',
                }}
              >
                <Phone size={18} />
              </span>
              <input
                id="login-mobile"
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" htmlFor="login-password">Password</label>
              <Link
                to="/forgot-password"
                className="btn-ghost"
                style={{ padding: '0', fontSize: '0.8rem', color: '#4F46E5', textDecoration: 'none' }}
              >
                Forgot password?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94A3B8',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Lock size={18} />
              </span>
              <input
                id="login-password"
                type="password"
                className={`input-field ${errorPassword ? 'input-error' : ''}`}
                style={{ paddingLeft: '42px' }}
                placeholder="Enter password"
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

          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
            style={{ marginTop: '10px', height: '48px' }}
          >
            {isSubmitting ? (
              <span>Logging in...</span>
            ) : (
              <>
                <span>{role === 'student' ? 'LOGIN AS STUDENT' : 'LOGIN AS PARENT / ADMIN'}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Create Account Navigation Link */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <p style={{ fontSize: '0.875rem', color: '#64748B' }}>
            New to Broke OS?{' '}
            <Link
              to="/signup"
              style={{ color: '#4F46E5', fontWeight: 700, textDecoration: 'none', marginLeft: '4px' }}
            >
              Create Account
            </Link>
          </p>
        </div>

        {/* Forgot Password Link Button */}
        <div style={{ textAlign: 'center', marginTop: '12px' }}>
          <Link
            to="/forgot-password"
            style={{ fontSize: '0.78rem', color: '#64748B', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <HelpCircle size={14} />
            <span>Reset Password</span>
          </Link>
        </div>

        {/* Dedicated Guardian / Family Safety Portal Link */}
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #F1F5F9', textAlign: 'center' }}>
          <Link
            to="/admin-login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#2563EB',
              fontSize: '0.82rem',
              fontWeight: 700,
              textDecoration: 'none',
              padding: '6px 12px',
              borderRadius: '8px',
              background: '#EFF6FF',
            }}
          >
            <ShieldCheck size={16} />
            <span>Guardian & Family Safety Hub →</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

