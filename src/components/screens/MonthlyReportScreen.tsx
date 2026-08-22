import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Header } from '../common/Header';
import { DonutChart } from '../common/DonutChart';
import { useNavigate } from 'react-router-dom';
import { CATEGORY_DETAILS } from '../../types';
import { 
  Calendar, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle,
  Lightbulb,
  ArrowLeft,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export const MonthlyReportScreen: React.FC = () => {
  const { monthYear, setMonthYear, monthlyBudget, metrics } = useFinance();
  const navigate = useNavigate();

  const handlePrevMonth = () => {
    if (monthYear === '2026-08') setMonthYear('2026-07');
    else if (monthYear === '2026-09') setMonthYear('2026-08');
  };

  const handleNextMonth = () => {
    if (monthYear === '2026-07') setMonthYear('2026-08');
    else if (monthYear === '2026-08') setMonthYear('2026-09');
  };

  const formattedMonthName = monthYear === '2026-08' ? 'August 2026' : monthYear === '2026-07' ? 'July 2026' : 'September 2026';

  let monthlyInsight = 'Keep recording your daily expenses to generate deep behavioral insights.';
  if (metrics.largestCategory && metrics.largestCategory.amount > 0) {
    monthlyInsight = `${metrics.largestCategory.category} was your largest expense this month, making up ${metrics.largestCategory.percentage}% (₹${metrics.largestCategory.amount.toLocaleString('en-IN')}) of total spending.`;
  }

  const potentialSavingsAmount = Math.round(metrics.totalPersonalSpent * 0.15);
  const topTwoCategories = metrics.categoryBreakdowns.slice(0, 2).map(c => c.category.toLowerCase()).join(' and ');

  return (
    <div>
      <Header title="Monthly Report" showBack backScreen="/" />

      <div className="main-content">
        {/* Month Selector Navigation */}
        <div
          className="white-card"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            border: '1px solid #E2E8F0',
          }}
        >
          <button
            type="button"
            onClick={handlePrevMonth}
            className="btn-ghost"
            style={{ padding: '6px 8px' }}
          >
            <ChevronLeft size={18} />
          </button>

          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
              <Calendar size={16} color="#4F46E5" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                {formattedMonthName}
              </h3>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
              Performance Statement
            </span>
          </div>

          <button
            type="button"
            onClick={handleNextMonth}
            className="btn-ghost"
            style={{ padding: '6px 8px' }}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Summary 4-card Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div className="white-card" style={{ padding: '14px' }}>
            <span className="card-title-sm">MONTHLY BUDGET</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
              ₹{monthlyBudget.toLocaleString('en-IN')}
            </div>
          </div>

          <div className="white-card" style={{ padding: '14px' }}>
            <span className="card-title-sm">TOTAL SPENT</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#4F46E5', marginTop: '2px' }}>
              ₹{metrics.totalPersonalSpent.toLocaleString('en-IN')}
            </div>
            <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>
              {metrics.spentPercentage}% of budget
            </span>
          </div>

          <div className="white-card" style={{ padding: '14px' }}>
            <span className="card-title-sm">REMAINING</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: metrics.isOverspent ? '#EF4444' : '#10B981', marginTop: '2px' }}>
              ₹{metrics.remainingBudget.toLocaleString('en-IN')}
            </div>
            <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>
              {metrics.remainingPercentage}% left
            </span>
          </div>

          <div className="white-card" style={{ padding: '14px' }}>
            <span className="card-title-sm">AVG SPENT/DAY</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
              ₹{metrics.dailySpendingRate}
            </div>
            <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>
              over {metrics.daysPassed} days
            </span>
          </div>
        </div>

        {/* Donut Ring Chart Breakdown */}
        <div className="white-card" style={{ padding: '24px 20px' }}>
          <span className="card-title-sm" style={{ marginBottom: '14px' }}>
            BUDGET DISTRIBUTION
          </span>

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

        {/* Category Breakdown with Percentage Bars */}
        <div className="white-card">
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', marginBottom: '14px' }}>
            Category Breakdown
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {metrics.categoryBreakdowns.filter(c => c.amount > 0).map(cat => {
              const meta = CATEGORY_DETAILS[cat.category] || CATEGORY_DETAILS.Other;
              return (
                <div key={cat.category}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{meta.emoji}</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0F172A' }}>
                        {cat.category}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0F172A' }}>
                        ₹{cat.amount.toLocaleString('en-IN')}
                      </span>
                      <span className="badge badge-primary" style={{ padding: '2px 8px', fontSize: '0.7rem' }}>
                        {cat.percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ width: '100%', height: '7px', background: '#F1F5F9', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(100, cat.percentage)}%`,
                        background: meta.color,
                        borderRadius: '9999px',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly Prediction Status */}
        <div className="white-card">
          <span className="card-title-sm">MONTHLY PREDICTION & BURN</span>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '6px 0 10px 0' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>Expected total spending:</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
              ₹{metrics.predictedMonthlySpending.toLocaleString('en-IN')}
            </span>
          </div>

          {metrics.isOnTrack ? (
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
              <span>✓ You stayed within your budget.</span>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px',
                background: '#FEF2F2',
                borderRadius: '10px',
                border: '1px solid #FECACA',
                color: '#991B1B',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              <AlertTriangle size={18} color="#EF4444" />
              <span>⚠️ You exceeded your budget by ₹{metrics.predictionDifference.toLocaleString('en-IN')}.</span>
            </div>
          )}
        </div>

        {/* Monthly Insight Card */}
        <div className="white-card" style={{ borderLeft: '4px solid #4F46E5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Sparkles size={18} color="#4F46E5" />
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A' }}>
              Monthly Insight
            </h4>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#0F172A', lineHeight: 1.45 }}>
            {monthlyInsight}
          </p>
        </div>

        {/* Potential Savings Strategy */}
        <div className="white-card" style={{ borderLeft: '4px solid #10B981' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Lightbulb size={18} color="#10B981" />
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A' }}>
              Potential Next Month Savings
            </h4>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#0F172A', lineHeight: 1.45 }}>
            You could potentially save <strong>₹{potentialSavingsAmount > 0 ? potentialSavingsAmount : 150}</strong> next month by optimizing {topTwoCategories || 'food and entertainment'} spending.
          </p>
        </div>

        {/* Back Button */}
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
