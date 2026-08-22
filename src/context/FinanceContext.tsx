import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  Expense, 
  SplitBill, 
  HostelExpense, 
  UserProfile, 
  FinancialMetrics,
  LinkedChild 
} from '../types';
import { calculateFinancialMetrics } from '../utils/calculations';

interface FinanceContextType {
  user: UserProfile | null;
  monthYear: string;
  monthlyBudget: number;
  expenses: Expense[];
  splitBills: SplitBill[];
  hostelExpenses: HostelExpense[];
  metrics: FinancialMetrics;
  isLoading: boolean;
  
  // Parent / Admin state
  linkedChildren: LinkedChild[];
  selectedChild: LinkedChild | null;
  childBudget: number;
  childExpenses: Expense[];
  childSplitBills: SplitBill[];
  childHostelExpenses: HostelExpense[];
  childMetrics: FinancialMetrics;
  
  setMonthYear: (my: string) => void;
  setSelectedChild: (c: LinkedChild | null) => void;
  login: (mobile: string, pass: string, role?: 'student' | 'parent') => Promise<{ success: boolean; role?: 'student' | 'parent'; error?: string }>;
  signup: (name: string, mobile: string, pass: string, role?: 'student' | 'parent') => Promise<{ success: boolean; error?: string }>;
  resetPassword: (mobile: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateBudget: (name: string, amount: number) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;
  editExpense: (id: string, expense: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addSplitBill: (bill: Omit<SplitBill, 'id' | 'createdAt' | 'userShare' | 'totalReceivable' | 'totalPayable'>) => Promise<void>;
  deleteSplitBill: (id: string) => Promise<void>;
  addHostelExpense: (exp: Omit<HostelExpense, 'id' | 'createdAt' | 'userShare'>) => Promise<void>;
  deleteHostelExpense: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
  
  // Parent actions
  fetchLinkedChildren: () => Promise<void>;
  linkChild: (childMobile: string) => Promise<{ success: boolean; student?: LinkedChild; error?: string }>;
  unlinkChild: (childMobile: string) => Promise<void>;
}

const STORAGE_AUTH_KEY = 'broke_os_auth_user';

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_AUTH_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [monthYear, setMonthYear] = useState<string>('2026-08');
  const [monthlyBudget, setMonthlyBudget] = useState<number>(1000);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [splitBills, setSplitBills] = useState<SplitBill[]>([]);
  const [hostelExpenses, setHostelExpenses] = useState<HostelExpense[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Parent State
  const [linkedChildren, setLinkedChildren] = useState<LinkedChild[]>([]);
  const [selectedChild, setSelectedChild] = useState<LinkedChild | null>(null);
  const [childBudget, setChildBudget] = useState<number>(1000);
  const [childExpenses, setChildExpenses] = useState<Expense[]>([]);
  const [childSplitBills, setChildSplitBills] = useState<SplitBill[]>([]);
  const [childHostelExpenses, setChildHostelExpenses] = useState<HostelExpense[]>([]);

  // Sync user auth to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_AUTH_KEY);
    }
  }, [user]);

  // Fetch all user data from Neon PostgreSQL database
  const refreshData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/data/${user.id}/${monthYear}`);
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(prev => prev ? { ...prev, isSetupComplete: data.user.is_setup_complete, role: data.user.role || prev.role } : null);
        }
        setMonthlyBudget(data.monthlyBudget || 1000);
        setExpenses(data.expenses || []);
        setSplitBills(data.splitBills || []);
        setHostelExpenses(data.hostelExpenses || []);
      }
    } catch (err) {
      console.error('Failed to load data from Neon DB:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, monthYear]);

  // Parent: Fetch linked children
  const fetchLinkedChildren = useCallback(async () => {
    if (!user?.id || user.role !== 'parent') return;
    try {
      const res = await fetch(`/api/parent/children/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setLinkedChildren(data.children || []);
        if (data.children?.length > 0 && !selectedChild) {
          setSelectedChild(data.children[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch linked children:', err);
    }
  }, [user?.id, user?.role, selectedChild]);

  // Parent: Fetch selected child data
  const fetchSelectedChildData = useCallback(async () => {
    if (!selectedChild?.id) return;
    try {
      const res = await fetch(`/api/data/${selectedChild.id}/${monthYear}`);
      if (res.ok) {
        const data = await res.json();
        setChildBudget(data.monthlyBudget || 1000);
        setChildExpenses(data.expenses || []);
        setChildSplitBills(data.splitBills || []);
        setChildHostelExpenses(data.hostelExpenses || []);
      }
    } catch (err) {
      console.error('Failed to load child data:', err);
    }
  }, [selectedChild?.id, monthYear]);

  // Load data when user or month changes
  useEffect(() => {
    if (user?.id) {
      if (user.role === 'parent') {
        fetchLinkedChildren();
      } else {
        refreshData();
      }
    } else {
      setExpenses([]);
      setSplitBills([]);
      setHostelExpenses([]);
      setMonthlyBudget(1000);
      setLinkedChildren([]);
      setSelectedChild(null);
    }
  }, [user?.id, user?.role, monthYear, refreshData, fetchLinkedChildren]);

  // Load child data when selectedChild changes
  useEffect(() => {
    if (user?.role === 'parent' && selectedChild) {
      fetchSelectedChildData();
    }
  }, [user?.role, selectedChild, monthYear, fetchSelectedChildData]);

  // Single Source of Truth derived metrics
  const metrics = calculateFinancialMetrics(
    monthlyBudget,
    expenses,
    splitBills,
    hostelExpenses,
    monthYear,
    user?.name || 'Student'
  );

  // Child metrics for Parent view
  const childMetrics = calculateFinancialMetrics(
    childBudget,
    childExpenses,
    childSplitBills,
    childHostelExpenses,
    monthYear,
    selectedChild?.name || 'Child'
  );

  const login = async (mobile: string, pass: string, role?: 'student' | 'parent'): Promise<{ success: boolean; role?: 'student' | 'parent'; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber: mobile, password: pass, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }
      const userProfile: UserProfile = { ...data.user, isLoggedIn: true };
      setUser(userProfile);
      return { success: true, role: userProfile.role };
    } catch (err) {
      return { success: false, error: 'Network error connecting to Neon Database' };
    }
  };

  const signup = async (name: string, mobile: string, pass: string, role: 'student' | 'parent' = 'student'): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, mobileNumber: mobile, password: pass, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Signup failed' };
      }
      setUser({ ...data.user, isLoggedIn: true, isSetupComplete: role === 'parent' });
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Network error connecting to Neon Database' };
    }
  };

  const resetPassword = async (mobile: string, newPass: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber: mobile, newPassword: newPass }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Password reset failed' };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Network error' };
    }
  };

  const logout = () => {
    setUser(null);
    setExpenses([]);
    setSplitBills([]);
    setHostelExpenses([]);
    setLinkedChildren([]);
    setSelectedChild(null);
    localStorage.removeItem(STORAGE_AUTH_KEY);
  };

  // Parent: Link a new student child
  const linkChild = async (childMobile: string): Promise<{ success: boolean; student?: LinkedChild; error?: string }> => {
    if (!user?.id) return { success: false, error: 'Not logged in' };
    try {
      const res = await fetch('/api/parent/link-child', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentId: user.id, childMobile }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to link student account.' };
      }
      await fetchLinkedChildren();
      return { success: true, student: data.student };
    } catch (err) {
      return { success: false, error: 'Network error linking student.' };
    }
  };

  // Parent: Unlink child
  const unlinkChild = async (childMobile: string) => {
    if (!user?.id) return;
    try {
      await fetch('/api/parent/unlink-child', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentId: user.id, childMobile }),
      });
      setLinkedChildren(prev => prev.filter(c => c.mobileNumber !== childMobile));
      if (selectedChild?.mobileNumber === childMobile) {
        setSelectedChild(null);
      }
    } catch (err) {
      console.error('Failed to unlink child:', err);
    }
  };

  const updateBudget = async (name: string, amount: number) => {
    if (!user?.id) return;
    try {
      const res = await fetch('/api/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          monthYear,
          name,
          monthlyBudget: amount,
        }),
      });
      if (res.ok) {
        setUser(prev => prev ? { ...prev, name, isSetupComplete: true } : null);
        setMonthlyBudget(amount);
      }
    } catch (err) {
      console.error('Budget update error:', err);
    }
  };

  const addExpense = async (expenseData: Omit<Expense, 'id' | 'createdAt'>) => {
    if (!user?.id) return;
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          ...expenseData,
        }),
      });
      if (res.ok) {
        const newExp = await res.json();
        setExpenses(prev => [newExp, ...prev]);
      }
    } catch (err) {
      console.error('Add expense error:', err);
    }
  };

  const editExpense = async (id: string, updatedFields: Partial<Expense>) => {
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields),
      });
      if (res.ok) {
        setExpenses(prev => prev.map(item => item.id === id ? { ...item, ...updatedFields } : item));
      }
    } catch (err) {
      console.error('Edit expense error:', err);
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setExpenses(prev => prev.filter(item => item.id !== id));
      }
    } catch (err) {
      console.error('Delete expense error:', err);
    }
  };

  const addSplitBill = async (billData: Omit<SplitBill, 'id' | 'createdAt' | 'userShare' | 'totalReceivable' | 'totalPayable'>) => {
    if (!user?.id) return;
    const userParticipant = billData.participants.find(p => p.isUser || p.name.toLowerCase() === user.name.toLowerCase());
    const userShare = userParticipant ? userParticipant.share : 0;
    const isPaidByUser = billData.paidBy.toLowerCase() === user.name.toLowerCase() || billData.paidBy.toLowerCase() === 'you';

    const totalReceivable = isPaidByUser ? billData.totalAmount - userShare : 0;
    const totalPayable = isPaidByUser ? 0 : userShare;

    try {
      const res = await fetch('/api/split-bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          ...billData,
          userShare,
          totalReceivable,
          totalPayable,
        }),
      });
      if (res.ok) {
        const newBill = await res.json();
        setSplitBills(prev => [newBill, ...prev]);
      }
    } catch (err) {
      console.error('Add split bill error:', err);
    }
  };

  const deleteSplitBill = async (id: string) => {
    try {
      const res = await fetch(`/api/split-bills/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSplitBills(prev => prev.filter(item => item.id !== id));
      }
    } catch (err) {
      console.error('Delete split bill error:', err);
    }
  };

  const addHostelExpense = async (expData: Omit<HostelExpense, 'id' | 'createdAt' | 'userShare'>) => {
    if (!user?.id) return;
    const userShare = expData.shares[user.name] || (expData.splitMethod === 'equal' ? expData.totalAmount / Math.max(1, expData.members.length) : 0);

    try {
      const res = await fetch('/api/hostel-expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          ...expData,
          userShare,
        }),
      });
      if (res.ok) {
        const newExp = await res.json();
        setHostelExpenses(prev => [newExp, ...prev]);
      }
    } catch (err) {
      console.error('Add hostel expense error:', err);
    }
  };

  const deleteHostelExpense = async (id: string) => {
    try {
      const res = await fetch(`/api/hostel-expenses/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setHostelExpenses(prev => prev.filter(item => item.id !== id));
      }
    } catch (err) {
      console.error('Delete hostel expense error:', err);
    }
  };

  return (
    <FinanceContext.Provider
      value={{
        user,
        monthYear,
        monthlyBudget,
        expenses,
        splitBills,
        hostelExpenses,
        metrics,
        isLoading,
        linkedChildren,
        selectedChild,
        childBudget,
        childExpenses,
        childSplitBills,
        childHostelExpenses,
        childMetrics,
        setMonthYear,
        setSelectedChild,
        login,
        signup,
        resetPassword,
        logout,
        updateBudget,
        addExpense,
        editExpense,
        deleteExpense,
        addSplitBill,
        deleteSplitBill,
        addHostelExpense,
        deleteHostelExpense,
        refreshData,
        fetchLinkedChildren,
        linkChild,
        unlinkChild,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
