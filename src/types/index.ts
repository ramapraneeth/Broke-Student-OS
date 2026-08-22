export type ExpenseCategory = 
  | 'Food'
  | 'Transport'
  | 'Education'
  | 'Shopping'
  | 'Entertainment'
  | 'Hostel'
  | 'Recharge'
  | 'Other';

export interface CategoryMeta {
  name: ExpenseCategory;
  emoji: string;
  color: string;
  bgColor: string;
}

export const CATEGORY_DETAILS: Record<ExpenseCategory, CategoryMeta> = {
  Food: { name: 'Food', emoji: '🍛', color: '#EA580C', bgColor: '#FFF7ED' },
  Transport: { name: 'Transport', emoji: '🚌', color: '#2563EB', bgColor: '#EFF6FF' },
  Education: { name: 'Education', emoji: '📚', color: '#7C3AED', bgColor: '#F5F3FF' },
  Shopping: { name: 'Shopping', emoji: '🛍', color: '#DB2777', bgColor: '#FDF2F8' },
  Entertainment: { name: 'Entertainment', emoji: '🎮', color: '#9333EA', bgColor: '#FAF5FF' },
  Hostel: { name: 'Hostel', emoji: '🏠', color: '#0D9488', bgColor: '#F0FDFA' },
  Recharge: { name: 'Recharge', emoji: '📱', color: '#0284C7', bgColor: '#F0F9FF' },
  Other: { name: 'Other', emoji: '📦', color: '#64748B', bgColor: '#F8FAFC' },
};

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string; // YYYY-MM-DD
  note?: string;
  type: 'personal' | 'split_share' | 'hostel_share';
  refId?: string; // id of split bill or hostel expense if applicable
  createdAt: string;
}

export interface SplitParticipant {
  name: string;
  share: number;
  isUser: boolean;
  paid: boolean;
}

export interface SplitBill {
  id: string;
  title: string;
  totalAmount: number;
  paidBy: string; // 'Chiya' (user) or friend name
  participants: SplitParticipant[];
  splitType: 'equal' | 'custom';
  date: string;
  createdAt: string;
  userShare: number;
  totalReceivable: number; // money owed to user if user paid
  totalPayable: number; // money user owes if someone else paid
}

export interface HostelExpense {
  id: string;
  title: string;
  totalAmount: number;
  paidBy: string; // who paid
  members: string[]; // members involved
  splitMethod: 'equal' | 'custom';
  shares: Record<string, number>; // name -> amount
  date: string;
  createdAt: string;
  userShare: number;
  roomName: string;
}

export interface UserProfile {
  id: string;
  name: string;
  mobileNumber: string;
  password?: string;
  role: 'student' | 'parent';
  isLoggedIn: boolean;
  isSetupComplete: boolean;
}

export interface LinkedChild {
  id: string;
  name: string;
  mobileNumber: string;
  isSetupComplete: boolean;
  linkedAt?: string;
}

export interface MonthBudget {
  id: string;
  monthYear: string; // '2026-08'
  monthlyBudget: number;
}

export interface CategorySummary {
  category: ExpenseCategory;
  amount: number;
  percentage: number;
  count: number;
}

export interface FinancialMetrics {
  monthlyBudget: number;
  totalPersonalSpent: number;
  remainingBudget: number;
  overspentAmount: number;
  isOverspent: boolean;
  spentPercentage: number;
  remainingPercentage: number;
  daysPassed: number;
  daysRemaining: number;
  totalDaysInMonth: number;
  safeDailyLimit: number;
  dailySpendingRate: number;
  predictedMonthlySpending: number;
  isSufficientData: boolean;
  predictionDifference: number;
  isOnTrack: boolean;
  categoryBreakdowns: CategorySummary[];
  largestCategory: CategorySummary | null;
  hostelSummary: {
    totalShared: number;
    userShare: number;
    userPaid: number;
    userOwes: number;
    userReceivable: number;
  };
  splitSummary: {
    totalReceivable: number;
    totalPayable: number;
  };
}

export type AppScreen = 
  | 'login'
  | 'signup'
  | 'forgot-password'
  | 'setup'
  | 'home'
  | 'savings'
  | 'expenses'
  | 'add-expense'
  | 'split-bill'
  | 'hostel-expenses'
  | 'monthly-report'
  | 'admin';
