import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Header } from '../common/Header';
import { DonutChart } from '../common/DonutChart';
import { NotificationPermissionBanner } from '../common/NotificationPermissionBanner';
import { useNavigate } from 'react-router-dom';
import { 
  PiggyBank, 
  Receipt, 
  BarChart3, 
  Calendar, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Plus
} from 'lucide-react';

export const HomeScreen: React.FC = () => {
  const { user, monthlyBudget, metrics, isLoading } = useFinance();
  const navigate = useNavigate();

  return (
    <div>
      <Header />

      <div className="main-content">
        {/* Permission UX Banner (opt-in, dismissible) */}
        <NotificationPermissionBanner />

        {/* Greeting Section */}
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
            Hi, {user?.name || 'Student'} 👋
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 500 }}>
            Let's make your money last.
          </p>
        </div>


        {/* Monthly Budget Card */}
        <div
          className="white-card"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '18px 20px',
            border: '1px solid #E2E8F0',
          }}
        >
          <div>
            <span className="card-title-sm">
              <Calendar size={13} color="#4F46E5" />
              MONTHLY MONEY
            </span>
            <div className="amount-huge" style={{ fontSize: '1.85rem' }}>
              ₹{monthlyBudget.toLocaleString('en-IN')}
            </div>
          </div>

          <div
            style={{
              textAlign: 'right',
              background: '#EEF2FF',
              padding: '10px 14px',
              borderRadius: '14px',
              border: '1px solid #C7D2FE',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
              <Clock size={14} color="#4F46E5" />
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#4F46E5' }}>
                {metrics.daysRemaining} DAYS LEFT
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
              in August 2026
            </span>
          </div>
        </div>

        {/* Main Percentage Diagram (Donut / Ring Chart Card) */}
        <div className="white-card" style={{ padding: '24px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span className="card-title-sm" style={{ margin: 0 }}>
              BUDGET UTILIZATION
            </span>
            {metrics.isOverspent ? (
              <span className="badge badge-danger">
                <AlertCircle size={12} />
                OVERSPENT
              </span>
            ) : (
              <span className="badge badge-success">
                <CheckCircle2 size={12} />
                HEALTHY
              </span>
            )}
          </div>

          <DonutChart
            spentPercentage={metrics.spentPercentage}
            remainingPercentage={metrics.remainingPercentage}
            totalSpent={metrics.totalPersonalSpent}
            remaining={metrics.remainingBudget}
            monthlyBudget={monthlyBudget}
            isOverspent={metrics.isOverspent}
            overspentAmount={metrics.overspentAmount}
          />
        </div>

        {/* Safe Daily Spending Card */}
        <div className="white-card" style={{ borderLeft: '4px solid #4F46E5' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span className="card-title-sm">
                SAFE DAILY SPENDING
              </span>
              <div className="amount-huge" style={{ color: metrics.safeDailyLimit > 0 ? '#4F46E5' : '#64748B', margin: '4px 0' }}>
                {metrics.daysRemaining > 0 ? (
                  <>₹{Math.floor(metrics.safeDailyLimit)}<span style={{ fontSize: '1rem', fontWeight: 600, color: '#64748B' }}>/day</span></>
                ) : (
                  <span style={{ fontSize: '1.25rem', color: '#64748B' }}>Monthly period ended.</span>
                )}
              </div>
            </div>

            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: '#EEF2FF',
                color: '#4F46E5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TrendingUp size={20} />
            </div>
          </div>

          <p style={{ fontSize: '0.825rem', color: '#64748B', marginTop: '6px', fontWeight: 500 }}>
            {metrics.daysRemaining > 0 && metrics.remainingBudget > 0
              ? 'Stay around this amount to remain within your budget.'
              : metrics.isOverspent
              ? '⚠️ You have exceeded your budget. Try to minimize any additional spend.'
              : 'Monthly period ended.'}
          </p>
        </div>

        {/* Spending Prediction Card */}
        <div className="white-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span className="card-title-sm" style={{ margin: 0 }}>
              SPENDING PREDICTION
            </span>
            {metrics.isSufficientData && (
              metrics.isOnTrack ? (
                <span className="badge badge-success">
                  <CheckCircle2 size={12} />
                  On Track
                </span>
              ) : (
                <span className="badge badge-warning">
                  <AlertCircle size={12} />
                  At Risk
                </span>
              )
            )}
          </div>

          {metrics.isSufficientData ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '4px 0' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A' }}>
                  ₹{metrics.predictedMonthlySpending.toLocaleString('en-IN')}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>
                  projected this month
                </span>
              </div>

              <div
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#64748B',
                  marginBottom: '10px',
                }}
              >
                Current spending rate: <strong style={{ color: '#0F172A' }}>₹{metrics.dailySpendingRate}/day</strong>
              </div>

              {metrics.isOnTrack ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                    background: '#ECFDF5',
                    borderRadius: '10px',
                    border: '1px solid #A7F3D0',
                    color: '#065F46',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}
                >
                  <CheckCircle2 size={16} color="#10B981" />
                  <span>✓ You're currently on track.</span>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                    background: '#FFFBEB',
                    borderRadius: '10px',
                    border: '1px solid #FDE68A',
                    color: '#92400E',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}
                >
                  <AlertCircle size={16} color="#F59E0B" />
                  <span>⚠️ You may exceed your budget by ₹{metrics.predictionDifference.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                padding: '14px',
                background: '#F8FAFC',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                fontSize: '0.85rem',
                color: '#64748B',
                textAlign: 'center',
              }}
            >
              <p style={{ fontWeight: 600, color: '#0F172A', marginBottom: '2px' }}>
                🔮 Spending Prediction
              </p>
              <p style={{ fontSize: '0.8rem' }}>
                Keep tracking expenses to unlock a more accurate prediction.
              </p>
            </div>
          )}
        </div>

        {/* Function for Add New Expense Button */}
        <button
          onClick={() => navigate('/add-expense')}
          className="btn-primary"
          style={{
            height: '52px',
            fontSize: '1rem',
            boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)',
          }}
        >
          <Plus size={20} />
          <span>+ ADD NEW EXPENSE</span>
        </button>

        {/* Main Action Navigation Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          {/* Savings Button */}
          <div
            className="white-card"
            onClick={() => navigate('/savings')}
            style={{
              cursor: 'pointer',
              padding: '18px 16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              border: '1.5px solid #E2E8F0',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: '#ECFDF5',
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
              }}
            >
              <PiggyBank size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                💰 SAVINGS
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px', fontWeight: 500 }}>
                Smart tips to make cash last
              </p>
            </div>
          </div>

          {/* Expenses Button */}
          <div
            className="white-card"
            onClick={() => navigate('/expenses')}
            style={{
              cursor: 'pointer',
              padding: '18px 16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              border: '1.5px solid #E2E8F0',
            }}
          >
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
                marginBottom: '12px',
              }}
            >
              <Receipt size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                💸 EXPENSES
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px', fontWeight: 500 }}>
                ₹{metrics.totalPersonalSpent.toLocaleString('en-IN')} spent this month
              </p>
            </div>
          </div>
        </div>

        {/* Monthly Report Action Card */}
        <div
          className="white-card"
          onClick={() => navigate('/monthly-report')}
          style={{
            cursor: 'pointer',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: '1.5px solid #E2E8F0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: '#F5F3FF',
                color: '#7C3AED',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BarChart3 size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>
                📊 MONTHLY REPORT
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>
                Breakdown, insights & performance
              </p>
            </div>
          </div>

          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4F46E5' }}>
            View →
          </span>
        </div>
      </div>
    </div>
  );
};
