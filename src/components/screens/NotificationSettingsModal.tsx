import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { NotificationType } from '../../types';
import { 
  Bell, 
  BellRing, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  TrendingUp, 
  Users, 
  Home as HomeIcon, 
  Sparkles, 
  PieChart, 
  Sliders, 
  Send 
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationSettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { 
    notificationSettings, 
    updateNotificationSettings, 
    permissionStatus, 
    requestPermission, 
    sendTestNotification 
  } = useFinance();

  const [customThreshold, setCustomThreshold] = useState(
    (notificationSettings.customThresholdAmount || 700).toString()
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [testType, setTestType] = useState<NotificationType>('custom_threshold');
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const handleToggle = (key: keyof typeof notificationSettings) => {
    updateNotificationSettings({ [key]: !notificationSettings[key] });
  };

  const handleSaveThreshold = (val: string) => {
    setCustomThreshold(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      updateNotificationSettings({ customThresholdAmount: num });
    }
  };

  const handleRequestPermission = async () => {
    const res = await requestPermission();
    setFeedback(res.message);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleSendTest = async () => {
    setIsTesting(true);
    await sendTestNotification(testType);
    setIsTesting(false);
    setFeedback(`✓ Test ${testType.replace('_', ' ')} alert dispatched!`);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleEnableAll = () => {
    updateNotificationSettings({
      browserNotifications: true,
      budgetAlerts: true,
      customThresholdEnabled: true,
      spendingAlerts: true,
      predictionAlerts: true,
      splitBillAlerts: true,
      hostelAlerts: true,
      savingTips: true,
    });
  };

  const handleDisableAll = () => {
    updateNotificationSettings({
      browserNotifications: false,
      budgetAlerts: false,
      customThresholdEnabled: false,
      spendingAlerts: false,
      predictionAlerts: false,
      splitBillAlerts: false,
      hostelAlerts: false,
      savingTips: false,
    });
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
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '24px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: '#EEF2FF',
                color: '#4F46E5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BellRing size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Notification Settings
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748B', margin: 0 }}>
                Configure real browser & in-app spending alerts
              </p>
            </div>
          </div>

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

        {/* Feedback Alert */}
        {feedback && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '10px',
              background: feedback.includes('✓') ? '#ECFDF5' : '#FEF2F2',
              color: feedback.includes('✓') ? '#065F46' : '#991B1B',
              border: feedback.includes('✓') ? '1px solid #A7F3D0' : '1px solid #FECACA',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '16px',
            }}
          >
            {feedback.includes('✓') ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{feedback}</span>
          </div>
        )}

        {/* Browser Permission Status Card */}
        <div
          style={{
            padding: '14px 16px',
            borderRadius: '14px',
            background: permissionStatus === 'granted' ? '#F0FDF4' : permissionStatus === 'denied' ? '#FEF2F2' : '#F8FAFC',
            border: `1px solid ${permissionStatus === 'granted' ? '#BBF7D0' : permissionStatus === 'denied' ? '#FECACA' : '#E2E8F0'}`,
            marginBottom: '18px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Bell size={16} color={permissionStatus === 'granted' ? '#16A34A' : permissionStatus === 'denied' ? '#DC2626' : '#4F46E5'} />
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>
                  Browser Notification Permission
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px', margin: 0 }}>
                Status: <strong style={{ textTransform: 'capitalize', color: permissionStatus === 'granted' ? '#16A34A' : permissionStatus === 'denied' ? '#DC2626' : '#D97706' }}>{permissionStatus}</strong>
              </p>
            </div>

            {permissionStatus !== 'granted' && (
              <button
                type="button"
                onClick={handleRequestPermission}
                style={{
                  background: '#4F46E5',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Enable Permission
              </button>
            )}
          </div>

          {permissionStatus === 'unsupported' && (
            <p style={{ fontSize: '0.75rem', color: '#DC2626', marginTop: '6px', margin: 0 }}>
              Browser notifications aren't supported here. You can still use in-app notifications.
            </p>
          )}
          {permissionStatus === 'denied' && (
            <p style={{ fontSize: '0.75rem', color: '#DC2626', marginTop: '6px', margin: 0 }}>
              Permission was denied in browser settings. Please allow notifications in browser address bar to receive push alerts.
            </p>
          )}
        </div>

        {/* Global Quick Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
          <button
            type="button"
            onClick={handleEnableAll}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '8px',
              background: '#EEF2FF',
              border: '1px solid #C7D2FE',
              color: '#4F46E5',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ✓ Enable All Alerts
          </button>
          <button
            type="button"
            onClick={handleDisableAll}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '8px',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              color: '#64748B',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Disable All
          </button>
        </div>

        {/* Setting Toggles List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          {/* 1. Browser Notifications */}
          <div style={toggleRowStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={iconBoxStyle('#EEF2FF', '#4F46E5')}>
                <Bell size={18} />
              </div>
              <div>
                <h4 style={labelStyle}>Browser Notifications</h4>
                <p style={subLabelStyle}>Display OS / Browser popups on alerts</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={notificationSettings.browserNotifications}
              onChange={() => handleToggle('browserNotifications')}
              style={switchStyle}
            />
          </div>

          {/* 2. Budget Alerts */}
          <div style={toggleRowStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={iconBoxStyle('#FEF3C7', '#D97706')}>
                <PieChart size={18} />
              </div>
              <div>
                <h4 style={labelStyle}>Budget Alerts</h4>
                <p style={subLabelStyle}>80%, 90% utilization & overspent warnings</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={notificationSettings.budgetAlerts}
              onChange={() => handleToggle('budgetAlerts')}
              style={switchStyle}
            />
          </div>

          {/* 3. Custom Spending Threshold */}
          <div style={{ ...toggleRowStyle, flexDirection: 'column', alignItems: 'stretch' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={iconBoxStyle('#FEE2E2', '#DC2626')}>
                  <Sliders size={18} />
                </div>
                <div>
                  <h4 style={labelStyle}>Custom Spending Alert</h4>
                  <p style={subLabelStyle}>Notify when personal spend reaches ₹{notificationSettings.customThresholdAmount || 700}</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={notificationSettings.customThresholdEnabled}
                onChange={() => handleToggle('customThresholdEnabled')}
                style={switchStyle}
              />
            </div>

            {notificationSettings.customThresholdEnabled && (
              <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '44px' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>Alert me at: ₹</span>
                <input
                  type="number"
                  value={customThreshold}
                  onChange={e => handleSaveThreshold(e.target.value)}
                  style={{
                    width: '100px',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                  }}
                  min={1}
                  placeholder="700"
                />
              </div>
            )}
          </div>

          {/* 4. High Daily Spending */}
          <div style={toggleRowStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={iconBoxStyle('#FEF2F2', '#EF4444')}>
                <AlertTriangle size={18} />
              </div>
              <div>
                <h4 style={labelStyle}>High Daily Spending</h4>
                <p style={subLabelStyle}>Alert when spending exceeds safe daily rate</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={notificationSettings.spendingAlerts}
              onChange={() => handleToggle('spendingAlerts')}
              style={switchStyle}
            />
          </div>

          {/* 5. Spending Prediction */}
          <div style={toggleRowStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={iconBoxStyle('#F5F3FF', '#7C3AED')}>
                <TrendingUp size={18} />
              </div>
              <div>
                <h4 style={labelStyle}>Prediction Alerts</h4>
                <p style={subLabelStyle}>Warning if projected spend exceeds budget</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={notificationSettings.predictionAlerts}
              onChange={() => handleToggle('predictionAlerts')}
              style={switchStyle}
            />
          </div>

          {/* 6. Split Bill Notifications */}
          <div style={toggleRowStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={iconBoxStyle('#EFF6FF', '#2563EB')}>
                <Users size={18} />
              </div>
              <div>
                <h4 style={labelStyle}>Split Bill Notifications</h4>
                <p style={subLabelStyle}>Alert when friends owe you money</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={notificationSettings.splitBillAlerts}
              onChange={() => handleToggle('splitBillAlerts')}
              style={switchStyle}
            />
          </div>

          {/* 7. Hostel Notifications */}
          <div style={toggleRowStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={iconBoxStyle('#F0FDFA', '#0D9488')}>
                <HomeIcon size={18} />
              </div>
              <div>
                <h4 style={labelStyle}>Hostel Notifications</h4>
                <p style={subLabelStyle}>Alert when shared room bills are added</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={notificationSettings.hostelAlerts}
              onChange={() => handleToggle('hostelAlerts')}
              style={switchStyle}
            />
          </div>

          {/* 8. Saving Tips */}
          <div style={toggleRowStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={iconBoxStyle('#ECFDF5', '#10B981')}>
                <Sparkles size={18} />
              </div>
              <div>
                <h4 style={labelStyle}>Saving Tips</h4>
                <p style={subLabelStyle}>Smart advice to extend your pocket money</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={notificationSettings.savingTips}
              onChange={() => handleToggle('savingTips')}
              style={switchStyle}
            />
          </div>
        </div>

        {/* Live Notification Tester Section */}
        <div
          style={{
            padding: '16px',
            borderRadius: '14px',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Send size={15} color="#4F46E5" />
            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Live Test Notification Trigger
            </h4>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0 0 10px 0' }}>
            Verify real browser and in-app notifications instantly.
          </p>

          <div style={{ display: 'flex', gap: '8px' }}>
            <select
              value={testType}
              onChange={e => setTestType(e.target.value as NotificationType)}
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.8rem',
                fontWeight: 600,
                background: '#FFFFFF',
              }}
            >
              <option value="custom_threshold">1. Custom Alert (₹700 threshold)</option>
              <option value="budget_80">2. 80% Budget Alert</option>
              <option value="budget_90">3. 90% Budget Alert</option>
              <option value="overspent">4. Overspending Alert</option>
              <option value="prediction">5. Spending Prediction Alert</option>
              <option value="high_daily">6. High Daily Spending Alert</option>
              <option value="split_bill">7. Split Bill Notification</option>
              <option value="hostel_expense">8. Hostel Expense Notification</option>
            </select>

            <button
              type="button"
              onClick={handleSendTest}
              disabled={isTesting}
              style={{
                padding: '8px 14px',
                background: '#4F46E5',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Send size={14} />
              <span>{isTesting ? 'Sending...' : 'Test'}</span>
            </button>
          </div>
        </div>

        {/* Done Button */}
        <button
          type="button"
          onClick={onClose}
          className="btn-primary"
          style={{
            marginTop: '18px',
            height: '46px',
            width: '100%',
          }}
        >
          Save & Close
        </button>
      </div>
    </div>
  );
};

const toggleRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 14px',
  borderRadius: '12px',
  background: '#FFFFFF',
  border: '1px solid #E2E8F0',
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.88rem',
  fontWeight: 700,
  color: '#0F172A',
  margin: 0,
};

const subLabelStyle: React.CSSProperties = {
  fontSize: '0.72rem',
  color: '#64748B',
  margin: 0,
};

const iconBoxStyle = (bg: string, color: string): React.CSSProperties => ({
  width: '34px',
  height: '34px',
  borderRadius: '10px',
  background: bg,
  color: color,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
});

const switchStyle: React.CSSProperties = {
  width: '20px',
  height: '20px',
  cursor: 'pointer',
  accentColor: '#4F46E5',
};
