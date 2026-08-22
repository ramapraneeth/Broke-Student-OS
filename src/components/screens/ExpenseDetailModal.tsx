import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Expense, ExpenseCategory, CATEGORY_DETAILS } from '../../types';
import { X, Trash2, Edit2, Check, Calendar, Tag, FileText } from 'lucide-react';

interface ExpenseDetailModalProps {
  expense: Expense | null;
  onClose: () => void;
}

export const ExpenseDetailModal: React.FC<ExpenseDetailModalProps> = ({ expense, onClose }) => {
  const { deleteExpense, editExpense } = useFinance();

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(expense?.title || '');
  const [amount, setAmount] = useState(expense?.amount?.toString() || '');
  const [category, setCategory] = useState<ExpenseCategory>(expense?.category || 'Food');
  const [note, setNote] = useState(expense?.note || '');
  const [date, setDate] = useState(expense?.date || '');

  if (!expense) return null;

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${expense.title}"?`)) {
      deleteExpense(expense.id);
      onClose();
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!title.trim() || isNaN(numAmount) || numAmount <= 0) {
      alert('Please provide a valid title and amount greater than ₹0.');
      return;
    }

    editExpense(expense.id, {
      title: title.trim(),
      amount: numAmount,
      category,
      note: note.trim() || undefined,
      date,
    });
    setIsEditing(false);
  };

  const meta = CATEGORY_DETAILS[expense.category];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span className="badge badge-primary">
            {meta.emoji} {expense.category}
          </span>
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
            }}
          >
            <X size={18} color="#64748B" />
          </button>
        </div>

        {!isEditing ? (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>Amount Spent</span>
              <div className="amount-huge" style={{ color: '#0F172A', marginTop: '2px' }}>
                ₹{expense.amount.toLocaleString('en-IN')}
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0F172A', marginTop: '6px' }}>
                {expense.title}
              </h3>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                padding: '14px',
                background: '#F8FAFC',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                <Calendar size={16} color="#64748B" />
                <span style={{ color: '#64748B' }}>Date:</span>
                <strong style={{ color: '#0F172A' }}>{expense.date}</strong>
              </div>

              {expense.note && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.85rem' }}>
                  <FileText size={16} color="#64748B" style={{ marginTop: '2px' }} />
                  <span style={{ color: '#64748B' }}>Note:</span>
                  <span style={{ color: '#0F172A' }}>{expense.note}</span>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                <Tag size={16} color="#64748B" />
                <span style={{ color: '#64748B' }}>Type:</span>
                <span style={{ textTransform: 'capitalize', color: '#0F172A', fontWeight: 600 }}>
                  {expense.type.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setTitle(expense.title);
                  setAmount(expense.amount.toString());
                  setCategory(expense.category);
                  setNote(expense.note || '');
                  setDate(expense.date);
                  setIsEditing(true);
                }}
              >
                <Edit2 size={16} />
                <span>Edit</span>
              </button>

              <button
                type="button"
                style={{
                  background: '#FEF2F2',
                  color: '#DC2626',
                  border: '1px solid #FECACA',
                  borderRadius: '12px',
                  padding: '12px',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                }}
                onClick={handleDelete}
              >
                <Trash2 size={16} />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveEdit}>
            <div className="form-group">
              <label className="form-label">Expense Title</label>
              <input
                type="text"
                className="input-field"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Amount (₹)</label>
              <input
                type="number"
                step="any"
                className="input-field"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
                min={1}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="input-field"
                value={category}
                onChange={e => setCategory(e.target.value as ExpenseCategory)}
              >
                {(Object.keys(CATEGORY_DETAILS) as ExpenseCategory[]).map(cat => (
                  <option key={cat} value={cat}>
                    {CATEGORY_DETAILS[cat].emoji} {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                type="date"
                className="input-field"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Note</label>
              <textarea
                className="input-field"
                style={{ minHeight: '50px' }}
                value={note}
                onChange={e => setNote(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '14px' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                <Check size={16} />
                <span>Save</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
