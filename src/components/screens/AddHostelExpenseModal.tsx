import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { X, Check } from 'lucide-react';

interface AddHostelExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddHostelExpenseModal: React.FC<AddHostelExpenseModalProps> = ({ isOpen, onClose }) => {
  const { user, addHostelExpense } = useFinance();

  const [title, setTitle] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [paidBy, setPaidBy] = useState(user?.name || 'Student');
  const [members] = useState<string[]>([user?.name || 'Student', 'Rahul', 'Arjun', 'Sai']);
  const [splitMethod, setSplitMethod] = useState<'equal' | 'custom'>('equal');
  const [customShares, setCustomShares] = useState<Record<string, string>>({
    [user?.name || 'Student']: '',
    Rahul: '',
    Arjun: '',
    Sai: '',
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const numAmount = parseFloat(totalAmount) || 0;
  const equalShare = members.length > 0 && numAmount > 0 
    ? Math.round((numAmount / members.length) * 100) / 100 
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('Please enter an expense name (e.g. WiFi, Water, Cleaning).');
      return;
    }

    if (numAmount <= 0) {
      setErrorMsg('Please enter a valid amount greater than ₹0.');
      return;
    }

    const calculatedShares: Record<string, number> = {};

    if (splitMethod === 'equal') {
      members.forEach(m => {
        calculatedShares[m] = equalShare;
      });
    } else {
      let customSum = 0;
      for (const m of members) {
        const val = parseFloat(customShares[m] || '0');
        if (isNaN(val) || val < 0) {
          setErrorMsg(`Please enter a valid share for ${m}.`);
          return;
        }
        customSum += val;
        calculatedShares[m] = val;
      }

      if (Math.abs(customSum - numAmount) > 0.5) {
        setErrorMsg(`Shares must add up to total ₹${numAmount}. Current sum is ₹${customSum}.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await addHostelExpense({
        title: title.trim(),
        totalAmount: numAmount,
        paidBy,
        members,
        splitMethod,
        shares: calculatedShares,
        date: new Date().toISOString().split('T')[0],
        roomName: 'Room 204',
      });

      setTitle('');
      setTotalAmount('');
      onClose();
    } catch {
      setErrorMsg('Failed to save hostel expense.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>
              Add Shared Hostel Expense
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748B' }}>
              Room 204 Common Bill
            </p>
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
            }}
          >
            <X size={18} color="#64748B" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Expense Name</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. WiFi Bill, Water Cans, Cleaning"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Total Amount (₹)</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#4F46E5', fontWeight: 800 }}>₹</span>
              <input
                type="number"
                step="any"
                className="input-field"
                style={{ paddingLeft: '38px', fontSize: '1.15rem', fontWeight: 700 }}
                placeholder="600"
                value={totalAmount}
                onChange={e => setTotalAmount(e.target.value)}
                min={1}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Who Paid?</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {members.map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaidBy(m)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: paidBy === m ? '2px solid #4F46E5' : '1px solid #E2E8F0',
                    background: paidBy === m ? '#EEF2FF' : '#FFFFFF',
                    color: paidBy === m ? '#4F46E5' : '#0F172A',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {m === user?.name ? `You (${m})` : m}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Split Method</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setSplitMethod('equal')}
                style={{
                  padding: '8px',
                  borderRadius: '8px',
                  border: splitMethod === 'equal' ? '2px solid #4F46E5' : '1px solid #E2E8F0',
                  background: splitMethod === 'equal' ? '#EEF2FF' : '#FFFFFF',
                  color: splitMethod === 'equal' ? '#4F46E5' : '#0F172A',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Equal ({members.length} members)
              </button>
              <button
                type="button"
                onClick={() => setSplitMethod('custom')}
                style={{
                  padding: '8px',
                  borderRadius: '8px',
                  border: splitMethod === 'custom' ? '2px solid #4F46E5' : '1px solid #E2E8F0',
                  background: splitMethod === 'custom' ? '#EEF2FF' : '#FFFFFF',
                  color: splitMethod === 'custom' ? '#4F46E5' : '#0F172A',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Custom
              </button>
            </div>
          </div>

          <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '10px', marginBottom: '16px', fontSize: '0.8rem', color: '#64748B' }}>
            {splitMethod === 'equal' ? (
              <div>
                Each member share: <strong>₹{equalShare}</strong>
                <br />
                Your share: <strong>₹{equalShare}</strong> (Only this counts as your personal spend)
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {members.map(m => (
                  <div key={m} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{m}:</span>
                    <input
                      type="number"
                      className="input-field"
                      style={{ width: '100px', padding: '4px 8px', fontSize: '0.85rem' }}
                      placeholder="0"
                      value={customShares[m] || ''}
                      onChange={e => setCustomShares({ ...customShares, [m]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {errorMsg && <p className="error-text" style={{ marginBottom: '12px' }}>⚠️ {errorMsg}</p>}

          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
            style={{ height: '48px' }}
          >
            <Check size={18} />
            <span>{isSubmitting ? 'Saving to Neon...' : 'ADD SHARED EXPENSE'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
