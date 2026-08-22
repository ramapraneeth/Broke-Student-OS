import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Header } from '../common/Header';
import { useNavigate } from 'react-router-dom';
import { generateSavingSuggestions } from '../../utils/calculations';
import { 
  Lightbulb, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowLeft,
  Sparkles 
} from 'lucide-react';

export const SavingsScreen: React.FC = () => {
  const { metrics } = useFinance();
  const navigate = useNavigate();
  const suggestions = generateSavingSuggestions(metrics);

  return (
    <div>
      <Header title="Savings & Strategies" showBack backScreen="/" />

      <div className="main-content">
        {/* Top Summary Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          {/* Current Remaining */}
          <div className="white-card" style={{ borderTop: '4px solid #10B981', padding: '16px' }}>
            <span className="card-title-sm">CURRENT REMAINING</span>
            <div className="amount-huge" style={{ fontSize: '1.75rem', color: metrics.isOverspent ? '#EF4444' : '#10B981', margin: '4px 0' }}>
              ₹{metrics.remainingBudget.toLocaleString('en-IN')}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
              {metrics.remainingPercentage}% of total budget
            </span>
          </div>

          {/* Safe Daily Limit */}
          <div className="white-card" style={{ borderTop: '4px solid #4F46E5', padding: '16px' }}>
            <span className="card-title-sm">SAFE DAILY LIMIT</span>
            <div className="amount-huge" style={{ fontSize: '1.75rem', color: '#4F46E5', margin: '4px 0' }}>
              {metrics.daysRemaining > 0 ? (
                <>₹{Math.floor(metrics.safeDailyLimit)}<span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748B' }}>/day</span></>
              ) : (
                <span style={{ fontSize: '1rem', color: '#64748B' }}>Ended</span>
              )}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
              for next {metrics.daysRemaining} days
            </span>
          </div>
        </div>

        {/* Spending Prediction Burn Rate Card */}
        <div className="white-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <TrendingDown size={18} color="#4F46E5" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>
              Spending Prediction & Burn Rate
            </h3>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '12px 14px',
              background: '#F8FAFC',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              marginBottom: '12px',
            }}
          >
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Current spending rate:</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                ₹{metrics.dailySpendingRate}/day
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Predicted monthly spending:</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: metrics.isOnTrack ? '#10B981' : '#EF4444' }}>
                ₹{metrics.predictedMonthlySpending.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {metrics.isSufficientData ? (
            !metrics.isOnTrack ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px',
                  background: '#FFFBEB',
                  borderRadius: '10px',
                  border: '1px solid #FDE68A',
                  color: '#92400E',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                <AlertTriangle size={18} color="#F59E0B" />
                <span>⚠️ You may exceed your budget by ₹{metrics.predictionDifference.toLocaleString('en-IN')}</span>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px',
                  background: '#ECFDF5',
                  borderRadius: '10px',
                  border: '1px solid #A7F3D0',
                  color: '#065F46',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                <CheckCircle2 size={18} color="#10B981" />
                <span>✓ On Track! Your burn rate leaves a surplus of ₹{metrics.predictionDifference.toLocaleString('en-IN')}.</span>
              </div>
            )
          ) : (
            <p style={{ fontSize: '0.8rem', color: '#64748B', textAlign: 'center' }}>
              🔮 Keep tracking for a few days to unlock full spending projections.
            </p>
          )}
        </div>

        {/* Transparent Rule-Based Saving Suggestions */}
        <div className="white-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Lightbulb size={18} color="#F59E0B" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>
              Transparent Saving Suggestions
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {suggestions.map((suggestion, idx) => (
              <div
                key={idx}
                style={{
                  padding: '14px',
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  fontSize: '0.875rem',
                  color: '#0F172A',
                  lineHeight: 1.45,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                }}
              >
                <Sparkles size={16} color="#4F46E5" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{suggestion}</span>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: '16px',
              padding: '10px 12px',
              background: '#F8FAFC',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              fontSize: '0.75rem',
              color: '#64748B',
              textAlign: 'center',
            }}
          >
            🔒 Rule-based deterministic logic. Zero hallucinated AI.
          </div>
        </div>

        {/* Back to Home CTA */}
        <button
          onClick={() => navigate('/')}
          className="btn-secondary"
          style={{ height: '46px' }}
        >
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </button>
      </div>
    </div>
  );
};
