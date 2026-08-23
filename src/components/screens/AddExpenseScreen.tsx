import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Header } from '../common/Header';
import { useNavigate } from 'react-router-dom';
import { ExpenseCategory, CATEGORY_DETAILS } from '../../types';
import { scanExpenseReceipt, ScannedExpenseResult } from '../../utils/geminiScanner';
import { 
  Camera, 
  UploadCloud, 
  Sparkles, 
  Check, 
  Loader2, 
  X, 
  CheckCircle2, 
  ArrowLeft, 
  FileImage,
  AlertTriangle,
  Flame
} from 'lucide-react';

const CATEGORIES: ExpenseCategory[] = [
  'Food',
  'Transport',
  'Education',
  'Shopping',
  'Entertainment',
  'Hostel',
  'Recharge',
  'Other',
];

export const AddExpenseScreen: React.FC = () => {
  const { addExpense, metrics } = useFinance();
  const navigate = useNavigate();

  // Form State
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  
  // Screenshot & AI Scanner State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScannedExpenseResult | null>(null);
  const [scanError, setScanError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const numAmount = parseFloat(amount) || 0;
  const isOverSafeLimit = metrics.daysRemaining > 0 && numAmount > metrics.safeDailyLimit;
  const isOver500 = numAmount > 500;

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setScanError('');
      setScanResult(null);
      triggerGeminiScan(file);
    }
  };

  // Perform Gemini AI Scan
  const triggerGeminiScan = async (fileToScan: File) => {
    setIsScanning(true);
    setScanError('');
    try {
      const result = await scanExpenseReceipt(fileToScan);
      setScanResult(result);

      if (result.amount > 0) setAmount(result.amount.toString());
      if (result.title) setTitle(result.title);
      if (result.category) setCategory(result.category);
      if (result.date) setDate(result.date);
      if (result.note) setNote(result.note);
    } catch (err: any) {
      console.error(err);
      setScanError(err.message || 'Could not scan screenshot. You can enter details manually.');
    } finally {
      setIsScanning(false);
    }
  };

  // Remove uploaded image
  const handleClearImage = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setScanResult(null);
    setScanError('');
  };

  // Submit Expense
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (numAmount <= 0) {
      alert('Please enter a valid expense amount greater than ₹0.');
      return;
    }

    if (!title.trim()) {
      alert('Please enter an expense title.');
      return;
    }

    // Alert if expense exceeds ₹500
    if (isOver500) {
      const confirmed = window.confirm(
        `🚨 High-Value Expense Alert!\n\nThis expense of ₹${numAmount.toLocaleString('en-IN')} exceeds the ₹500 threshold.\nIt will take up a significant portion of your remaining monthly allowance (₹${metrics.remainingBudget}).\n\nDo you want to proceed and add this expense?`
      );
      if (!confirmed) return;
    }

    setIsSubmitting(true);
    try {
      await addExpense({
        amount: numAmount,
        title: title.trim(),
        category,
        date,
        note: note.trim() || undefined,
        type: 'personal',
      });

      setSuccessMsg('Expense added and saved to Neon PostgreSQL database!');
      setTimeout(() => {
        navigate('/expenses');
      }, 1000);
    } catch (err) {
      alert('Failed to save expense to database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Auto-Add directly from Scan
  const handleAutoAddFromScan = async () => {
    if (!scanResult || scanResult.amount <= 0) return;
    
    if (scanResult.amount > 500) {
      const confirmed = window.confirm(
        `🚨 High-Value Expense Alert!\n\nThe scanned receipt amount is ₹${scanResult.amount.toLocaleString('en-IN')} (exceeds ₹500 limit).\n\nDo you want to proceed and add this expense?`
      );
      if (!confirmed) return;
    }

    setIsSubmitting(true);
    try {
      await addExpense({
        amount: scanResult.amount,
        title: scanResult.title,
        category: scanResult.category,
        date: scanResult.date,
        note: scanResult.note,
        type: 'personal',
      });
      setSuccessMsg('Scanned expense added instantly to Neon DB!');
      setTimeout(() => {
        navigate('/expenses');
      }, 1000);
    } catch (err) {
      alert('Failed to save expense.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <Header title="Add New Expense" showBack backScreen="/expenses" />

      <div className="main-content">
        {/* Gemini AI Screenshot Scanner Card */}
        <div
          className="white-card"
          style={{
            border: '2px dashed #C7D2FE',
            background: '#F8FAFF',
            padding: '16px',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#4F46E5',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>
                  Smart Screenshot Scanner
                </h3>
                <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                  Powered by Gemini Flash AI
                </span>
              </div>
            </div>

            <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
              Auto-Extract
            </span>
          </div>

          {/* Native Hidden File Inputs for Gallery and Camera */}
          <input
            id="gallery-file-input"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <input
            id="camera-file-input"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {!previewUrl ? (
            <div
              style={{
                textAlign: 'center',
                padding: '20px 14px',
                borderRadius: '12px',
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                userSelect: 'none',
                WebkitUserSelect: 'none',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: '#EEF2FF',
                  color: '#4F46E5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 8px auto',
                }}
              >
                <UploadCloud size={24} />
              </div>

              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                Upload Payment Screenshot / Receipt
              </div>
              <p style={{ fontSize: '0.75rem', color: '#64748B', maxWidth: '320px', margin: '0 auto 12px auto' }}>
                Upload GPay, PhonePe, Paytm, or bill screenshots. Gemini AI will automatically extract Amount, Merchant, Date, & Purpose.
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <label
                  htmlFor="gallery-file-input"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    borderRadius: '10px',
                    background: '#4F46E5',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)',
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                  }}
                >
                  <FileImage size={15} />
                  <span>Choose Screenshot</span>
                </label>

                <label
                  htmlFor="camera-file-input"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    borderRadius: '10px',
                    background: '#FFFFFF',
                    color: '#0F172A',
                    border: '1px solid #CBD5E1',
                    cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                  }}
                >
                  <Camera size={15} />
                  <span>Take Photo</span>
                </label>
              </div>
            </div>
          ) : (
            <div>
              {/* Preview & Status Card */}
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '12px',
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  alignItems: 'center',
                }}
              >
                <img
                  src={previewUrl}
                  alt="Receipt Preview"
                  style={{
                    width: '64px',
                    height: '64px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    flexShrink: 0,
                  }}
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selectedFile?.name}
                    </span>
                    <button
                      type="button"
                      onClick={handleClearImage}
                      style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '2px' }}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {isScanning ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4F46E5', fontSize: '0.75rem', fontWeight: 600, marginTop: '4px' }}>
                      <Loader2 size={14} className="spin-animation" />
                      <span>Gemini AI is analyzing screenshot...</span>
                    </div>
                  ) : scanResult ? (
                    <div style={{ marginTop: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', fontSize: '0.75rem', fontWeight: 700 }}>
                        <CheckCircle2 size={14} />
                        <span>Extracted: ₹{scanResult.amount} ({scanResult.receiver})</span>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#64748B' }}>
                        Category: <strong>{scanResult.category}</strong>
                      </span>
                    </div>
                  ) : (
                    <label
                      htmlFor="gallery-file-input"
                      style={{ fontSize: '0.75rem', color: '#4F46E5', fontWeight: 600, cursor: 'pointer', display: 'inline-block', marginTop: '4px' }}
                    >
                      Choose another image
                    </label>
                  )}
                </div>
              </div>

              {/* Instant 1-Click Auto Add from Scan */}
              {scanResult && !isScanning && (
                <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleAutoAddFromScan}
                    disabled={isSubmitting}
                    className="btn-primary"
                    style={{ height: '40px', fontSize: '0.8rem', background: scanResult.amount > 500 ? '#D97706' : '#059669' }}
                  >
                    <Check size={16} />
                    <span>Instant Auto-Add (₹{scanResult.amount}) {scanResult.amount > 500 && '⚠️ > ₹500'}</span>
                  </button>
                </div>
              )}

              {scanError && (
                <p className="error-text" style={{ marginTop: '8px', fontSize: '0.75rem' }}>
                  ⚠️ {scanError}
                </p>
              )}
            </div>
          )}
        </div>

        {/* High Expense Warning Alert if > 500 */}
        {isOver500 && (
          <div
            style={{
              padding: '14px',
              background: '#FFFBEB',
              borderRadius: '12px',
              border: '1.5px solid #FCD34D',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            <AlertTriangle size={20} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#92400E' }}>
                🚨 High Expense Alert: ₹{numAmount.toLocaleString('en-IN')} exceeds ₹500!
              </div>
              <div style={{ fontSize: '0.78rem', color: '#B45309', marginTop: '3px', lineHeight: 1.4 }}>
                This is a large expense that will rapidly deplete your monthly pocket money. Ensure this was essential.
              </div>
            </div>
          </div>
        )}

        {/* Manual / Verified Form */}
        <div className="white-card">
          <form onSubmit={handleSubmit}>
            {/* Amount */}
            <div className="form-group">
              <label className="form-label" htmlFor="expense-amount">Amount (₹)</label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: isOver500 ? '#D97706' : '#4F46E5',
                    fontWeight: 800,
                    fontSize: '1.25rem',
                  }}
                >
                  ₹
                </span>
                <input
                  id="expense-amount"
                  type="number"
                  step="any"
                  className="input-field"
                  style={{
                    paddingLeft: '44px',
                    fontSize: '1.35rem',
                    fontWeight: 800,
                    borderColor: isOver500 ? '#FCD34D' : '#E2E8F0',
                  }}
                  placeholder="0"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  min={1}
                  required
                />
              </div>

              {isOverSafeLimit && (
                <div style={{ marginTop: '6px', fontSize: '0.75rem', color: '#D97706', fontWeight: 600 }}>
                  ⚠️ ₹{numAmount} is above your safe daily limit of ₹{Math.floor(metrics.safeDailyLimit)}.
                </div>
              )}
            </div>

            {/* Title / Merchant Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="expense-title">Title / Receiver</label>
              <input
                id="expense-title"
                type="text"
                className="input-field"
                placeholder="e.g. Swiggy Lunch, Metro Card, Ramesh"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Category Selector */}
            <div className="form-group">
              <label className="form-label">Category</label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '8px',
                }}
              >
                {CATEGORIES.map(cat => {
                  const meta = CATEGORY_DETAILS[cat];
                  const isSelected = category === cat;

                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      style={{
                        padding: '10px 6px',
                        borderRadius: '10px',
                        border: isSelected ? `2px solid ${meta.color}` : '1px solid #E2E8F0',
                        background: isSelected ? meta.bgColor : '#FFFFFF',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span style={{ fontSize: '1.25rem' }}>{meta.emoji}</span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: isSelected ? 800 : 600,
                          color: isSelected ? meta.color : '#64748B',
                        }}
                      >
                        {cat}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date */}
            <div className="form-group">
              <label className="form-label" htmlFor="expense-date">Date</label>
              <input
                id="expense-date"
                type="date"
                className="input-field"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
              />
            </div>

            {/* Note / Tag */}
            <div className="form-group">
              <label className="form-label" htmlFor="expense-note">Note / Receipt Ref (Optional)</label>
              <input
                id="expense-note"
                type="text"
                className="input-field"
                placeholder="e.g. Scanned via Google Pay, Split with hostel mates"
                value={note}
                onChange={e => setNote(e.target.value)}
              />
            </div>

            {successMsg && (
              <div style={{ padding: '12px', background: '#ECFDF5', borderRadius: '10px', color: '#065F46', fontSize: '0.85rem', marginBottom: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} color="#10B981" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
              style={{
                height: '48px',
                background: isOver500 ? '#D97706' : '#4F46E5',
              }}
            >
              <Check size={18} />
              <span>{isSubmitting ? 'Saving to Database...' : isOver500 ? `CONFIRM & SAVE LARGE EXPENSE (₹${numAmount})` : '+ SAVE EXPENSE'}</span>
            </button>
          </form>
        </div>

        {/* Back to Expenses Button */}
        <button
          onClick={() => navigate('/expenses')}
          className="btn-secondary"
          style={{ height: '46px' }}
        >
          <ArrowLeft size={16} />
          <span>Cancel & Return</span>
        </button>
      </div>
    </div>
  );
};
