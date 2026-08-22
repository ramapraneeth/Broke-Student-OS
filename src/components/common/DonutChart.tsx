import React from 'react';

interface DonutChartProps {
  spentPercentage: number;
  remainingPercentage: number;
  totalSpent: number;
  remaining: number;
  monthlyBudget: number;
  isOverspent: boolean;
  overspentAmount: number;
  size?: number;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  spentPercentage,
  remainingPercentage,
  totalSpent,
  remaining,
  isOverspent,
  overspentAmount,
  size = 210,
}) => {
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Cap spent percentage for the primary circle stroke
  const visualSpentPercentage = isOverspent ? 100 : Math.min(100, Math.max(0, spentPercentage));
  const spentDashOffset = circumference - (visualSpentPercentage / 100) * circumference;

  // Colors
  const spentColor = isOverspent ? '#EF4444' : '#4F46E5'; // Red if overspent, else Indigo
  const remainingColor = '#10B981'; // Emerald green
  const emptyTrackColor = '#F1F5F9'; // Light slate track

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      {/* Chart SVG */}
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
        >
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={emptyTrackColor}
            strokeWidth={strokeWidth}
          />

          {/* Remaining segment (if not overspent) */}
          {!isOverspent && remainingPercentage > 0 && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke={remainingColor}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={0}
              strokeLinecap="round"
            />
          )}

          {/* Spent segment */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={spentColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={spentDashOffset}
            strokeLinecap={visualSpentPercentage >= 100 || visualSpentPercentage <= 0 ? 'butt' : 'round'}
            style={{
              transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </svg>

        {/* Center Text */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '10px',
          }}
        >
          {isOverspent ? (
            <>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                OVERSPENT
              </span>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#EF4444', letterSpacing: '-0.02em' }}>
                ₹{overspentAmount.toLocaleString('en-IN')}
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>
                {spentPercentage}% of budget
              </span>
            </>
          ) : (
            <>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                REMAINING
              </span>
              <span style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em' }}>
                ₹{remaining.toLocaleString('en-IN')}
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>
                {remainingPercentage}% left
              </span>
            </>
          )}
        </div>
      </div>

      {/* Percentage Badges Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '16px',
          marginTop: '18px',
          width: '100%',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#F8FAFC',
            padding: '6px 14px',
            borderRadius: '9999px',
            border: '1px solid #E2E8F0',
          }}
        >
          <span
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: spentColor,
            }}
          />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A' }}>
            {spentPercentage}% SPENT
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#F8FAFC',
            padding: '6px 14px',
            borderRadius: '9999px',
            border: '1px solid #E2E8F0',
          }}
        >
          <span
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: remainingColor,
            }}
          />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A' }}>
            {remainingPercentage}% REMAINING
          </span>
        </div>
      </div>

      {/* Detail Balance line: ₹420 Spent | ₹580 Remaining */}
      <div
        style={{
          marginTop: '12px',
          fontSize: '0.85rem',
          fontWeight: 600,
          color: '#64748B',
          textAlign: 'center',
        }}
      >
        <span>₹{totalSpent.toLocaleString('en-IN')} Spent</span>
        <span style={{ margin: '0 8px', color: '#CBD5E1' }}>|</span>
        <span style={{ color: isOverspent ? '#EF4444' : '#10B981', fontWeight: 700 }}>
          ₹{remaining.toLocaleString('en-IN')} Remaining
        </span>
      </div>
    </div>
  );
};
