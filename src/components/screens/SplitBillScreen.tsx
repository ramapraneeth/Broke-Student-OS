import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Header } from '../common/Header';
import { useNavigate } from 'react-router-dom';
import { Plus, Check, Trash2, Info } from 'lucide-react';

export const SplitBillScreen: React.FC = () => {
  const { user, addSplitBill, splitBills, deleteSplitBill } = useFinance();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [paidBy, setPaidBy] = useState(user?.name || 'Student');
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');
  
  const [participants, setParticipants] = useState<string[]>([user?.name || 'Student', 'Rahul', 'Arjun', 'Sai']);
  const [customShares, setCustomShares] = useState<Record<string, string>>({
    [user?.name || 'Student']: '',
    Rahul: '',
    Arjun: '',
    Sai: '',
  });

  const [newFriendName, setNewFriendName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const numBill = parseFloat(totalAmount) || 0;
  const isPaidByUser = paidBy.toLowerCase() === (user?.name || 'Student').toLowerCase();

  const equalSharePerPerson = participants.length > 0 && numBill > 0 
    ? Math.round((numBill / participants.length) * 100) / 100 
    : 0;

  const handleAddFriend = () => {
    if (!newFriendName.trim()) return;
    const name = newFriendName.trim();
    if (!participants.includes(name)) {
      setParticipants(prev => [...prev, name]);
      setCustomShares(prev => ({ ...prev, [name]: '' }));
    }
    setNewFriendName('');
  };

  const handleRemoveParticipant = (name: string) => {
    if (name === user?.name) {
      alert('You cannot remove yourself from the bill.');
      return;
    }
    setParticipants(prev => prev.filter(p => p !== name));
    if (paidBy === name) setPaidBy(user?.name || 'Student');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMsg('');
    setSuccessMsg('');

    if (!title.trim()) {
      setErrorMsg('Please enter a bill title (e.g. Dinner at Paradise).');
      return;
    }

    if (numBill <= 0) {
      setErrorMsg('Please enter a valid total bill amount greater than ₹0.');
      return;
    }

    if (participants.length === 0) {
      setErrorMsg('Please select at least 1 participant.');
      return;
    }

    let calculatedShares: { name: string; share: number; isUser: boolean; paid: boolean }[] = [];

    if (splitType === 'equal') {
      calculatedShares = participants.map(p => ({
        name: p,
        share: equalSharePerPerson,
        isUser: p === user?.name,
        paid: p === paidBy,
      }));
    } else {
      let customTotal = 0;
      for (const p of participants) {
        const val = parseFloat(customShares[p] || '0');
        if (isNaN(val) || val < 0) {
          setErrorMsg(`Please enter a valid share for ${p}.`);
          return;
        }
        customTotal += val;
        calculatedShares.push({
          name: p,
          share: val,
          isUser: p === user?.name,
          paid: p === paidBy,
        });
      }

      if (Math.abs(customTotal - numBill) > 0.5) {
        setErrorMsg(`Custom shares sum to ₹${customTotal}, which must equal the total bill of ₹${numBill}.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await addSplitBill({
        title: title.trim(),
        totalAmount: numBill,
        paidBy,
        participants: calculatedShares,
        splitType,
        date: new Date().toISOString().split('T')[0],
      });

      setSuccessMsg('Bill split successfully and saved to Neon DB! Only your actual share counts towards personal spending.');
      setTitle('');
      setTotalAmount('');
    } catch {
      setErrorMsg('Failed to save split bill.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <Header title="Split Bill" showBack backScreen="/expenses" />

      <div className="main-content">
        {/* Intro Accounting Clarification Box */}
        <div
          style={{
            padding: '14px',
            background: '#EEF2FF',
            borderRadius: '12px',
            border: '1px solid #C7D2FE',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
          }}
        >
          <Info size={18} color="#4F46E5" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.8rem', color: '#3730A3', lineHeight: 1.4 }}>
            <strong>Smart Student Accounting:</strong> If you pay ₹800 for 4 people, only your <strong>₹200 share</strong> counts towards personal spending. The ₹600 is recorded as receivable!
          </div>
        </div>

        {/* Split Form */}
        <div className="white-card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="split-title">Bill Description</label>
              <input
                id="split-title"
                type="text"
                className="input-field"
                placeholder="e.g. Weekend Biryani Feast, Cafe Bill"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="split-total">Total Bill Amount (₹)</label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#4F46E5',
                    fontWeight: 800,
                    fontSize: '1.25rem',
                  }}
                >
                  ₹
                </span>
                <input
                  id="split-total"
                  type="number"
                  step="any"
                  className="input-field"
                  style={{ paddingLeft: '44px', fontSize: '1.25rem', fontWeight: 800 }}
                  placeholder="800"
                  value={totalAmount}
                  onChange={e => setTotalAmount(e.target.value)}
                  min={1}
                  required
                />
              </div>
            </div>

            {/* Paid By Selector */}
            <div className="form-group">
              <label className="form-label">Who Paid The Bill?</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {participants.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPaidBy(p)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '10px',
                      border: paidBy === p ? '2px solid #4F46E5' : '1px solid #E2E8F0',
                      background: paidBy === p ? '#EEF2FF' : '#FFFFFF',
                      color: paidBy === p ? '#4F46E5' : '#0F172A',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {p === user?.name ? `You (${p})` : p}
                  </button>
                ))}
              </div>
            </div>

            {/* Participants Selector */}
            <div className="form-group">
              <label className="form-label">Participants ({participants.length})</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                {participants.map(p => (
                  <div
                    key={p}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: '9999px',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                    }}
                  >
                    <span>{p === user?.name ? `You (${p})` : p}</span>
                    {p !== user?.name && (
                      <button
                        type="button"
                        onClick={() => handleRemoveParticipant(p)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#94A3B8',
                          cursor: 'pointer',
                          padding: '0 2px',
                          display: 'flex',
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add friend input */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="input-field"
                  style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                  placeholder="Add friend name (e.g. Priya)"
                  value={newFriendName}
                  onChange={e => setNewFriendName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddFriend();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddFriend}
                  className="btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '0.85rem', flexShrink: 0 }}
                >
                  <Plus size={16} />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* Split Type Tabs */}
            <div className="form-group">
              <label className="form-label">Split Method</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setSplitType('equal')}
                  style={{
                    padding: '10px',
                    borderRadius: '10px',
                    border: splitType === 'equal' ? '2px solid #4F46E5' : '1px solid #E2E8F0',
                    background: splitType === 'equal' ? '#EEF2FF' : '#FFFFFF',
                    color: splitType === 'equal' ? '#4F46E5' : '#0F172A',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Equal Split
                </button>

                <button
                  type="button"
                  onClick={() => setSplitType('custom')}
                  style={{
                    padding: '10px',
                    borderRadius: '10px',
                    border: splitType === 'custom' ? '2px solid #4F46E5' : '1px solid #E2E8F0',
                    background: splitType === 'custom' ? '#EEF2FF' : '#FFFFFF',
                    color: splitType === 'custom' ? '#4F46E5' : '#0F172A',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Custom Split
                </button>
              </div>
            </div>

            {/* Calculated Breakdown Preview */}
            <div
              style={{
                padding: '14px',
                background: '#F8FAFC',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                marginBottom: '16px',
              }}
            >
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                Breakdown Preview
              </span>

              {splitType === 'equal' ? (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.85rem', color: '#0F172A' }}>Share per person:</span>
                    <strong style={{ fontSize: '0.95rem', color: '#4F46E5' }}>
                      ₹{equalSharePerPerson} each
                    </strong>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '6px' }}>
                    {isPaidByUser ? (
                      <span>
                        • Your personal expense: <strong>₹{equalSharePerPerson}</strong><br />
                        • Others owe you in total: <strong>₹{Math.max(0, numBill - equalSharePerPerson)}</strong>
                      </span>
                    ) : (
                      <span>
                        • You owe {paidBy}: <strong>₹{equalSharePerPerson}</strong>
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {participants.map(p => (
                    <div key={p} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <span style={{ fontSize: '0.85rem', color: '#0F172A' }}>{p}:</span>
                      <div style={{ position: 'relative', width: '120px' }}>
                        <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>₹</span>
                        <input
                          type="number"
                          className="input-field"
                          style={{ padding: '6px 8px 6px 22px', fontSize: '0.85rem' }}
                          placeholder="0"
                          value={customShares[p] || ''}
                          onChange={e => setCustomShares({ ...customShares, [p]: e.target.value })}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {errorMsg && <p className="error-text" style={{ marginBottom: '12px' }}>⚠️ {errorMsg}</p>}
            {successMsg && (
              <div style={{ padding: '10px', background: '#ECFDF5', borderRadius: '8px', color: '#065F46', fontSize: '0.8rem', marginBottom: '12px', fontWeight: 600 }}>
                {successMsg}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
              style={{ height: '48px' }}
            >
              <Check size={18} />
              <span>{isSubmitting ? 'Saving to Neon...' : 'SPLIT & RECORD EXPENSE'}</span>
            </button>
          </form>
        </div>

        {/* Recorded Split Bills List */}
        {splitBills.length > 0 && (
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', marginBottom: '10px' }}>
              Recorded Split Bills ({splitBills.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {splitBills.map(bill => (
                <div
                  key={bill.id}
                  className="white-card"
                  style={{
                    padding: '14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A' }}>
                      {bill.title}
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      Total: ₹{bill.totalAmount} • Paid by {bill.paidBy} • {bill.participants.length} people
                    </p>
                    <div style={{ marginTop: '4px', fontSize: '0.75rem', color: '#4F46E5', fontWeight: 600 }}>
                      Your Share: ₹{bill.userShare} {bill.totalReceivable > 0 && `(Receivable: ₹${bill.totalReceivable})`}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Delete "${bill.title}"?`)) {
                        deleteSplitBill(bill.id);
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
                    title="Delete bill"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
