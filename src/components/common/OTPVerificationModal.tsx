import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Bell, RefreshCw, X, ArrowRight, CheckCircle2 } from 'lucide-react';

interface OTPVerificationModalProps {
  isOpen: boolean;
  mobileNumber: string;
  reason: 'login' | 'signup' | 'link_child';
  childName?: string;
  onVerified: (otpCode: string) => Promise<any> | any;
  onResend?: () => Promise<any> | any;
  onClose: () => void;
}

export const OTPVerificationModal: React.FC<OTPVerificationModalProps> = ({
  isOpen,
  mobileNumber,
  reason,
  childName,
  onVerified,
  onResend,
  onClose,
}) => {
  const cleanMobile = mobileNumber.replace(/\D/g, '');
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timer, setTimer] = useState<number>(45);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const titles: Record<string, string> = {
    login: 'Device Security Verification',
    signup: 'Verify Your Mobile Number',
    link_child: 'Student Linking Consent',
  };

  const descriptions: Record<string, string> = {
    login: `Enter the 6-digit code sent via system push notification to verify your account (+91 ${cleanMobile}).`,
    signup: `Enter the 6-digit code sent via system push notification to complete registration for +91 ${cleanMobile}.`,
    link_child: `Enter the 6-digit authorization code sent to ${childName || 'student'}'s device (+91 ${cleanMobile}).`,
  };

  // Countdown timer
  useEffect(() => {
    if (!isOpen) return;
    setTimer(45);
    const interval = setInterval(() => {
      setTimer(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Auto focus first input on open
  useEffect(() => {
    if (isOpen) {
      setDigits(['', '', '', '', '', '']);
      setError('');
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 200);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDigitChange = (index: number, value: string) => {
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal) {
      const newDigits = [...digits];
      newDigits[index] = '';
      setDigits(newDigits);
      return;
    }

    // Handle paste of full 6-digit code
    if (cleanVal.length >= 6) {
      const pasted = cleanVal.slice(0, 6).split('');
      setDigits(pasted);
      inputRefs.current[5]?.focus();
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = cleanVal[cleanVal.length - 1];
    setDigits(newDigits);
    setError('');

    // Advance to next box
    if (index < 5 && cleanVal) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendClick = async () => {
    if (timer > 0 || isResending) return;
    setIsResending(true);
    setError('');
    try {
      if (onResend) {
        await onResend();
      } else {
        await fetch('/api/auth/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mobileNumber, reason }),
        });
      }
      setTimer(45);
    } catch (err) {
      setError('Network error resending code');
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = digits.join('');
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits of the code.');
      return;
    }

    setIsVerifying(true);
    setError('');
    try {
      await onVerified(otpCode);
    } catch (err: any) {
      setError(err?.message || 'Invalid or expired verification code.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '430px',
          padding: '28px 24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          position: 'relative',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            right: '18px',
            top: '18px',
            background: '#F1F5F9',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#64748B',
          }}
        >
          <X size={16} />
        </button>

        {/* Header Icon */}
        <div style={{ textAlign: 'center', marginBottom: '18px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '18px',
              background: 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px auto',
              boxShadow: '0 8px 18px rgba(79, 70, 229, 0.3)',
            }}
          >
            <ShieldCheck size={28} />
          </div>

          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
            {titles[reason]}
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '6px 0 0 0', lineHeight: 1.45 }}>
            {descriptions[reason]}
          </p>
        </div>

        {/* System Notification Delivery Notice */}
        <div
          style={{
            background: '#EFF6FF',
            border: '1px solid #BFDBFE',
            borderRadius: '12px',
            padding: '10px 14px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <Bell size={18} color="#2563EB" />
          <div style={{ fontSize: '0.82rem', color: '#1E40AF', fontWeight: 600 }}>
            Check your device notification banner for the 6-digit code.
          </div>
        </div>

        <form onSubmit={handleVerifySubmit}>
          {/* 6 Digit Input Boxes */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '16px',
            }}
          >
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={el => {
                  inputRefs.current[idx] = el;
                }}
                type="tel"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleDigitChange(idx, e.target.value)}
                onKeyDown={e => handleKeyDown(idx, e)}
                style={{
                  width: '46px',
                  height: '52px',
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  textAlign: 'center',
                  borderRadius: '12px',
                  border: digit ? '2px solid #4F46E5' : '1.5px solid #CBD5E1',
                  background: digit ? '#EEF2FF' : '#F8FAFC',
                  color: '#0F172A',
                  outline: 'none',
                  transition: 'all 0.15s ease',
                  boxShadow: digit ? '0 0 0 3px rgba(79, 70, 229, 0.15)' : 'none',
                }}
              />
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#DC2626',
                padding: '8px 12px',
                borderRadius: '10px',
                fontSize: '0.8rem',
                fontWeight: 600,
                textAlign: 'center',
                marginBottom: '16px',
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isVerifying || digits.join('').length !== 6}
            style={{
              width: '100%',
              height: '46px',
              borderRadius: '12px',
              border: 'none',
              background: digits.join('').length === 6 ? '#4F46E5' : '#94A3B8',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.95rem',
              cursor: digits.join('').length === 6 && !isVerifying ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: digits.join('').length === 6 ? '0 4px 14px rgba(79, 70, 229, 0.35)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            {isVerifying ? (
              <span>Verifying...</span>
            ) : (
              <>
                <span>Verify & Proceed</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Resend Action */}
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          {timer > 0 ? (
            <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>
              Resend notification in <strong style={{ color: '#4F46E5' }}>{timer}s</strong>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResendClick}
              disabled={isResending}
              style={{
                background: 'none',
                border: 'none',
                color: '#4F46E5',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <RefreshCw size={14} className={isResending ? 'animate-spin' : ''} />
              <span>Resend Push Notification</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
