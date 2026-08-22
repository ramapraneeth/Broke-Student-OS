import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Header } from '../common/Header';
import { AddExpenseModal } from './AddExpenseModal';
import { ExpenseDetailModal } from './ExpenseDetailModal';
import { useNavigate } from 'react-router-dom';
import { Expense, ExpenseCategory, CATEGORY_DETAILS } from '../../types';
import { 
  Plus, 
  Users, 
  Home as HomeIcon, 
  ArrowRight, 
  Receipt, 
  ChevronRight 
} from 'lucide-react';

export const ExpensesScreen: React.FC = () => {
  const { expenses, metrics } = useFinance();
  const navigate = useNavigate();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<ExpenseCategory | 'All'>('All');

  // Filter expenses by selected category
  const filteredExpenses = expenses.filter(e => {
    if (selectedCategoryFilter === 'All') return true;
    return e.category === selectedCategoryFilter;
  });

  return (
    <div>
      <Header title="Expenses Hub" showBack backScreen="/" />

      <div className="main-content">
        {/* Header & Monthly Total Spent */}
        <div
          className="white-card"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px',
            border: '1px solid #E2E8F0',
          }}
        >
          <div>
            <span className="card-title-sm">THIS MONTH</span>
            <div className="amount-huge" style={{ fontSize: '2rem', color: '#0F172A' }}>
              ₹{metrics.totalPersonalSpent.toLocaleString('en-IN')}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
              total personal spent
            </span>
          </div>

          <div
            style={{
              textAlign: 'right',
              background: '#F8FAFC',
              padding: '10px 14px',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
            }}
          >
            <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Budget Left</span>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: metrics.isOverspent ? '#EF4444' : '#10B981' }}>
              ₹{metrics.remainingBudget.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Main Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <button
            onClick={() => navigate('/add-expense')}
            className="btn-primary"
            style={{ height: '48px' }}
          >
            <Plus size={18} />
            <span>+ ADD EXPENSE</span>
          </button>

          <button
            onClick={() => navigate('/split-bill')}
            className="btn-secondary"
            style={{ height: '48px', color: '#4F46E5', borderColor: '#C7D2FE', background: '#EEF2FF' }}
          >
            <Users size={18} color="#4F46E5" />
            <span>SPLIT BILL</span>
          </button>
        </div>

        {/* Hostel Expenses Summary Card */}
        <div
          className="white-card"
          onClick={() => navigate('/hostel-expenses')}
          style={{
            cursor: 'pointer',
            padding: '18px',
            border: '1.5px solid #E2E8F0',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#F0FDFA',
                  color: '#0D9488',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <HomeIcon size={18} />
              </div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>
                🏠 HOSTEL EXPENSES
              </h3>
            </div>

            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4F46E5', display: 'flex', alignItems: 'center', gap: '4px' }}>
              View <ArrowRight size={14} />
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              background: '#F8FAFC',
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
            }}
          >
            <div>
              <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Your share:</span>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                ₹{metrics.hostelSummary.userShare.toLocaleString('en-IN')}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
                {metrics.hostelSummary.userOwes > 0 ? 'You owe:' : 'You get back:'}
              </span>
              <div
                style={{
                  fontSize: '1rem',
                  fontWeight: 800,
                  color: metrics.hostelSummary.userOwes > 0 ? '#DC2626' : '#10B981',
                }}
              >
                ₹{(metrics.hostelSummary.userOwes > 0 ? metrics.hostelSummary.userOwes : metrics.hostelSummary.userReceivable).toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>

        {/* Categories Section */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>
              Categories Breakdown
            </h3>
            {selectedCategoryFilter !== 'All' && (
              <button
                onClick={() => setSelectedCategoryFilter('All')}
                className="btn-ghost"
                style={{ fontSize: '0.75rem', padding: '2px 8px' }}
              >
                Clear filter
              </button>
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '10px',
            }}
          >
            {metrics.categoryBreakdowns.map(item => {
              const meta = CATEGORY_DETAILS[item.category];
              const isFilterActive = selectedCategoryFilter === item.category;

              return (
                <div
                  key={item.category}
                  className="white-card"
                  onClick={() => setSelectedCategoryFilter(isFilterActive ? 'All' : item.category)}
                  style={{
                    padding: '12px 14px',
                    cursor: 'pointer',
                    border: isFilterActive ? `2px solid #4F46E5` : '1px solid #E2E8F0',
                    background: isFilterActive ? '#EEF2FF' : '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.25rem' }}>{meta.emoji}</span>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A' }}>
                        {meta.name}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                        {item.percentage}% of total
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A' }}>
                      ₹{item.amount.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Expenses List */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>
              Recent Expenses {selectedCategoryFilter !== 'All' && `(${selectedCategoryFilter})`}
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
              {filteredExpenses.length} items
            </span>
          </div>

          {filteredExpenses.length === 0 ? (
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
                  background: '#EEF2FF',
                  color: '#4F46E5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px auto',
                }}
              >
                <Receipt size={24} />
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                💸 No expenses yet.
              </h4>
              <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '4px', marginBottom: '16px' }}>
                Start tracking your spending to understand where your money goes.
              </p>
              <button
                onClick={() => navigate('/add-expense')}
                className="btn-primary"
                style={{ width: 'auto', padding: '10px 24px', margin: '0 auto' }}
              >
                <Plus size={16} />
                <span>+ Add Expense</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredExpenses.map(item => {
                const meta = CATEGORY_DETAILS[item.category] || CATEGORY_DETAILS.Other;
                return (
                  <div
                    key={item.id}
                    className="white-card"
                    onClick={() => setSelectedExpense(item)}
                    style={{
                      padding: '12px 14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          background: meta.bgColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.2rem',
                          flexShrink: 0,
                        }}
                      >
                        {meta.emoji}
                      </div>

                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A' }}>
                          {item.title}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#64748B' }}>
                          <span>{item.category}</span>
                          <span>•</span>
                          <span>{item.date}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                          ₹{item.amount.toLocaleString('en-IN')}
                        </div>
                      </div>
                      <ChevronRight size={16} color="#CBD5E1" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Expense Modal */}
      <AddExpenseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* Expense Detail / Edit / Delete Modal */}
      <ExpenseDetailModal
        expense={selectedExpense}
        onClose={() => setSelectedExpense(null)}
      />
    </div>
  );
};
