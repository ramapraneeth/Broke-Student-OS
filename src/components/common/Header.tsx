import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Sparkles, LogOut } from 'lucide-react';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  backScreen?: string; // route path, e.g. '/', '/expenses'
}

export const Header: React.FC<HeaderProps> = ({ title, showBack = false, backScreen = '/' }) => {
  const { user, logout } = useFinance();
  const navigate = useNavigate();

  const handleLogout = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to log out?')) {
      logout();
      navigate('/login');
    }
  };

  return (
    <header
      style={{
        background: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {showBack ? (
          <button
            onClick={() => backScreen ? navigate(backScreen) : navigate(-1)}
            style={{
              background: '#F1F5F9',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#0F172A',
            }}
            title="Go Back"
          >
            <ChevronLeft size={20} />
          </button>
        ) : (
          <div
            onClick={() => navigate('/')}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '1.2rem',
              boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)',
              cursor: 'pointer',
            }}
          >
            B
          </div>
        )}

        <div>
          {title ? (
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>
              {title}
            </h2>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                  Broke OS
                </h1>
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    background: '#EEF2FF',
                    color: '#4F46E5',
                    padding: '2px 6px',
                    borderRadius: '6px',
                    textTransform: 'uppercase',
                  }}
                >
                  Neon DB
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>
                Smart money for students
              </p>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* User avatar / profile setup shortcut */}
        <div
          onClick={() => navigate('/setup')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            background: '#EEF2FF',
            padding: '5px 12px',
            borderRadius: '9999px',
            cursor: 'pointer',
            border: '1px solid #C7D2FE',
          }}
          title="Edit Name / Monthly Budget"
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4F46E5' }}>
            {user?.name || 'Student'}
          </span>
          <Sparkles size={12} color="#4F46E5" />
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          title="Logout"
          style={{
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#DC2626',
            cursor: 'pointer',
          }}
        >
          <LogOut size={14} />
        </button>
      </div>
    </header>
  );
};
