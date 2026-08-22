import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, CheckCircle2, Share2, Sparkles } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallAppBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app is already running in standalone PWA / WebAPK mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } else {
      setShowModal(true);
    }
  };

  if (isInstalled || bannerDismissed) return null;

  return (
    <>
      {/* Floating / Sticky Mobile Install Header Action */}
      <div
        style={{
          background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
          borderBottom: '1px solid #C7D2FE',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#4F46E5',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Smartphone size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1E1B4B' }}>
              Use as Mobile App
            </div>
            <div style={{ fontSize: '0.7rem', color: '#4338CA' }}>
              Install on Android / iOS
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={handleInstallClick}
            style={{
              background: '#4F46E5',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '0.75rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)',
            }}
          >
            <Download size={13} />
            <span>Install APK</span>
          </button>

          <button
            type="button"
            onClick={() => setBannerDismissed(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#6366F1',
              padding: '4px',
              cursor: 'pointer',
              display: 'flex',
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Guide Modal for Manual Install */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Smartphone size={22} color="#4F46E5" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>
                  Install Broke OS on Phone
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: '#F1F5F9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={18} color="#64748B" />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              <div
                style={{
                  padding: '14px',
                  background: '#F8FAFC',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                }}
              >
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                  🤖 For Android (Chrome / Edge):
                </h4>
                <ol style={{ paddingLeft: '20px', fontSize: '0.85rem', color: '#475569', lineHeight: 1.6 }}>
                  <li>Open the browser menu (tap the <strong>⋮ three dots</strong> top-right).</li>
                  <li>Select <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong>.</li>
                  <li>Android will package and install <strong>Broke OS WebAPK</strong> directly on your app drawer!</li>
                </ol>
              </div>

              <div
                style={{
                  padding: '14px',
                  background: '#F8FAFC',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                }}
              >
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                  🍏 For iPhone / iPad (Safari):
                </h4>
                <ol style={{ paddingLeft: '20px', fontSize: '0.85rem', color: '#475569', lineHeight: 1.6 }}>
                  <li>Tap the <strong>Share button</strong> (<Share2 size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />) at the bottom.</li>
                  <li>Scroll down and tap <strong>"Add to Home Screen"</strong>.</li>
                  <li>Tap <strong>Add</strong> top-right to launch it as a full native app!</li>
                </ol>
              </div>
            </div>

            <button
              type="button"
              className="btn-primary"
              onClick={() => setShowModal(false)}
              style={{ height: '46px' }}
            >
              <CheckCircle2 size={18} />
              <span>Got it!</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
