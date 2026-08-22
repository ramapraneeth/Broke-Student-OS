import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Phone, RefreshCw, X, ArrowRight, CheckCircle2, MessageSquare, Sparkles } from 'lucide-react';

interface OTPVerificationModalProps {
  isOpen: boolean;
  mobileNumber: string;
  reason: 'login' | 'signup' | 'link_child';
  childName?: string;
  initialOtp?: string;
  onVerified: (otpCode: string) => Promise<void> | void;
  onClose: () => void;
}

export const OTPVerificationModal: React.FC<OTPVerificationModalProps> = ({
  isOpen,
  mobileNumber,
  reason,
  childName,
  initialOtp,
  onVerified,
  onClose,
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [activeOtp, setActiveOtp] = useState<string>(initialOtp || '');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timer, setTimer] = useState<number>(45);
  const [showSimulatedSms, setShowSimulatedSms] = useState<boolean>(true);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (initialOtp) {
      setActiveOtp(initialOtp);
      setShowSimulatedSms(true);
    }
  }, [initialOtp]);

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

  const handleAutofill = () => {
    if (activeOtp && activeOtp.length === 6) {
      setDigits(activeOtp.split(''));
      setError('');
      inputRefs.current[5]?.focus();
    }
  };

  const handleResend = async () => {
    if (timer > 0 || isResending) return;
    setIsResending(true);
    setError('');
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber, reason }),
      });
      const data = await res.json();
      if (res.ok) {
        setActiveOtp(data.otp || '');
        setShowSimulatedSms(true);
        setTimer(45);
      } else {
        setError(data.error || 'Failed to resend code');
      }
    } catch (err) {
      setError('Network error resending code');
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = digits.join('');
    if (fullCode.length !== 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber, otp: fullCode, reason }),
      });
      const data = await res.json();

      if (res.ok) {
        await onVerified(fullCode);
      } else {
        setError(data.error || 'Invalid verification code');
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const titles = {
    login: 'Verify Login',
    signup: 'Verify Mobile Number',
    link_child: 'Student Consent Verification',
  };

  const descriptions = {
    login: `Enter the 6-digit verification code sent to +91 ${mobileNumber} to authenticate your login.`,
    signup: `Enter the 6-digit verification code sent to +91 ${mobileNumber} to complete your account registration.`,
    link_child: `For safety and student privacy, a verification code was sent to ${childName || 'the student'}'s phone (+91 ${mobileNumber}). Enter the code to link accounts.`,
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(5px)',
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
          padding: '26px 24px',
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

        {/* Live Real SMS / Dispatcher Notification Banner */}
        {showSimulatedSms && (
          <div
            style={{
              background: '#EFF6FF',
              border: '1.5px solid #BFDBFE',
              borderRadius: '14px',
              padding: '12px 14px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <MessageSquare size={16} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1E40AF', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>📲 Real SMS via Google Gateway</span>
                  <span style={{ fontSize: '0.65rem', background: '#DBEAFE', color: '#1E40AF', padding: '1px 5px', borderRadius: '4px' }}>Active</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#1E293B', fontWeight: 600, marginTop: '2px' }}>
                  {activeOtp ? (
                    <>Test Code: <span style={{ letterSpacing: '2px', color: '#2563EB', fontWeight: 800 }}>{activeOtp}</span></>
                  ) : (
                    <>Check your phone SMS inbox on <strong>+91 {mobileNumber}</strong></>
                  )}
                </div>
              </div>
            </div>

            {activeOtp && (
              <button
                type="button"
                onClick={handleAutofill}
                style={{
                  background: '#2563EB',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  flexShrink: 0,
                }}
              >
                <Sparkles size={12} />
                <span>Autofill</span>
              </button>
            )}
          </div>
        )}

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
                  height: '54px',
                  borderRadius: '12px',
                  border: digit ? '2px solid #4F46E5' : '1.5px solid #CBD5E1',
                  background: digit ? '#F5F3FF' : '#FFFFFF',
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  textAlign: 'center',
                  color: '#0F172A',
                  outline: 'none',
                  transition: 'all 0.15s ease',
                }}
              />
            ))}
          </div>

          {/* Error message */}
          {error && (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '10px',
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#991B1B',
                fontSize: '0.8rem',
                fontWeight: 600,
                marginBottom: '14px',
                textAlign: 'center',
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {/* Verify Action Button */}
          <button
            type="submit"
            disabled={isVerifying}
            className="btn-primary"
            style={{
              width: '100%',
              height: '48px',
              borderRadius: '14px',
              fontSize: '0.92rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {isVerifying ? (
              <span>Verifying Code...</span>
            ) : (
              <>
                <CheckCircle2 size={18} />
                <span>Verify & Complete</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Resend Code Footer */}
        <div
          style={{
            marginTop: '16px',
            textAlign: 'center',
            fontSize: '0.8rem',
            color: '#64748B',
          }}
        >
          {timer > 0 ? (
            <span>Resend verification code in <strong>{timer}s</strong></span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              style={{
                background: 'none',
                border: 'none',
                color: '#4F46E5',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <RefreshCw size={13} />
              <span>Resend Code Now</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
