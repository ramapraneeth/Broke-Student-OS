import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { ExpenseCategory, CATEGORY_DETAILS } from '../../types';
import { scanExpenseReceipt, ScannedExpenseResult } from '../../utils/geminiScanner';
import { X, Calendar, FileText, Check, Sparkles, Loader2, CheckCircle2, FileImage, Camera, AlertTriangle } from 'lucide-react';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose }) => {
  const { addExpense, metrics } = useFinance();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Food');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Gemini state
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScannedExpenseResult | null>(null);
  const [scanError, setScanError] = useState('');

  const [errorAmount, setErrorAmount] = useState('');
  const [errorTitle, setErrorTitle] = useState('');

  if (!isOpen) return null;

  const numAmount = parseFloat(amount) || 0;
  const isOver500 = numAmount > 500;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsScanning(true);
      setScanError('');
      try {
        const res = await scanExpenseReceipt(file);
        setScanResult(res);
        if (res.amount > 0) setAmount(res.amount.toString());
        if (res.title) setTitle(res.title);
        if (res.category) setCategory(res.category);
        if (res.date) setDate(res.date);
        if (res.note) setNote(res.note);
      } catch (err: any) {
        setScanError(err.message || 'Could not parse screenshot.');
      } finally {
        setIsScanning(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    let isValid = true;

    if (!title.trim()) {
      setErrorTitle('Please enter an expense name.');
      isValid = false;
    } else {
      setErrorTitle('');
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorAmount('Please enter a valid amount greater than ₹0.');
      isValid = false;
    } else {
      setErrorAmount('');
    }

    if (!isValid) return;

    if (parsedAmount > 500) {
      const confirmed = window.confirm(
        `🚨 High-Value Expense Alert!\n\nThis expense of ₹${parsedAmount.toLocaleString('en-IN')} exceeds ₹500.\nIt will rapidly reduce your remaining monthly budget (₹${metrics.remainingBudget}).\n\nDo you want to confirm and add this expense?`
      );
      if (!confirmed) return;
    }

    setIsSubmitting(true);
    try {
      await addExpense({
        title: title.trim(),
        amount: parsedAmount,
        category,
        note: note.trim() || undefined,
        date,
        type: 'personal',
      });

      setTitle('');
      setAmount('');
      setNote('');
      setCategory('Food');
      setScanResult(null);
      onClose();
    } catch {
      alert('Something went wrong while saving your expense.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = Object.keys(CATEGORY_DETAILS) as ExpenseCategory[];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
              Add New Expense
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748B' }}>
              Enter manually or scan screenshot with Gemini AI
            </p>
          </div>
          <button
            type="button"
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

        {/* Gemini Screenshot Upload Area */}
        <div
          style={{
            border: '1.5px dashed #C7D2FE',
            background: '#F8FAFF',
            borderRadius: '12px',
            padding: '12px',
            marginBottom: '14px',
            textAlign: 'center',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <input
            id="modal-gallery-input"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <input
            id="modal-camera-input"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <label
              htmlFor="modal-gallery-input"
              style={{
                background: '#4F46E5',
                color: '#FFFFFF',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '0.8rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {isScanning ? (
                <>
                  <Loader2 size={15} className="spin-animation" />
                  <span>Scanning with Gemini AI...</span>
                </>
              ) : (
                <>
                  <FileImage size={15} />
                  <span>Choose Screenshot</span>
                </>
              )}
            </label>

            <label
              htmlFor="modal-camera-input"
              style={{
                background: '#FFFFFF',
                color: '#0F172A',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '0.8rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <Camera size={15} />
              <span>Camera</span>
            </label>
          </div>

          {scanResult && (
            <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <CheckCircle2 size={14} />
              <span>Extracted ₹{scanResult.amount} • {scanResult.category} ({scanResult.receiver}) {scanResult.amount > 500 && '⚠️ > ₹500'}</span>
            </div>
          )}

          {scanError && (
            <div style={{ marginTop: '6px', fontSize: '0.72rem', color: '#DC2626' }}>
              ⚠️ {scanError}
            </div>
          )}
        </div>

        {/* High Expense Warning Alert if > 500 */}
        {isOver500 && (
          <div
            style={{
              padding: '10px 12px',
              background: '#FFFBEB',
              borderRadius: '10px',
              border: '1px solid #FCD34D',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px',
            }}
          >
            <AlertTriangle size={18} color="#D97706" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#92400E' }}>
              🚨 Large Expense Alert: ₹{numAmount} exceeds ₹500 threshold.
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Amount Field (Hero) */}
          <div className="form-group">
            <label className="form-label" htmlFor="modal-expense-amount">Amount (₹)</label>
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: isOver500 ? '#D97706' : '#4F46E5',
                  fontWeight: 800,
                  fontSize: '1.4rem',
                }}
              >
                ₹
              </span>
              <input
                id="modal-expense-amount"
                type="number"
                step="any"
                className={`input-field ${errorAmount ? 'input-error' : ''}`}
                style={{
                  paddingLeft: '48px',
                  fontSize: '1.35rem',
                  fontWeight: 800,
                  color: '#0F172A',
                  height: '50px',
                  borderColor: isOver500 ? '#FCD34D' : '#E2E8F0',
                }}
                placeholder="0"
                value={amount}
                onChange={e => {
                  setAmount(e.target.value);
                  if (errorAmount) setErrorAmount('');
                }}
                autoFocus
              />
            </div>
            {errorAmount && <span className="error-text">⚠️ {errorAmount}</span>}
          </div>

          {/* Title Field */}
          <div className="form-group">
            <label className="form-label" htmlFor="modal-expense-title">Expense Name / Receiver</label>
            <input
              id="modal-expense-title"
              type="text"
              className={`input-field ${errorTitle ? 'input-error' : ''}`}
              placeholder="e.g. Biryani, Metro, Ramesh Kumar"
              value={title}
              onChange={e => {
                setTitle(e.target.value);
                if (errorTitle) setErrorTitle('');
              }}
            />
            {errorTitle && <span className="error-text">⚠️ {errorTitle}</span>}
          </div>

          {/* Category Selector Grid */}
          <div className="form-group">
            <label className="form-label">Category</label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
                marginTop: '4px',
              }}
            >
              {categories.map(cat => {
                const meta = CATEGORY_DETAILS[cat];
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '10px 4px',
                      borderRadius: '12px',
                      border: isSelected ? `2px solid #4F46E5` : `1px solid #E2E8F0`,
                      background: isSelected ? '#EEF2FF' : '#FFFFFF',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span style={{ fontSize: '1.25rem', marginBottom: '4px' }}>{meta.emoji}</span>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: isSelected ? 700 : 500,
                        color: isSelected ? '#4F46E5' : '#0F172A',
                      }}
                    >
                      {meta.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Field */}
          <div className="form-group">
            <label className="form-label" htmlFor="modal-expense-date">Date</label>
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94A3B8',
                  display: 'flex',
                }}
              >
                <Calendar size={18} />
              </span>
              <input
                id="modal-expense-date"
                type="date"
                className="input-field"
                style={{ paddingLeft: '42px' }}
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
          </div>

          {/* Optional Note */}
          <div className="form-group">
            <label className="form-label" htmlFor="modal-expense-note">Note (Optional)</label>
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '14px',
                  color: '#94A3B8',
                  display: 'flex',
                }}
              >
                <FileText size={18} />
              </span>
              <textarea
                id="modal-expense-note"
                className="input-field"
                style={{ paddingLeft: '42px', minHeight: '50px', resize: 'vertical' }}
                placeholder="Add any extra details..."
                value={note}
                onChange={e => setNote(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
            style={{
              height: '48px',
              marginTop: '8px',
              background: isOver500 ? '#D97706' : '#4F46E5',
            }}
          >
            {isSubmitting ? (
              <span>Saving Expense...</span>
            ) : (
              <>
                <Check size={18} />
                <span>{isOver500 ? `CONFIRM & SAVE (₹${numAmount})` : 'ADD EXPENSE'}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
