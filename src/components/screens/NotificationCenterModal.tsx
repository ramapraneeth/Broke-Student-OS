import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { AppNotification, NotificationType } from '../../types';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  X, 
  Settings, 
  AlertCircle, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  Home as HomeIcon, 
  Sparkles, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

export const NotificationCenterModal: React.FC<Props> = ({ isOpen, onClose, onOpenSettings }) => {
  const { 
    notifications, 
    unreadNotificationCount, 
    markNotificationAsRead, 
    markAllNotificationsAsRead, 
    clearAllNotifications 
  } = useFinance();

  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'alerts'>('all');

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'unread') return !n.read;
    if (activeTab === 'alerts') {
      return ['custom_threshold', 'budget_80', 'budget_90', 'overspent', 'prediction', 'high_daily'].includes(n.type);
    }
    return true;
  });

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'custom_threshold':
      case 'high_daily':
        return <div style={iconBadgeStyle('#FEF2F2', '#DC2626')}><AlertTriangle size={18} /></div>;
      case 'budget_80':
        return <div style={iconBadgeStyle('#EEF2FF', '#4F46E5')}><Bell size={18} /></div>;
      case 'budget_90':
      case 'overspent':
        return <div style={iconBadgeStyle('#FEF2F2', '#EF4444')}><AlertCircle size={18} /></div>;
      case 'prediction':
        return <div style={iconBadgeStyle('#F5F3FF', '#7C3AED')}><TrendingUp size={18} /></div>;
      case 'split_bill':
        return <div style={iconBadgeStyle('#EFF6FF', '#2563EB')}><Users size={18} /></div>;
      case 'hostel_expense':
        return <div style={iconBadgeStyle('#F0FDFA', '#0D9488')}><HomeIcon size={18} /></div>;
      case 'saving_tip':
      default:
        return <div style={iconBadgeStyle('#ECFDF5', '#10B981')}><Sparkles size={18} /></div>;
    }
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return 'Just now';
    try {
      const d = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
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
          borderRadius: '20px',
          width: '100%',
          maxWidth: '480px',
          height: '85vh',
          maxHeight: '650px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 20px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#FFFFFF',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#EEF2FF',
                color: '#4F46E5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bell size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Notifications
                </h3>
                {unreadNotificationCount > 0 && (
                  <span
                    style={{
                      background: '#EF4444',
                      color: '#FFFFFF',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      padding: '2px 7px',
                      borderRadius: '9999px',
                    }}
                  >
                    {unreadNotificationCount}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
              title="Notification Settings"
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
                color: '#475569',
              }}
            >
              <Settings size={16} />
            </button>

            <button
              onClick={onClose}
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
                color: '#64748B',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Action Bar / Quick Filter Tabs */}
        <div
          style={{
            padding: '10px 16px',
            background: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', gap: '6px' }}>
            {(['all', 'unread', 'alerts'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  background: activeTab === tab ? '#4F46E5' : 'transparent',
                  color: activeTab === tab ? '#FFFFFF' : '#64748B',
                  textTransform: 'capitalize',
                }}
              >
                {tab === 'alerts' ? '⚠️ Budget Alerts' : tab}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            {unreadNotificationCount > 0 && (
              <button
                type="button"
                onClick={markAllNotificationsAsRead}
                title="Mark all as read"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#4F46E5',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <CheckCheck size={14} />
                <span>Read All</span>
              </button>
            )}

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={clearAllNotifications}
                title="Clear all"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <Trash2 size={13} />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {filteredNotifications.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                padding: '30px 20px',
                textAlign: 'center',
                color: '#64748B',
              }}
            >
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: '#EEF2FF',
                  color: '#4F46E5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '12px',
                }}
              >
                <CheckCircle2 size={28} />
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', margin: '0 0 4px 0' }}>
                All Caught Up! 🎉
              </h4>
              <p style={{ fontSize: '0.8rem', maxWidth: '260px', margin: 0 }}>
                {activeTab === 'unread'
                  ? 'No unread notifications right now.'
                  : 'You will receive notifications when budget thresholds are reached or bills are split.'}
              </p>
            </div>
          ) : (
            filteredNotifications.map(item => (
              <div
                key={item.id}
                onClick={() => !item.read && markNotificationAsRead(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '14px 16px',
                  borderRadius: '14px',
                  background: item.read ? '#FFFFFF' : '#F8FAFC',
                  border: item.read ? '1px solid #E2E8F0' : '1.5px solid #C7D2FE',
                  boxShadow: item.read ? 'none' : '0 2px 6px rgba(79, 70, 229, 0.08)',
                  cursor: item.read ? 'default' : 'pointer',
                  position: 'relative',
                  transition: 'all 0.2s',
                }}
              >
                {/* Unread indicator dot */}
                {!item.read && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#4F46E5',
                    }}
                  />
                )}

                {getNotificationIcon(item.type)}

                <div style={{ flex: 1, paddingRight: item.read ? '0' : '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A' }}>
                      {item.title}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.825rem', color: '#334155', margin: '0 0 6px 0', lineHeight: 1.4 }}>
                    {item.message}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600 }}>
                    <Clock size={11} />
                    <span>{formatTime(item.createdAt)}</span>
                    <span>•</span>
                    <span style={{ textTransform: 'capitalize' }}>{item.type.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid #E2E8F0',
            background: '#FFFFFF',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#4F46E5',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Settings size={14} />
            <span>Notification Settings</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#F1F5F9',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#0F172A',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const iconBadgeStyle = (bg: string, color: string): React.CSSProperties => ({
  width: '38px',
  height: '38px',
  borderRadius: '12px',
  background: bg,
  color: color,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
});
