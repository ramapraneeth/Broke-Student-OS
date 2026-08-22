import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Bell, CheckCircle2, AlertCircle, X } from 'lucide-react';

export const NotificationPermissionBanner: React.FC = () => {
  const { showNotificationBanner, requestPermission, dismissBanner, permissionStatus } = useFinance();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!showNotificationBanner || permissionStatus === 'granted') {
    return null;
  }

  const handleEnable = async () => {
    setIsProcessing(true);
    const res = await requestPermission();
    setIsProcessing(false);
    setFeedback(res.message);

    if (res.status === 'granted') {
      setTimeout(() => {
        dismissBanner();
        setFeedback(null);
      }, 2500);
    }
  };

  const handleDismiss = () => {
    dismissBanner();
  };

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #4338CA 0%, #4F46E5 100%)',
        color: '#FFFFFF',
        borderRadius: '16px',
        padding: '16px 18px',
        marginBottom: '16px',
        boxShadow: '0 4px 14px rgba(79, 70, 229, 0.25)',
        position: 'relative',
        animation: 'fadeIn 0.3s ease-in-out',
      }}
    >
      <button
        onClick={handleDismiss}
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: 'rgba(255, 255, 255, 0.2)',
          border: 'none',
          borderRadius: '50%',
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          cursor: 'pointer',
        }}
        title="Dismiss"
      >
        <X size={14} />
      </button>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Bell size={20} color="#FFFFFF" />
        </div>

        <div style={{ flex: 1, paddingRight: '16px' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>
            Stay on top of your spending
          </h4>
          <p style={{ fontSize: '0.8rem', opacity: 0.9, marginTop: '2px', lineHeight: 1.4, margin: '2px 0 10px 0' }}>
            Get real-time browser alerts when you're close to your budget limit or split bills are due.
          </p>

          {feedback ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                borderRadius: '8px',
                background: feedback.includes('✓') ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)',
                border: feedback.includes('✓') ? '1px solid #10B981' : '1px solid #EF4444',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >
              {feedback.includes('✓') ? <CheckCircle2 size={16} color="#10B981" /> : <AlertCircle size={16} color="#F87171" />}
              <span>{feedback}</span>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleEnable}
                disabled={isProcessing}
                style={{
                  background: '#FFFFFF',
                  color: '#4338CA',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '8px 16px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
              >
                {isProcessing ? 'Enabling...' : 'Enable Notifications'}
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                style={{
                  background: 'transparent',
                  color: 'rgba(255, 255, 255, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '10px',
                  padding: '8px 14px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Maybe Later
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
