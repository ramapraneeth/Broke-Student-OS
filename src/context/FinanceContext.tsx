import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  Expense, 
  SplitBill, 
  HostelExpense, 
  UserProfile, 
  FinancialMetrics,
  LinkedChild,
  AppNotification,
  NotificationSettings,
  NotificationType
} from '../types';
import { calculateFinancialMetrics } from '../utils/calculations';
import { 
  DEFAULT_NOTIFICATION_SETTINGS, 
  getNotificationPermission, 
  requestBrowserNotificationPermission, 
  sendBrowserNotification,
  evaluateAndTriggerAlerts
} from '../utils/notificationManager';

interface FinanceContextType {
  user: UserProfile | null;
  monthYear: string;
  monthlyBudget: number;
  expenses: Expense[];
  splitBills: SplitBill[];
  hostelExpenses: HostelExpense[];
  metrics: FinancialMetrics;
  isLoading: boolean;
  
  // Notification States & Controls
  notifications: AppNotification[];
  notificationSettings: NotificationSettings;
  unreadNotificationCount: number;
  permissionStatus: NotificationPermission | 'unsupported';
  requestPermission: () => Promise<{ status: NotificationPermission | 'unsupported'; message: string }>;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  sendTestNotification: (type?: NotificationType) => Promise<void>;
  dismissBanner: () => void;
  showNotificationBanner: boolean;
  
  // Parent & Admin Controls
  linkedChildren: LinkedChild[];
  selectedChild: LinkedChild | null;
  childBudget: number;
  childExpenses: Expense[];
  childSplitBills: SplitBill[];
  childHostelExpenses: HostelExpense[];
  childMetrics: FinancialMetrics;
  
  setMonthYear: (my: string) => void;
  setSelectedChild: (c: LinkedChild | null) => void;
  login: (email: string, pass: string, role?: 'student' | 'parent') => Promise<{ success: boolean; role?: 'student' | 'parent'; error?: string }>;
  signup: (name: string, email: string, pass: string, role?: 'student' | 'parent') => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
  sendEmailOtp: (email: string, reason: 'login' | 'signup' | 'link_child' | 'forgot_password', role?: 'student' | 'parent') => Promise<{ success: boolean; message?: string; error?: string }>;
  verifyEmailOtp: (email: string, otp: string, reason: 'login' | 'signup' | 'link_child' | 'forgot_password') => Promise<{ success: boolean; error?: string }>;
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
  linkChild: (childEmail: string) => Promise<{ success: boolean; student?: LinkedChild; error?: string }>;
  unlinkChild: (childEmail: string) => Promise<void>;
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

  // Notification State
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => {
    try {
      const saved = localStorage.getItem('broke_os_notif_settings');
      return saved ? JSON.parse(saved) : DEFAULT_NOTIFICATION_SETTINGS;
    } catch {
      return DEFAULT_NOTIFICATION_SETTINGS;
    }
  });
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>(() => getNotificationPermission());
  const [showNotificationBanner, setShowNotificationBanner] = useState<boolean>(false);
  const dispatchedKeysRef = React.useRef<Set<string>>(new Set());

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

  // Sync settings to localStorage
  useEffect(() => {
    localStorage.setItem('broke_os_notif_settings', JSON.stringify(notificationSettings));
  }, [notificationSettings]);

  // Check banner display on mount / login
  useEffect(() => {
    if (user && user.isLoggedIn && user.role === 'student') {
      const currentPerm = getNotificationPermission();
      setPermissionStatus(currentPerm);
      const isDismissed = sessionStorage.getItem('broke_os_notif_banner_dismissed') === 'true';
      if (currentPerm === 'default' && !isDismissed) {
        setShowNotificationBanner(true);
      } else {
        setShowNotificationBanner(false);
      }
    } else {
      setShowNotificationBanner(false);
    }
  }, [user]);

  const dismissBanner = () => {
    sessionStorage.setItem('broke_os_notif_banner_dismissed', 'true');
    setShowNotificationBanner(false);
  };

  // Fetch Notifications & Settings from backend
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/notifications/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        if (data.settings) {
          setNotificationSettings(prev => ({
            ...prev,
            ...data.settings,
          }));
          if (Array.isArray(data.settings.dispatchedKeys)) {
            data.settings.dispatchedKeys.forEach((k: string) => dispatchedKeysRef.current.add(k));
          }
        }
        if (Array.isArray(data.notifications)) {
          data.notifications.forEach((n: AppNotification) => dispatchedKeysRef.current.add(n.eventKey));
        }
      }
    } catch (err) {
      console.error('Failed to load notifications from backend:', err);
    }
  }, [user?.id]);


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
      }
    } catch (err) {
      console.error('Failed to fetch linked children:', err);
    }
  }, [user?.id, user?.role]);


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

  const login = async (email: string, pass: string, role?: 'student' | 'parent'): Promise<{ success: boolean; role?: 'student' | 'parent'; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: pass, role }),
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

  const signup = async (name: string, email: string, pass: string, role: 'student' | 'parent' = 'student'): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: cleanEmail, password: pass, role }),
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

  const resetPassword = async (email: string, newPass: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, newPassword: newPass }),
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

  const sendEmailOtp = async (email: string, reason: 'login' | 'signup' | 'link_child' | 'forgot_password', role?: 'student' | 'parent'): Promise<{ success: boolean; message?: string; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    try {
      const res = await fetch('/api/auth/send-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, reason, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to dispatch security code' };
      }
      return { success: true, message: data.message };
    } catch (err) {
      return { success: false, error: 'Network error sending verification code' };
    }
  };

  const verifyEmailOtp = async (email: string, otp: string, reason: 'login' | 'signup' | 'link_child' | 'forgot_password'): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.toString().trim();
    try {
      const res = await fetch('/api/auth/verify-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, otp: cleanOtp, reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Invalid or expired verification code' };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Network error verifying code' };
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

  // Parent: Link a new student child by Email
  const linkChild = async (childEmail: string): Promise<{ success: boolean; student?: LinkedChild; error?: string }> => {
    if (!user?.id) return { success: false, error: 'Not logged in' };
    const cleanEmail = childEmail.trim().toLowerCase();
    try {
      const res = await fetch('/api/parent/link-child', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentId: user.id, childEmail: cleanEmail }),
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
  const unlinkChild = async (childEmail: string) => {
    if (!user?.id) return;
    const cleanEmail = childEmail.trim().toLowerCase();
    try {
      await fetch('/api/parent/unlink-child', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentId: user.id, childEmail: cleanEmail }),
      });
      setLinkedChildren(prev => prev.filter(c => c.email.toLowerCase() !== cleanEmail));
      if (selectedChild?.email.toLowerCase() === cleanEmail) {
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

  // Fetch notifications on user load
  useEffect(() => {
    if (user?.id && user.role === 'student') {
      fetchNotifications();
    }
  }, [user?.id, user?.role, fetchNotifications]);

  // Handle dispatching in-app notification to DB & state
  const handleDispatchNotification = useCallback(async (notifData: {
    type: AppNotification['type'];
    title: string;
    message: string;
    eventKey: string;
    monthlyCycle: string;
  }) => {
    if (!user?.id) return;
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          ...notifData,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.notification) {
          setNotifications(prev => [data.notification, ...prev.filter(n => n.id !== data.notification.id)]);
        }
      }
    } catch (err) {
      console.error('Dispatch notification error:', err);
    }
  }, [user?.id]);

  // Evaluate and trigger financial alerts whenever data updates
  useEffect(() => {
    if (!user || user.role !== 'student' || !user.isLoggedIn || isLoading) return;

    evaluateAndTriggerAlerts({
      user,
      metrics,
      monthlyBudget,
      monthYear,
      expenses,
      splitBills,
      hostelExpenses,
      settings: notificationSettings,
      dispatchedKeys: dispatchedKeysRef.current,
      onDispatchNotification: handleDispatchNotification,
    });
  }, [
    user,
    metrics,
    monthlyBudget,
    monthYear,
    expenses,
    splitBills,
    hostelExpenses,
    notificationSettings,
    isLoading,
    handleDispatchNotification,
  ]);

  const requestPermission = async (): Promise<{ status: NotificationPermission | 'unsupported'; message: string }> => {
    const res = await requestBrowserNotificationPermission();
    setPermissionStatus(res.status);
    if (res.status === 'granted') {
      setShowNotificationBanner(false);
      await updateNotificationSettings({ browserNotifications: true });
    }
    return res;
  };

  const updateNotificationSettings = async (updated: Partial<NotificationSettings>) => {
    const newSettings = { ...notificationSettings, ...updated };
    setNotificationSettings(newSettings);
    if (user?.id) {
      try {
        await fetch('/api/notifications/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, ...newSettings }),
        });
      } catch (err) {
        console.error('Failed to save settings to server:', err);
      }
    }
  };

  const markNotificationAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const markAllNotificationsAsRead = async () => {
    if (!user?.id) return;
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await fetch(`/api/notifications/read-all/${user.id}`, { method: 'PUT' });
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const clearAllNotifications = async () => {
    if (!user?.id) return;
    setNotifications([]);
    try {
      await fetch(`/api/notifications/${user.id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to clear notifications:', err);
    }
  };

  const sendTestNotification = async (type: NotificationType = 'budget_80') => {
    if (!user) return;
    let title = '🔔 Broke OS';
    let message = 'Test alert: You will receive real-time updates on your budget.';
    
    if (type === 'custom_threshold') {
      title = '⚠️ Broke OS';
      message = `You've spent ₹${(notificationSettings.customThresholdAmount || 700).toLocaleString('en-IN')} of your ₹${monthlyBudget.toLocaleString('en-IN')} monthly budget.`;
    } else if (type === 'budget_80') {
      title = '🔔 Broke OS';
      message = `You've used 80% of your monthly budget. ₹${Math.floor(monthlyBudget * 0.8).toLocaleString('en-IN')} / ₹${monthlyBudget.toLocaleString('en-IN')} spent.`;
    } else if (type === 'budget_90') {
      title = '🚨 Broke OS';
      message = `Only ₹${Math.floor(monthlyBudget * 0.1).toLocaleString('en-IN')} remains from your monthly budget.`;
    } else if (type === 'overspent') {
      title = '🚨 Broke OS';
      message = 'You\'ve exceeded your monthly budget by ₹200.';
    } else if (type === 'prediction') {
      title = '🔮 Broke OS';
      message = 'At your current spending rate, you may exceed your monthly budget.';
    } else if (type === 'high_daily') {
      title = '⚠️ Broke OS';
      message = 'You spent ₹100 today. Your safe daily limit is ₹32.';
    } else if (type === 'split_bill') {
      title = '👥 Broke OS';
      message = 'Rahul owes you ₹200 from a split bill.';
    } else if (type === 'hostel_expense') {
      title = '🏠 Broke OS';
      message = 'Your share of the hostel WiFi bill is ₹150.';
    }

    const eventKey = `test_${type}_${Date.now()}`;
    
    // Browser notification
    if (notificationSettings.browserNotifications && getNotificationPermission() === 'granted') {
      sendBrowserNotification(title, message, eventKey);
    }

    // In-app notification
    await handleDispatchNotification({
      type,
      title,
      message,
      eventKey,
      monthlyCycle: monthYear,
    });
  };

  const unreadNotificationCount = notifications.filter(n => !n.read).length;

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
        notifications,
        notificationSettings,
        unreadNotificationCount,
        permissionStatus,
        requestPermission,
        updateNotificationSettings,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearAllNotifications,
        sendTestNotification,
        dismissBanner,
        showNotificationBanner,
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
        sendEmailOtp,
        verifyEmailOtp,
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
