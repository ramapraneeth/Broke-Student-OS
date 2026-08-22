import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  ArrowRight, 
  GraduationCap, 
  Users, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Sparkles, 
  ShieldAlert 
} from 'lucide-react';

export const AdminLoginScreen: React.FC = () => {
  const { login } = useFinance();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorEmail, setErrorEmail] = useState('');
  const [errorPassword, setErrorPassword] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setGeneralError('');
    let isValid = true;
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorEmail('Please enter your registered email address.');
      isValid = false;
    } else if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorEmail('Please enter a valid email address.');
      isValid = false;
    } else {
      setErrorEmail('');
    }

    if (!password || password.trim().length === 0) {
      setErrorPassword('Please enter your password.');
      isValid = false;
    } else {
      setErrorPassword('');
    }

    if (!isValid) return;

    setIsSubmitting(true);
    const result = await login(cleanEmail, password, 'parent');
    setIsSubmitting(false);

    if (result.success) {
      navigate('/admin');
    } else {
      setGeneralError(result.error || 'Invalid parent credentials.');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #F0F4FF 0%, #FFFFFF 60%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '30px 20px',
      }}
    >
      <div style={{ maxWidth: '420px', margin: '0 auto', width: '100%' }}>
        {/* Family Safety Badge & Icon */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              margin: '0 auto 14px auto',
              boxShadow: '0 8px 20px rgba(37, 99, 235, 0.3)',
            }}
          >
            <ShieldCheck size={36} />
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#EFF6FF',
              color: '#1D4ED8',
              padding: '4px 12px',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '8px',
              border: '1px solid #BFDBFE',
            }}
          >
            <Users size={13} />
            <span>Family Safety Portal</span>
          </div>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: '4px 0' }}>
            Parent & Guardian Login
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0 }}>
            Monitor allowance, daily spend limits & transactions for your children
          </p>
        </div>

        {/* Feature Highlights Pills */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '14px 16px',
            marginBottom: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#334155', fontWeight: 600 }}>
            <CheckCircle2 size={16} color="#2563EB" />
            <span>Live expense feed & category breakdowns</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#334155', fontWeight: 600 }}>
            <CheckCircle2 size={16} color="#2563EB" />
            <span>Manage 1 or more children in a unified dashboard</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#334155', fontWeight: 600 }}>
            <CheckCircle2 size={16} color="#2563EB" />
            <span>Overspending & large transaction safety alerts</span>
          </div>
        </div>

        {/* Login Card */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
          }}
        >
          {/* Error Banner */}
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

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="admin-email">Parent Email Address</label>
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
                  <Mail size={18} />
                </span>
                <input
                  id="admin-email"
                  type="email"
                  className={`input-field ${errorEmail ? 'input-error' : ''}`}
                  style={{ paddingLeft: '42px' }}
                  placeholder="parent@example.com"
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" htmlFor="admin-password">Password</label>
                <Link
                  to="/forgot-password"
                  style={{ fontSize: '0.78rem', color: '#2563EB', textDecoration: 'none', fontWeight: 600 }}
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
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  className={`input-field ${errorPassword ? 'input-error' : ''}`}
                  style={{ paddingLeft: '42px', paddingRight: '40px' }}
                  placeholder="Enter parent password"
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    if (errorPassword) setErrorPassword('');
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    padding: '2px',
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errorPassword && <span className="error-text">⚠️ {errorPassword}</span>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                marginTop: '10px',
              }}
            >
              {isSubmitting ? (
                <span>Logging into Family Hub...</span>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  <span>LOGIN TO FAMILY SAFETY HUB</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Helper */}
          <div
            style={{
              marginTop: '16px',
              padding: '10px 12px',
              background: '#F8FAFC',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              fontSize: '0.75rem',
              color: '#64748B',
              textAlign: 'center',
            }}
          >
            <span>Don't have a parent account? </span>
            <Link
              to="/signup"
              style={{ color: '#2563EB', fontWeight: 700, textDecoration: 'none' }}
            >
              Create Parent Account
            </Link>
          </div>
        </div>

        {/* Switch to Student Login */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            type="button"
            onClick={() => navigate('/login')}
            style={{
              background: 'none',
              border: 'none',
              color: '#4F46E5',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <GraduationCap size={18} />
            <span>Switch to Student App Login →</span>
          </button>
        </div>
      </div>
    </div>
  );
};
