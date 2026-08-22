import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Header } from '../common/Header';
import { DonutChart } from '../common/DonutChart';
import { CATEGORY_DETAILS, ExpenseCategory } from '../../types';
import { 
  Users, 
  UserPlus, 
  Phone, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  Wallet, 
  TrendingDown, 
  Receipt,
  LogOut,
  Calendar,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AdminScreen: React.FC = () => {
  const { 
    user, 
    linkedChildren, 
    selectedChild, 
    setSelectedChild, 
    linkChild, 
    unlinkChild, 
    childBudget, 
    childExpenses, 
    childMetrics, 
    monthYear, 
    logout 
  } = useFinance();
  const navigate = useNavigate();

  const [inputMobile, setInputMobile] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [linkMsg, setLinkMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMobile = inputMobile.replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      setLinkMsg({ type: 'error', text: 'Please enter a valid 10-digit mobile number.' });
      return;
    }

    setIsLinking(true);
    setLinkMsg(null);
    const result = await linkChild(cleanMobile);
    setIsLinking(false);

    if (result.success) {
      setLinkMsg({ type: 'success', text: `Successfully linked ${result.student?.name || 'student'}!` });
      setInputMobile('');
    } else {
      setLinkMsg({ type: 'error', text: result.error || 'Could not find student account with this mobile number.' });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div>
      {/* Custom Admin Header */}
      <header
        style={{
          background: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#4F46E5',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
            }}
          >
            P
          </div>
          <div>
            <h1 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
              Parent & Admin Portal
            </h1>
            <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
              Logged in as {user?.name || 'Parent'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="btn-ghost"
          style={{ padding: '6px 10px', fontSize: '0.8rem', color: '#DC2626' }}
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </header>

      <div className="main-content">
        {/* Link Student Account Card */}
        <div className="white-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <UserPlus size={18} color="#4F46E5" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>
              Link Student / Child Account
            </h3>
          </div>

          <p style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '14px' }}>
            Enter your student's registered 10-digit mobile number to monitor their monthly allowance, daily spend burn, and savings.
          </p>

          <form onSubmit={handleLinkSubmit} style={{ display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
                <Phone size={16} />
              </span>
              <input
                type="tel"
                className="input-field"
                style={{ paddingLeft: '38px', fontSize: '0.9rem' }}
                placeholder="Student Mobile Number"
                value={inputMobile}
                onChange={e => setInputMobile(e.target.value)}
                maxLength={10}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLinking}
              className="btn-primary"
              style={{ width: 'auto', padding: '0 16px', fontSize: '0.85rem', flexShrink: 0 }}
            >
              <span>{isLinking ? 'Linking...' : '+ Link Student'}</span>
            </button>
          </form>

          {linkMsg && (
            <div
              style={{
                marginTop: '10px',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 600,
                background: linkMsg.type === 'success' ? '#ECFDF5' : '#FEF2F2',
                color: linkMsg.type === 'success' ? '#065F46' : '#991B1B',
                border: `1px solid ${linkMsg.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
              }}
            >
              {linkMsg.type === 'success' ? '✓ ' : '⚠️ '}
              {linkMsg.text}
            </div>
          )}
        </div>

        {/* Linked Children Selector Tabs */}
        {linkedChildren.length > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                Linked Students ({linkedChildren.length})
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              {linkedChildren.map(child => {
                const isSelected = selectedChild?.id === child.id;
                return (
                  <div
                    key={child.id}
                    onClick={() => setSelectedChild(child)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: isSelected ? '2px solid #4F46E5' : '1px solid #E2E8F0',
                      background: isSelected ? '#EEF2FF' : '#FFFFFF',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: isSelected ? '#4F46E5' : '#E2E8F0',
                        color: isSelected ? '#FFFFFF' : '#0F172A',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                      }}
                    >
                      {child.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>
                        {child.name}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                        {child.mobileNumber}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Unlink ${child.name}?`)) {
                          unlinkChild(child.mobileNumber);
                        }
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#94A3B8',
                        cursor: 'pointer',
                        padding: '2px',
                        marginLeft: '4px',
                      }}
                      title="Unlink student"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected Child Monitoring Dashboard */}
        {selectedChild ? (
          <>
            {/* Child Profile Banner */}
            <div
              className="white-card"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                borderLeft: '4px solid #4F46E5',
              }}
            >
              <div>
                <span className="card-title-sm">MONITORING STUDENT</span>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                  {selectedChild.name}'s Finances
                </h2>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  Mobile: {selectedChild.mobileNumber} • Month: {monthYear}
                </span>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Status</span>
                <div>
                  <span
                    className={`badge ${childMetrics.isOnTrack ? 'badge-safe' : 'badge-danger'}`}
                    style={{ fontSize: '0.75rem' }}
                  >
                    {childMetrics.isOnTrack ? '✓ On Track' : '⚠️ Overspending'}
                  </span>
                </div>
              </div>
            </div>

            {/* Financial Overview 4 Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="white-card" style={{ padding: '14px' }}>
                <span className="card-title-sm">ALLOWANCE</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                  ₹{childBudget.toLocaleString('en-IN')}
                </div>
                <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>Monthly pocket money</span>
              </div>

              <div className="white-card" style={{ padding: '14px' }}>
                <span className="card-title-sm">TOTAL SPENT</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#4F46E5', marginTop: '2px' }}>
                  ₹{childMetrics.totalPersonalSpent.toLocaleString('en-IN')}
                </div>
                <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>
                  {childMetrics.spentPercentage}% of budget
                </span>
              </div>

              <div className="white-card" style={{ padding: '14px' }}>
                <span className="card-title-sm">REMAINING</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: childMetrics.isOverspent ? '#EF4444' : '#10B981', marginTop: '2px' }}>
                  ₹{childMetrics.remainingBudget.toLocaleString('en-IN')}
                </div>
                <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>
                  {childMetrics.remainingPercentage}% remaining
                </span>
              </div>

              <div className="white-card" style={{ padding: '14px' }}>
                <span className="card-title-sm">SAFE DAILY LIMIT</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#4F46E5', marginTop: '2px' }}>
                  ₹{Math.floor(childMetrics.safeDailyLimit)}<span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>/day</span>
                </div>
                <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>
                  for next {childMetrics.daysRemaining} days
                </span>
              </div>
            </div>

            {/* Donut Chart */}
            <div className="white-card" style={{ padding: '24px 20px' }}>
              <span className="card-title-sm" style={{ marginBottom: '14px' }}>
                BUDGET CONSUMPTION
              </span>
              <DonutChart
                spentPercentage={childMetrics.spentPercentage}
                remainingPercentage={childMetrics.remainingPercentage}
                totalSpent={childMetrics.totalPersonalSpent}
                remaining={childMetrics.remainingBudget}
                monthlyBudget={childBudget}
                isOverspent={childMetrics.isOverspent}
                overspentAmount={childMetrics.overspentAmount}
              />
            </div>

            {/* Category Breakdown */}
            <div className="white-card">
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', marginBottom: '14px' }}>
                Spending By Category
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {childMetrics.categoryBreakdowns.map(cat => {
                  const meta = CATEGORY_DETAILS[cat.category] || CATEGORY_DETAILS.Other;
                  return (
                    <div key={cat.category}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{meta.emoji}</span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>
                            {cat.category}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A' }}>
                            ₹{cat.amount.toLocaleString('en-IN')}
                          </span>
                          <span className="badge badge-primary" style={{ padding: '2px 8px', fontSize: '0.7rem' }}>
                            {cat.percentage}%
                          </span>
                        </div>
                      </div>

                      <div style={{ width: '100%', height: '6px', background: '#F1F5F9', borderRadius: '9999px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${Math.min(100, cat.percentage)}%`,
                            background: meta.color,
                            borderRadius: '9999px',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Child's Recent Expenses */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>
                  Recent Transactions ({childExpenses.length})
                </h3>
              </div>

              {childExpenses.length === 0 ? (
                <div className="white-card" style={{ textAlign: 'center', padding: '24px', color: '#64748B', fontSize: '0.85rem' }}>
                  No expenses recorded by {selectedChild.name} yet this month.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {childExpenses.slice(0, 10).map(item => {
                    const meta = CATEGORY_DETAILS[item.category] || CATEGORY_DETAILS.Other;
                    const isLargeExpense = item.amount > 500;

                    return (
                      <div
                        key={item.id}
                        className="white-card"
                        style={{
                          padding: '12px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderLeft: isLargeExpense ? '4px solid #F59E0B' : '1px solid #E2E8F0',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '8px',
                              background: meta.bgColor,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.1rem',
                            }}
                          >
                            {meta.emoji}
                          </div>
                          <div>
                            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>
                              {item.title}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                              {item.category} • {item.date} {isLargeExpense && '• ⚠️ > ₹500'}
                            </div>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: isLargeExpense ? '#D97706' : '#0F172A' }}>
                            ₹{item.amount.toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          <div
            className="white-card"
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              border: '1px solid #E2E8F0',
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
                margin: '0 auto 12px auto',
              }}
            >
              <Users size={28} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
              No Student Account Linked Yet
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748B', maxWidth: '340px', margin: '6px auto 0 auto' }}>
              Enter your student's 10-digit mobile number above to link their account and start monitoring their financial health.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
