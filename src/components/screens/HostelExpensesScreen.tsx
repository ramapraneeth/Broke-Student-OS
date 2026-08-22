import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Header } from '../common/Header';
import { AddHostelExpenseModal } from './AddHostelExpenseModal';
import { useNavigate } from 'react-router-dom';
import { Home, Plus, Trash2 } from 'lucide-react';

export const HostelExpensesScreen: React.FC = () => {
  const { hostelExpenses, deleteHostelExpense, metrics } = useFinance();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div>
      <Header title="Hostel Room 204" showBack backScreen="/expenses" />

      <div className="main-content">
        {/* Room Header Card */}
        <div
          className="white-card"
          style={{
            padding: '20px',
            border: '1px solid #E2E8F0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: '#F0FDFA',
                color: '#0D9488',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Home size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>
                Room 204 Expenses
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#64748B' }}>
                Shared hostel bills (WiFi, groceries, water, cleaning)
              </p>
            </div>
          </div>

          {/* 4 Summary Metric Boxes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Total shared expenses:</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                ₹{metrics.hostelSummary.totalShared.toLocaleString('en-IN')}
              </div>
            </div>

            <div style={{ background: '#EEF2FF', padding: '12px', borderRadius: '12px', border: '1px solid #C7D2FE' }}>
              <span style={{ fontSize: '0.72rem', color: '#4F46E5', fontWeight: 600 }}>Your actual share:</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#4F46E5' }}>
                ₹{metrics.hostelSummary.userShare.toLocaleString('en-IN')}
              </div>
            </div>

            <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>You paid directly:</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                ₹{metrics.hostelSummary.userPaid.toLocaleString('en-IN')}
              </div>
            </div>

            <div
              style={{
                background: metrics.hostelSummary.userOwes > 0 ? '#FEF2F2' : '#ECFDF5',
                padding: '12px',
                borderRadius: '12px',
                border: `1px solid ${metrics.hostelSummary.userOwes > 0 ? '#FECACA' : '#A7F3D0'}`,
              }}
            >
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: metrics.hostelSummary.userOwes > 0 ? '#DC2626' : '#065F46',
                }}
              >
                {metrics.hostelSummary.userOwes > 0 ? 'You owe roomies:' : 'Roomies owe you:'}
              </span>
              <div
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: metrics.hostelSummary.userOwes > 0 ? '#DC2626' : '#10B981',
                }}
              >
                ₹{(metrics.hostelSummary.userOwes > 0 ? metrics.hostelSummary.userOwes : metrics.hostelSummary.userReceivable).toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>

        {/* Add Action Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary"
          style={{ height: '48px' }}
        >
          <Plus size={18} />
          <span>+ ADD SHARED EXPENSE</span>
        </button>

        {/* Expense List */}
        <div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', marginBottom: '10px' }}>
            Shared Room Bills ({hostelExpenses.length})
          </h3>

          {hostelExpenses.length === 0 ? (
            <div
              className="white-card"
              style={{
                textAlign: 'center',
                padding: '36px 20px',
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: '#F0FDFA',
                  color: '#0D9488',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px auto',
                }}
              >
                <Home size={24} />
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                🏠 No shared expenses yet.
              </h4>
              <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '4px', marginBottom: '16px' }}>
                Add common hostel expenses like WiFi, water, and groceries to split automatically.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn-primary"
                style={{ width: 'auto', padding: '10px 24px', margin: '0 auto' }}
              >
                <Plus size={16} />
                <span>+ Add Shared Expense</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {hostelExpenses.map(item => (
                <div
                  key={item.id}
                  className="white-card"
                  style={{
                    padding: '14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>
                      {item.title}
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                      Total: ₹{item.totalAmount.toLocaleString('en-IN')} • Paid by <strong>{item.paidBy}</strong> • {item.members.length} members
                    </p>
                    <div style={{ fontSize: '0.75rem', color: '#4F46E5', fontWeight: 700, marginTop: '4px' }}>
                      Your Share: ₹{item.userShare.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Delete "${item.title}" from hostel expenses?`)) {
                        deleteHostelExpense(item.id);
                      }
                    }}
                    style={{
                      background: '#FEF2F2',
                      border: '1px solid #FECACA',
                      borderRadius: '8px',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#DC2626',
                      cursor: 'pointer',
                    }}
                    title="Delete hostel bill"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AddHostelExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
