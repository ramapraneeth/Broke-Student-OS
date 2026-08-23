import React, { useState, useEffect, useRef } from 'react';
import { Mail, Clock, RefreshCw, X, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';

interface EmailVerificationModalProps {
  isOpen: boolean;
  email: string;
  reason?: 'login' | 'signup' | 'link_child' | 'forgot_password';
  onClose: () => void;
  onVerify: (otpCode: string) => Promise<{ success: boolean; error?: string }>;
  onResend: () => Promise<{ success: boolean; message?: string; error?: string }>;
}

export const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  isOpen,
  email,
  reason = 'signup',
  onClose,
  onVerify,
  onResend,
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState<number>(60); // 1-minute expiration strictly enforced
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [resendMsg, setResendMsg] = useState('');

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize and run 60-second countdown
  useEffect(() => {
    if (!isOpen) return;

    setTimeLeft(60);
    setDigits(['', '', '', '', '', '']);
    setErrorMsg('');
    setResendMsg('');

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Auto focus first digit
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, email]);

  if (!isOpen) return null;

  const isExpired = timeLeft === 0;

  const handleDigitChange = (index: number, value: string) => {
    const numeric = value.replace(/\D/g, '');
    if (!numeric && value !== '') return;

    const char = numeric ? numeric.slice(-1) : '';
    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);
    setErrorMsg('');

    // Auto advance
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit if all 6 filled
    if (char && index === 5 && newDigits.every(d => d !== '')) {
      submitCode(newDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newDigits = ['', '', '', '', '', ''];
      for (let i = 0; i < pasted.length; i++) {
        newDigits[i] = pasted[i];
      }
      setDigits(newDigits);
      if (pasted.length === 6) {
        submitCode(pasted);
      } else {
        inputRefs.current[pasted.length]?.focus();
      }
    }
  };

  const submitCode = async (codeToVerify?: string) => {
    if (isExpired) {
      setErrorMsg('This code has expired (1-minute limit). Please click Resend Code.');
      return;
    }

    const code = codeToVerify || digits.join('');
    if (code.length !== 6) {
      setErrorMsg('Please enter all 6 digits.');
      return;
    }

    setIsVerifying(true);
    setErrorMsg('');
    const res = await onVerify(code);
    setIsVerifying(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Invalid verification code.');
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setErrorMsg('');
    setResendMsg('');
    const res = await onResend();
    setIsResending(false);

    if (res.success) {
      setResendMsg('New 1-minute code dispatched to your email!');
      setTimeLeft(60);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } else {
      setErrorMsg(res.error || 'Failed to resend code.');
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        zIndex: 9999,
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '420px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          border: '1px solid #E2E8F0',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)',
            padding: '24px 20px',
            color: '#FFFFFF',
            position: 'relative',
            textAlign: 'center',
          }}
        >
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>

          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(6px)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
            }}
          >
            <Mail size={26} color="#FFFFFF" />
          </div>

          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Verify Your Email</h3>
          <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#E0E7FF' }}>
            Enter the 6-digit security code sent to
          </p>
          <div
            style={{
              display: 'inline-block',
              marginTop: '8px',
              padding: '4px 12px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.2px',
              maxWidth: '90%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {email}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', boxSizing: 'border-box' }}>
          {/* Live 60-Second Timer Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: '12px',
              background: isExpired ? '#FEF2F2' : '#F0FDF4',
              border: `1px solid ${isExpired ? '#FECACA' : '#BBF7D0'}`,
              marginBottom: '20px',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} color={isExpired ? '#DC2626' : '#16A34A'} />
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: isExpired ? '#DC2626' : '#166534',
                }}
              >
                {isExpired ? 'Code Expired (1-min limit)' : 'Expires in'}
              </span>
            </div>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '14px',
                fontWeight: 800,
                color: isExpired ? '#DC2626' : '#16A34A',
              }}
            >
              {formatTimer(timeLeft)}
            </span>
          </div>

          {/* 6 Digit Inputs */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: '6px',
              marginBottom: '16px',
              width: '100%',
              boxSizing: 'border-box',
            }}
            onPaste={handlePaste}
          >
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={el => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                disabled={isExpired || isVerifying}
                onChange={e => handleDigitChange(idx, e.target.value)}
                onKeyDown={e => handleKeyDown(idx, e)}
                style={{
                  width: '100%',
                  minWidth: 0,
                  maxWidth: '100%',
                  height: '48px',
                  boxSizing: 'border-box',
                  padding: 0,
                  margin: 0,
                  textAlign: 'center',
                  fontSize: '20px',
                  fontWeight: 800,
                  borderRadius: '12px',
                  border: `2px solid ${digit ? '#4F46E5' : isExpired ? '#E2E8F0' : '#CBD5E1'}`,
                  backgroundColor: isExpired ? '#F8FAFC' : '#FFFFFF',
                  color: '#0F172A',
                  outline: 'none',
                  transition: 'all 0.15s ease',
                  boxShadow: digit ? '0 0 0 3px rgba(79, 70, 229, 0.15)' : 'none',
                }}
              />
            ))}
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 12px',
                borderRadius: '10px',
                backgroundColor: '#FEF2F2',
                border: '1px solid #FCA5A5',
                color: '#B91C1C',
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '16px',
              }}
            >
              <ShieldAlert size={16} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Resend Success Message */}
          {resendMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 12px',
                borderRadius: '10px',
                backgroundColor: '#F0FDF4',
                border: '1px solid #86EFAC',
                color: '#166534',
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '16px',
              }}
            >
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              <span>{resendMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <button
            type="button"
            disabled={isVerifying || isExpired || digits.some(d => !d)}
            onClick={() => submitCode()}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '14px',
              backgroundColor: isExpired || digits.some(d => !d) ? '#94A3B8' : '#4F46E5',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '15px',
              fontWeight: 700,
              cursor: isExpired || digits.some(d => !d) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
              transition: 'all 0.2s ease',
              marginBottom: '12px',
            }}
          >
            {isVerifying ? (
              <span>Verifying Code...</span>
            ) : (
              <>
                <span>Confirm & Continue</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>

          {/* Resend Code Button */}
          <div style={{ textAlign: 'center' }}>
            <button
              type="button"
              disabled={isResending || (!isExpired && timeLeft > 45)}
              onClick={handleResend}
              style={{
                background: 'none',
                border: 'none',
                color: isExpired || timeLeft <= 45 ? '#4F46E5' : '#94A3B8',
                fontSize: '13px',
                fontWeight: 700,
                cursor: isExpired || timeLeft <= 45 ? 'pointer' : 'not-allowed',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
              }}
            >
              <RefreshCw size={14} className={isResending ? 'spin' : ''} />
              <span>{isResending ? 'Sending...' : 'Resend 6-Digit Code'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
