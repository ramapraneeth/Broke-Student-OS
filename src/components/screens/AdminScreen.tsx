import React, { useState, useMemo, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { DonutChart } from '../common/DonutChart';
import { CATEGORY_DETAILS, ExpenseCategory, Expense, LinkedChild } from '../../types';
import { 
  Users, 
  UserPlus, 
  Mail, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  Wallet, 
  Receipt,
  LogOut,
  Calendar,
  Sparkles,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  ChevronLeft,
  Clock,
  FileText,
  X,
  Plus,
  ArrowUpRight,
  Send,
  GraduationCap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EmailVerificationModal } from '../common/EmailVerificationModal';

export const AdminScreen: React.FC = () => {
  const { 
    user, 
    linkedChildren, 
    selectedChild, 
    setSelectedChild, 
    linkChild, 
    unlinkChild, 
    searchStudents,
    sendEmailOtp,
    childBudget, 
    childExpenses, 
    childMetrics, 
    monthYear, 
    logout 
  } = useFinance();
  const navigate = useNavigate();

  const [inputEmail, setInputEmail] = useState('');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string; email: string; isSetupComplete: boolean }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [linkMsg, setLinkMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showAddChildModal, setShowAddChildModal] = useState(false);

  // Student OTP Verification state
  const [targetStudentToLink, setTargetStudentToLink] = useState<{ id?: string; name: string; email: string } | null>(null);
  const [showLinkOtpModal, setShowLinkOtpModal] = useState(false);

  // Expense History Filters & Search for Selected Child
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [selectedExpenseDetail, setSelectedExpenseDetail] = useState<Expense | null>(null);

  // Search students live on modal query change
  useEffect(() => {
    if (!showAddChildModal) {
      setStudentSearchQuery('');
      setSearchResults([]);
      setLinkMsg(null);
      return;
    }

    const timer = setTimeout(async () => {
      if (studentSearchQuery.trim().length > 0) {
        setIsSearching(true);
        const results = await searchStudents(studentSearchQuery.trim());
        setSearchResults(results);
        setIsSearching(false);
      } else {
        // Fetch default suggestions
        setIsSearching(true);
        const results = await searchStudents('a');
        setSearchResults(results);
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [studentSearchQuery, showAddChildModal]);

  const handleInitiateLinking = async (targetEmail: string, studentName = 'Student') => {
    const cleanEmail = targetEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setLinkMsg({ type: 'error', text: 'Please enter a valid student email address.' });
      return;
    }

    setIsLinking(true);
    setLinkMsg(null);

    // Send 1-minute consent OTP to student's email address
    const otpRes = await sendEmailOtp(cleanEmail, 'link_child', 'student');
    setIsLinking(false);

    if (otpRes.success) {
      setTargetStudentToLink({ name: studentName, email: cleanEmail });
      setShowAddChildModal(false);
      setShowLinkOtpModal(true);
    } else {
      setLinkMsg({ type: 'error', text: otpRes.error || 'Failed to dispatch verification code to student.' });
    }
  };

  const handleVerifyOtpAndCompleteLink = async (otpCode: string): Promise<{ success: boolean; error?: string }> => {
    if (!targetStudentToLink?.email) {
      return { success: false, error: 'No student selected for linking.' };
    }

    const linkRes = await linkChild(targetStudentToLink.email, otpCode);
    if (linkRes.success) {
      setShowLinkOtpModal(false);
      setTargetStudentToLink(null);
      return { success: true };
    } else {
      return { success: false, error: linkRes.error || 'Invalid or expired verification code.' };
    }
  };

  const handleResendLinkOtp = async () => {
    if (!targetStudentToLink?.email) {
      return { success: false, error: 'No student selected.' };
    }
    return await sendEmailOtp(targetStudentToLink.email, 'link_child', 'student');
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out of Family Safety Hub?')) {
      logout();
      navigate('/login');
    }
  };

  // Filtered expenses based on search & category
  const filteredExpenses = useMemo(() => {
    return childExpenses.filter(exp => {
      const matchesSearch = 
        exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (exp.note && exp.note.toLowerCase().includes(searchQuery.toLowerCase())) ||
        exp.amount.toString().includes(searchQuery);

      if (selectedCategoryFilter === 'All') return matchesSearch;
      if (selectedCategoryFilter === 'Large (>₹500)') return matchesSearch && exp.amount > 500;
      return matchesSearch && exp.category === selectedCategoryFilter;
    });
  }, [childExpenses, searchQuery, selectedCategoryFilter]);

  const avatarColors = ['#2563EB', '#7C3AED', '#059669', '#EA580C', '#DB2777', '#0284C7'];

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      {/* Header */}
      <header
        style={{
          background: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {selectedChild ? (
            <button
              onClick={() => setSelectedChild(null)}
              style={{
                background: '#F1F5F9',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#0F172A',
              }}
              title="Back to Children List"
            >
              <ChevronLeft size={20} />
            </button>
          ) : (
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(37, 99, 235, 0.25)',
              }}
            >
              <ShieldCheck size={22} />
            </div>
          )}

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h1 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
                {selectedChild ? `${selectedChild.name}'s Finances` : 'Family Safety Hub'}
              </h1>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  background: '#EFF6FF',
                  color: '#2563EB',
                  padding: '2px 6px',
                  borderRadius: '6px',
                  textTransform: 'uppercase',
                }}
              >
                Guardian
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
              {user?.name || 'Parent'} • {linkedChildren.length} {linkedChildren.length === 1 ? 'Child' : 'Children'} Linked
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setShowAddChildModal(true)}
            style={{
              background: '#EFF6FF',
              color: '#2563EB',
              border: '1px solid #BFDBFE',
              borderRadius: '10px',
              padding: '6px 12px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Plus size={14} />
            <span>Link Child</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#DC2626',
              cursor: 'pointer',
            }}
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <div className="main-content" style={{ paddingBottom: '40px' }}>
        {/* ========================================================================= */}
        {/* VIEW 1: ADMIN HOMEPAGE - SHOW CHILD PROFILE CARDS ONLY                    */}
        {/* ========================================================================= */}
        {!selectedChild ? (
          <div>
            {/* Welcome Banner */}
            <div
              style={{
                background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
                color: '#FFFFFF',
                borderRadius: '20px',
                padding: '22px 20px',
                marginBottom: '20px',
                boxShadow: '0 8px 20px rgba(37, 99, 235, 0.2)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      background: 'rgba(255, 255, 255, 0.2)',
                      padding: '3px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    GUARDIAN MONITORING
                  </span>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '8px 0 4px 0' }}>
                    Family Safety Dashboard
                  </h2>
                  <p style={{ fontSize: '0.82rem', opacity: 0.9, margin: 0, lineHeight: 1.4 }}>
                    Select a student profile below to view their detailed expenses history, safe daily limits & budget consumption.
                  </p>
                </div>

                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '14px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Users size={24} />
                </div>
              </div>
            </div>

            {/* Section Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Monitored Children ({linkedChildren.length})
              </span>
              <button
                type="button"
                onClick={() => setShowAddChildModal(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563EB',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <UserPlus size={14} />
                <span>+ Add Child</span>
              </button>
            </div>

            {/* Child Profile Cards Grid */}
            {linkedChildren.length === 0 ? (
              <div
                className="white-card"
                style={{
                  textAlign: 'center',
                  padding: '36px 20px',
                  border: '1.5px dashed #CBD5E1',
                  background: '#FFFFFF',
                }}
              >
                <div
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '50%',
                    background: '#EFF6FF',
                    color: '#2563EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px auto',
                  }}
                >
                  <Users size={28} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  No Children Linked Yet
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748B', maxWidth: '320px', margin: '6px auto 18px auto' }}>
                  Link your child's 10-digit mobile number to start monitoring their expenses, allowances, and daily limits.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAddChildModal(true)}
                  className="btn-primary"
                  style={{ width: 'auto', padding: '10px 22px', fontSize: '0.9rem', margin: '0 auto' }}
                >
                  + Link Student Account
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {linkedChildren.map((child, index) => {
                  const avatarColor = avatarColors[index % avatarColors.length];

                  return (
                    <div
                      key={child.id}
                      onClick={() => setSelectedChild(child)}
                      style={{
                        background: '#FFFFFF',
                        borderRadius: '18px',
                        padding: '18px 20px',
                        border: '1.5px solid #E2E8F0',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        position: 'relative',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          {/* Child Avatar */}
                          <div
                            style={{
                              width: '50px',
                              height: '50px',
                              borderRadius: '16px',
                              background: avatarColor,
                              color: '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.3rem',
                              fontWeight: 800,
                              boxShadow: `0 4px 10px ${avatarColor}40`,
                              flexShrink: 0,
                            }}
                          >
                            {child.name.charAt(0).toUpperCase()}
                          </div>

                          {/* Child Name & Details */}
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                                {child.name}
                              </h3>
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  background: '#ECFDF5',
                                  color: '#059669',
                                  padding: '2px 7px',
                                  borderRadius: '6px',
                                }}
                              >
                                Active Student
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#64748B', fontSize: '0.8rem', marginTop: '3px' }}>
                              <Mail size={12} />
                              <span>{child.email}</span>
                            </div>
                          </div>
                        </div>

                        {/* Unlink button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Unlink ${child.name} from your Family Safety account?`)) {
                              unlinkChild(child.email);
                            }
                          }}
                          style={{
                            background: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#94A3B8',
                            cursor: 'pointer',
                          }}
                          title="Unlink student"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Card Action Footer */}
                      <div
                        style={{
                          marginTop: '14px',
                          paddingTop: '12px',
                          borderTop: '1px solid #F1F5F9',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
                          Tap to view expenses history & budget
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#2563EB', fontSize: '0.85rem', fontWeight: 700 }}>
                          <span>View Details</span>
                          <ArrowRight size={16} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* ========================================================================= */
          /* VIEW 2: CHILD DETAILED EXPENSES & FINANCIAL OVERVIEW                      */
          /* ========================================================================= */
          <div>
            {/* Back to Children Button */}
            <button
              type="button"
              onClick={() => setSelectedChild(null)}
              style={{
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: '12px',
                padding: '8px 14px',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#334155',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }}
            >
              <ChevronLeft size={16} />
              <span>← Back to Family Safety Hub</span>
            </button>

            {/* Child Profile Banner */}
            <div
              className="white-card"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                borderLeft: '4px solid #2563EB',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background: '#2563EB',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    fontWeight: 800,
                  }}
                >
                  {selectedChild.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="card-title-sm" style={{ margin: 0 }}>STUDENT PROFILE</span>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: '2px 0' }}>
                    {selectedChild.name}
                  </h2>
                  <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    Email: {selectedChild.email} • Month: {monthYear}
                  </span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span
                  className={`badge ${childMetrics.isOnTrack ? 'badge-safe' : 'badge-danger'}`}
                  style={{ fontSize: '0.75rem' }}
                >
                  {childMetrics.isOnTrack ? '✓ On Track' : '⚠️ High Burn'}
                </span>
              </div>
            </div>

            {/* Financial Overview 4 Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="white-card" style={{ padding: '14px' }}>
                <span className="card-title-sm">MONTHLY ALLOWANCE</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                  ₹{childBudget.toLocaleString('en-IN')}
                </div>
                <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>Stipend / pocket money</span>
              </div>

              <div className="white-card" style={{ padding: '14px' }}>
                <span className="card-title-sm">TOTAL SPENT</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2563EB', marginTop: '2px' }}>
                  ₹{childMetrics.totalPersonalSpent.toLocaleString('en-IN')}
                </div>
                <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>
                  {childMetrics.spentPercentage}% of allowance
                </span>
              </div>

              <div className="white-card" style={{ padding: '14px' }}>
                <span className="card-title-sm">REMAINING CASH</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: childMetrics.isOverspent ? '#EF4444' : '#10B981', marginTop: '2px' }}>
                  ₹{childMetrics.remainingBudget.toLocaleString('en-IN')}
                </div>
                <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>
                  {childMetrics.remainingPercentage}% available
                </span>
              </div>

              <div className="white-card" style={{ padding: '14px' }}>
                <span className="card-title-sm">SAFE DAILY LIMIT</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2563EB', marginTop: '2px' }}>
                  ₹{Math.floor(childMetrics.safeDailyLimit)}<span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>/day</span>
                </div>
                <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>
                  for next {childMetrics.daysRemaining} days
                </span>
              </div>
            </div>

            {/* Budget Utilization Ring Chart */}
            <div className="white-card" style={{ padding: '20px' }}>
              <span className="card-title-sm" style={{ marginBottom: '14px' }}>
                BUDGET CONSUMPTION RATIO
              </span>
              <DonutChart
                spentPercentage={childMetrics.spentPercentage}
                remainingPercentage={childMetrics.remainingPercentage}
                totalSpent={childMetrics.totalPersonalSpent}
                remaining={childMetrics.remainingBudget}
                monthlyBudget={childBudget}
                isOverspent={childMetrics.isOverspent}
                overspentAmount={childMetrics.overspentAmount}
              />
            </div>

            {/* Category Breakdown */}
            <div className="white-card">
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', marginBottom: '14px' }}>
                Category Breakdown
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {childMetrics.categoryBreakdowns.map(cat => {
                  const meta = CATEGORY_DETAILS[cat.category] || CATEGORY_DETAILS.Other;
                  return (
                    <div key={cat.category}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{meta.emoji}</span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>
                            {cat.category}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A' }}>
                            ₹{cat.amount.toLocaleString('en-IN')}
                          </span>
                          <span className="badge badge-primary" style={{ padding: '2px 8px', fontSize: '0.7rem' }}>
                            {cat.percentage}%
                          </span>
                        </div>
                      </div>

                      <div style={{ width: '100%', height: '6px', background: '#F1F5F9', borderRadius: '9999px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${Math.min(100, cat.percentage)}%`,
                            background: meta.color,
                            borderRadius: '9999px',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Comprehensive Child Expenses History Feed */}
            <div className="white-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    {selectedChild.name}'s Expenses History
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    Showing {filteredExpenses.length} of {childExpenses.length} transactions
                  </span>
                </div>
              </div>

              {/* Search Bar */}
              <div style={{ position: 'relative', marginBottom: '12px' }}>
                <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  className="input-field"
                  style={{ paddingLeft: '38px', height: '40px', fontSize: '0.85rem' }}
                  placeholder="Search transactions, notes, amounts..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Category Filter Chips */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '14px' }}>
                {['All', 'Large (>₹500)', 'Food', 'Transport', 'Education', 'Shopping', 'Entertainment', 'Hostel', 'Other'].map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategoryFilter(cat)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      flexShrink: 0,
                      background: selectedCategoryFilter === cat ? '#2563EB' : '#F1F5F9',
                      color: selectedCategoryFilter === cat ? '#FFFFFF' : '#64748B',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Transactions List */}
              {filteredExpenses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: '#64748B' }}>
                  <Receipt size={32} color="#CBD5E1" style={{ margin: '0 auto 8px auto' }} />
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>
                    No matching expenses found for this filter.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filteredExpenses.map(item => {
                    const meta = CATEGORY_DETAILS[item.category] || CATEGORY_DETAILS.Other;
                    const isLargeExpense = item.amount > 500;

                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedExpenseDetail(item)}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '12px',
                          border: isLargeExpense ? '1.5px solid #FDE68A' : '1px solid #E2E8F0',
                          background: isLargeExpense ? '#FFFDF5' : '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '10px',
                              background: meta.bgColor,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.15rem',
                            }}
                          >
                            {meta.emoji}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>
                                {item.title}
                              </span>
                              {isLargeExpense && (
                                <span
                                  style={{
                                    fontSize: '0.65rem',
                                    fontWeight: 800,
                                    background: '#FEF3C7',
                                    color: '#D97706',
                                    padding: '2px 5px',
                                    borderRadius: '4px',
                                  }}
                                >
                                  ⚠️ &gt;₹500
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                              {item.category} • {item.date} {item.note && `• "${item.note}"`}
                            </div>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: isLargeExpense ? '#D97706' : '#0F172A' }}>
                            ₹{item.amount.toLocaleString('en-IN')}
                          </div>
                          <span style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 600 }}>
                            {item.type}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Link Child Modal */}
      {/* Link Student Account Modal (Search & Find Child with Email + 1-Min OTP) */}
      {showAddChildModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={() => setShowAddChildModal(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '24px',
              width: '100%',
              maxWidth: '460px',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              border: '1px solid #E2E8F0',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '12px',
                    background: '#EFF6FF',
                    color: '#2563EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    Link Student Account
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    Search and verify child account
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowAddChildModal(false)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} color="#64748B" />
              </button>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '0 0 16px 0', lineHeight: 1.4 }}>
              Search for your student's account by name or email. Once selected, a <strong>1-minute security code</strong> will be sent to their email for linking consent.
            </p>

            {/* Live Search Input */}
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                Search Student Accounts
              </label>
              <div style={{ position: 'relative' }}>
                <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  className="input-field"
                  style={{ paddingLeft: '38px' }}
                  placeholder="Type name or email (e.g. chiya, ram@gmail.com)"
                  value={studentSearchQuery}
                  onChange={e => setStudentSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            {/* Search Results List */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                minHeight: '140px',
                maxHeight: '220px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                marginBottom: '16px',
                paddingRight: '4px',
              }}
            >
              {isSearching ? (
                <div style={{ textAlign: 'center', padding: '24px', color: '#64748B', fontSize: '0.85rem' }}>
                  <span>Searching student accounts...</span>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map(student => {
                  const isAlreadyLinked = linkedChildren.some(c => c.email.toLowerCase() === student.email.toLowerCase());

                  return (
                    <div
                      key={student.id}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '14px',
                        border: '1.5px solid #E2E8F0',
                        background: isAlreadyLinked ? '#F8FAFC' : '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: '#EEF2FF',
                            color: '#4F46E5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.9rem',
                            flexShrink: 0,
                          }}
                        >
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {student.name}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {student.email}
                          </div>
                        </div>
                      </div>

                      {isAlreadyLinked ? (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: '#059669',
                            background: '#ECFDF5',
                            padding: '4px 8px',
                            borderRadius: '8px',
                            flexShrink: 0,
                          }}
                        >
                          ✓ Linked
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={isLinking}
                          onClick={() => handleInitiateLinking(student.email, student.name)}
                          style={{
                            background: '#2563EB',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '6px 12px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            flexShrink: 0,
                          }}
                        >
                          <Send size={12} />
                          <span>Select & Send Code</span>
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 12px', color: '#94A3B8', fontSize: '0.82rem' }}>
                  No student accounts found matching "{studentSearchQuery}".
                </div>
              )}
            </div>

            {/* Direct Email Fallback */}
            <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '14px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', marginBottom: '6px' }}>
                Or enter student email directly:
              </div>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  if (inputEmail) handleInitiateLinking(inputEmail);
                }}
                style={{ display: 'flex', gap: '8px' }}
              >
                <input
                  type="email"
                  className="input-field"
                  style={{ flex: 1, height: '40px', fontSize: '0.85rem' }}
                  placeholder="student@gmail.com"
                  value={inputEmail}
                  onChange={e => setInputEmail(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={isLinking || !inputEmail}
                  style={{
                    background: '#0F172A',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '0 14px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: isLinking || !inputEmail ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isLinking ? 'Sending...' : 'Send Code'}
                </button>
              </form>
            </div>

            {linkMsg && (
              <div
                style={{
                  marginTop: '12px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  background: linkMsg.type === 'success' ? '#ECFDF5' : '#FEF2F2',
                  color: linkMsg.type === 'success' ? '#065F46' : '#991B1B',
                  border: `1px solid ${linkMsg.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
                }}
              >
                {linkMsg.type === 'success' ? '✓ ' : '⚠️ '}
                {linkMsg.text}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 1-Minute Expiring OTP Verification Modal for Parent Entering Child's Consent Code */}
      {targetStudentToLink && (
        <EmailVerificationModal
          isOpen={showLinkOtpModal}
          email={targetStudentToLink.email}
          reason="link_child"
          onClose={() => {
            setShowLinkOtpModal(false);
            setTargetStudentToLink(null);
          }}
          onVerify={handleVerifyOtpAndCompleteLink}
          onResend={handleResendLinkOtp}
        />
      )}

      {/* Transaction Detail Modal for Parent */}
      {selectedExpenseDetail && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setSelectedExpenseDetail(null)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '420px',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span className="badge badge-primary">
                {CATEGORY_DETAILS[selectedExpenseDetail.category]?.emoji} {selectedExpenseDetail.category}
              </span>
              <button
                onClick={() => setSelectedExpenseDetail(null)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} color="#64748B" />
              </button>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>Amount Spent</span>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: selectedExpenseDetail.amount > 500 ? '#D97706' : '#0F172A', marginTop: '2px' }}>
                ₹{selectedExpenseDetail.amount.toLocaleString('en-IN')}
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', marginTop: '4px' }}>
                {selectedExpenseDetail.title}
              </h3>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                padding: '14px',
                background: '#F8FAFC',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                marginBottom: '18px',
                fontSize: '0.82rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={14} color="#64748B" />
                <span style={{ color: '#64748B' }}>Date:</span>
                <strong style={{ color: '#0F172A' }}>{selectedExpenseDetail.date}</strong>
              </div>

              {selectedExpenseDetail.note && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <FileText size={14} color="#64748B" style={{ marginTop: '2px' }} />
                  <span style={{ color: '#64748B' }}>Note:</span>
                  <span style={{ color: '#0F172A' }}>{selectedExpenseDetail.note}</span>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={14} color="#64748B" />
                <span style={{ color: '#64748B' }}>Payment Type:</span>
                <span style={{ textTransform: 'capitalize', color: '#0F172A', fontWeight: 700 }}>
                  {selectedExpenseDetail.type.replace('_', ' ')}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedExpenseDetail(null)}
              className="btn-primary"
              style={{ width: '100%', height: '44px' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
