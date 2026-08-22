import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Header } from '../common/Header';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Wallet, User as UserIcon } from 'lucide-react';

export const SetupScreen: React.FC = () => {
  const { user, monthlyBudget, updateBudget } = useFinance();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || 'Student');
  const [budget, setBudget] = useState(monthlyBudget.toString());
  const [errorName, setErrorName] = useState('');
  const [errorBudget, setErrorBudget] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    let valid = true;
    if (!name.trim()) {
      setErrorName('Please enter your name.');
      valid = false;
    } else {
      setErrorName('');
    }

    const numBudget = parseFloat(budget);
    if (isNaN(numBudget) || numBudget <= 0) {
      setErrorBudget('Please enter a valid monthly amount greater than ₹0.');
      valid = false;
    } else {
      setErrorBudget('');
    }

    if (valid) {
      setIsSubmitting(true);
      await updateBudget(name.trim(), numBudget);
      setIsSubmitting(false);
      navigate('/');
    }
  };

  return (
    <div>
      <Header title="Monthly Budget Setup" showBack={!!user?.isSetupComplete} backScreen="/" />

      <div className="main-content">
        {/* Intro Banner */}
        <div
          className="white-card"
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            textAlign: 'center',
            padding: '24px 20px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: '#EEF2FF',
              color: '#4F46E5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px auto',
            }}
          >
            <Sparkles size={24} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
            Welcome to Broke OS
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#64748B', marginTop: '4px' }}>
            Set your allowance or monthly pocket money to start tracking your daily limits.
          </p>
        </div>

        {/* Setup Form */}
        <div className="white-card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="setup-name">Your Name</label>
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
                  <UserIcon size={18} />
                </span>
                <input
                  id="setup-name"
                  type="text"
                  className={`input-field ${errorName ? 'input-error' : ''}`}
                  style={{ paddingLeft: '42px' }}
                  placeholder="e.g. Chiya or Rahul"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
              {errorName && <span className="error-text">⚠️ {errorName}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="setup-budget">Monthly Money Received</label>
              <p style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '6px' }}>
                The total amount you receive from home or stipend for this month.
              </p>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94A3B8',
                    fontWeight: 700,
                    fontSize: '1.1rem',
                  }}
                >
                  ₹
                </span>
                <input
                  id="setup-budget"
                  type="number"
                  className={`input-field ${errorBudget ? 'input-error' : ''}`}
                  style={{ paddingLeft: '42px', fontSize: '1.1rem', fontWeight: 700 }}
                  placeholder="1000"
                  value={budget}
                  onChange={e => setBudget(e.target.value)}
                  min={1}
                  required
                />
              </div>
              {errorBudget && <span className="error-text">⚠️ {errorBudget}</span>}
            </div>

            {/* Quick preset buttons */}
            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Quick Presets:</span>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                {[1000, 2000, 3000, 5000].map(val => (
                  <button
                    key={val}
                    type="button"
                    className="btn-secondary"
                    style={{
                      padding: '6px 12px',
                      fontSize: '0.8rem',
                      borderRadius: '8px',
                      borderColor: budget === val.toString() ? '#4F46E5' : '#E2E8F0',
                      color: budget === val.toString() ? '#4F46E5' : '#0F172A',
                      background: budget === val.toString() ? '#EEF2FF' : '#FFFFFF',
                    }}
                    onClick={() => {
                      setBudget(val.toString());
                      if (errorBudget) setErrorBudget('');
                    }}
                  >
                    ₹{val.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
              style={{ height: '48px' }}
            >
              {isSubmitting ? (
                <span>Saving to Neon DB...</span>
              ) : (
                <>
                  <span>CONTINUE</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Why Broke OS Info */}
        <div
          style={{
            padding: '16px',
            background: '#F8FAFC',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Wallet size={18} color="#4F46E5" />
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>
              Neon Cloud Database
            </h4>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#64748B' }}>
            All your daily spending limits, burn rates, split bills, and end-of-month predictions will dynamically calculate and persist in real-time.
          </p>
        </div>
      </div>
    </div>
  );
};
