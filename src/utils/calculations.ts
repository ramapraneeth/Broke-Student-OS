import { 
  Expense, 
  SplitBill, 
  HostelExpense, 
  FinancialMetrics, 
  ExpenseCategory, 
  CategorySummary, 
  CATEGORY_DETAILS 
} from '../types';

/**
 * Get date information for a specific month (format: YYYY-MM)
 */
export function getMonthDateMetrics(monthYear: string) {
  const [yearStr, monthStr] = monthYear.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1-12

  // Total days in this month
  const totalDaysInMonth = new Date(year, month, 0).getDate();

  // Current real date
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  let daysPassed: number;
  let daysRemaining: number;

  if (year === currentYear && month === currentMonth) {
    daysPassed = Math.max(1, currentDay);
    daysRemaining = Math.max(0, totalDaysInMonth - currentDay);
  } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
    // Past month
    daysPassed = totalDaysInMonth;
    daysRemaining = 0;
  } else {
    // Future month
    daysPassed = 1;
    daysRemaining = totalDaysInMonth;
  }

  return {
    totalDaysInMonth,
    daysPassed,
    daysRemaining,
  };
}

/**
 * Single source of truth calculation engine for all financial metrics
 */
export function calculateFinancialMetrics(
  monthlyBudget: number,
  expenses: Expense[],
  splitBills: SplitBill[],
  hostelExpenses: HostelExpense[],
  monthYear: string = '2026-08',
  userName: string = 'Chiya'
): FinancialMetrics {
  const dateMetrics = getMonthDateMetrics(monthYear);
  const { totalDaysInMonth, daysPassed, daysRemaining } = dateMetrics;

  // Filter items belonging to the selected month (YYYY-MM)
  const monthExpenses = expenses.filter(e => e.date.startsWith(monthYear));
  const monthSplitBills = splitBills.filter(s => s.date.startsWith(monthYear));
  const monthHostelExpenses = hostelExpenses.filter(h => h.date.startsWith(monthYear));

  // 1. Calculate Personal Spending
  // Direct personal expenses
  const personalExpensesTotal = monthExpenses
    .filter(e => e.type === 'personal')
    .reduce((sum, e) => sum + e.amount, 0);

  // Split bill shares (only user's share!)
  const splitBillsUserShare = monthSplitBills.reduce((sum, s) => {
    return sum + (s.userShare || 0);
  }, 0);

  // Hostel expense shares (only user's share!)
  const hostelExpensesUserShare = monthHostelExpenses.reduce((sum, h) => {
    return sum + (h.userShare || 0);
  }, 0);

  // Total Personal Spending
  const totalPersonalSpent = personalExpensesTotal + splitBillsUserShare + hostelExpensesUserShare;

  // 2. Budget & Overspending
  const safeBudget = Math.max(0, monthlyBudget);
  const remainingBudget = Math.max(0, safeBudget - totalPersonalSpent);
  const overspentAmount = Math.max(0, totalPersonalSpent - safeBudget);
  const isOverspent = totalPersonalSpent > safeBudget;

  // 3. Percentages (Must always add up to 100% when under budget, never broken)
  let spentPercentage = 0;
  let remainingPercentage = 100;

  if (safeBudget > 0) {
    if (isOverspent) {
      spentPercentage = Math.round((totalPersonalSpent / safeBudget) * 100);
      remainingPercentage = 0;
    } else {
      spentPercentage = Math.round((totalPersonalSpent / safeBudget) * 100);
      remainingPercentage = 100 - spentPercentage;
    }
  }

  // 4. Safe Daily Limit
  // If daysRemaining is 0 or budget overspent, safe daily spending is 0
  const safeDailyLimit = daysRemaining > 0 && remainingBudget > 0
    ? Math.round((remainingBudget / daysRemaining) * 10) / 10
    : 0;

  // 5. Spending Prediction
  // Count distinct expense dates or entries to ensure we have enough data (>= 3 records or distinct days)
  const distinctDates = new Set(monthExpenses.map(e => e.date));
  const hasMultipleSplitOrHostel = (monthSplitBills.length + monthHostelExpenses.length) > 0;
  const isSufficientData = (monthExpenses.length >= 3 && distinctDates.size >= 2) || (monthExpenses.length >= 4) || hasMultipleSplitOrHostel;

  const dailySpendingRate = daysPassed > 0
    ? Math.round((totalPersonalSpent / daysPassed) * 10) / 10
    : 0;

  const predictedMonthlySpending = Math.round(dailySpendingRate * totalDaysInMonth);
  const isOnTrack = predictedMonthlySpending <= safeBudget;
  const predictionDifference = Math.abs(predictedMonthlySpending - safeBudget);

  // 6. Category Breakdowns
  const categoryMap: Partial<Record<ExpenseCategory, { amount: number; count: number }>> = {};
  
  // Initialize all standard categories with 0
  (Object.keys(CATEGORY_DETAILS) as ExpenseCategory[]).forEach(cat => {
    categoryMap[cat] = { amount: 0, count: 0 };
  });

  // Accumulate personal expenses
  monthExpenses.forEach(e => {
    if (!categoryMap[e.category]) {
      categoryMap[e.category] = { amount: 0, count: 0 };
    }
    categoryMap[e.category]!.amount += e.amount;
    categoryMap[e.category]!.count += 1;
  });

  // Accumulate split bill shares (assigned to 'Food' or 'Other' based on title/category)
  monthSplitBills.forEach(s => {
    const cat: ExpenseCategory = s.title.toLowerCase().includes('food') || s.title.toLowerCase().includes('dinner') || s.title.toLowerCase().includes('lunch') || s.title.toLowerCase().includes('cafe') || s.title.toLowerCase().includes('tea') ? 'Food' : 'Other';
    categoryMap[cat]!.amount += s.userShare;
    categoryMap[cat]!.count += 1;
  });

  // Accumulate hostel shares (assigned to 'Hostel')
  monthHostelExpenses.forEach(h => {
    categoryMap['Hostel']!.amount += h.userShare;
    categoryMap['Hostel']!.count += 1;
  });

  const categoryBreakdowns: CategorySummary[] = (Object.keys(categoryMap) as ExpenseCategory[])
    .map(cat => {
      const data = categoryMap[cat]!;
      const percentage = totalPersonalSpent > 0 ? Math.round((data.amount / totalPersonalSpent) * 100) : 0;
      return {
        category: cat,
        amount: data.amount,
        percentage,
        count: data.count,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  const largestCategory = categoryBreakdowns.length > 0 && categoryBreakdowns[0].amount > 0 
    ? categoryBreakdowns[0] 
    : null;

  // 7. Hostel Summary
  const hostelTotalShared = monthHostelExpenses.reduce((sum, h) => sum + h.totalAmount, 0);
  const hostelUserShare = monthHostelExpenses.reduce((sum, h) => sum + h.userShare, 0);
  
  // What Chiya paid for hostel expenses
  const hostelUserPaid = monthHostelExpenses
    .filter(h => h.paidBy.toLowerCase() === userName.toLowerCase() || h.paidBy.toLowerCase() === 'you' || h.paidBy.toLowerCase() === 'chiya')
    .reduce((sum, h) => sum + h.totalAmount, 0);

  // Net hostel owes / receivable
  const hostelUserOwes = Math.max(0, hostelUserShare - hostelUserPaid);
  const hostelUserReceivable = Math.max(0, hostelUserPaid - hostelUserShare);

  // 8. Split Bills Summary
  let splitReceivable = 0;
  let splitPayable = 0;

  monthSplitBills.forEach(s => {
    const isPaidByUser = s.paidBy.toLowerCase() === userName.toLowerCase() || s.paidBy.toLowerCase() === 'you';
    if (isPaidByUser) {
      splitReceivable += s.totalReceivable;
    } else {
      splitPayable += s.userShare;
    }
  });

  return {
    monthlyBudget: safeBudget,
    totalPersonalSpent,
    remainingBudget,
    overspentAmount,
    isOverspent,
    spentPercentage,
    remainingPercentage,
    daysPassed,
    daysRemaining,
    totalDaysInMonth,
    safeDailyLimit,
    dailySpendingRate,
    predictedMonthlySpending,
    isSufficientData,
    predictionDifference,
    isOnTrack,
    categoryBreakdowns,
    largestCategory,
    hostelSummary: {
      totalShared: hostelTotalShared,
      userShare: hostelUserShare,
      userPaid: hostelUserPaid,
      userOwes: hostelUserOwes,
      userReceivable: hostelUserReceivable,
    },
    splitSummary: {
      totalReceivable: splitReceivable,
      totalPayable: splitPayable,
    },
  };
}

/**
 * Generate transparent, rule-based saving suggestions
 */
export function generateSavingSuggestions(metrics: FinancialMetrics): string[] {
  const suggestions: string[] = [];

  if (metrics.totalPersonalSpent === 0) {
    return ["💡 Add your first expense to receive tailored money-saving advice!"];
  }

  // Check Largest Category
  if (metrics.largestCategory && metrics.largestCategory.percentage >= 30) {
    const cat = metrics.largestCategory;
    if (cat.category === 'Food') {
      suggestions.push(`🍛 Food is your largest expense (${cat.percentage}% · ₹${cat.amount.toLocaleString('en-IN')}). Try cooking in hostel, choosing mess meals, or limiting cafe visits to save ₹150+ this week.`);
    } else if (cat.category === 'Shopping') {
      suggestions.push(`🛍 Shopping takes up ${cat.percentage}% of your budget. Apply the 48-hour rule before buying non-essential items.`);
    } else if (cat.category === 'Entertainment') {
      suggestions.push(`🎮 Entertainment is taking ${cat.percentage}% of your budget. Consider student discounts, sharing OTT subs, or free campus activities.`);
    } else if (cat.category === 'Transport') {
      suggestions.push(`🚌 Transport is ${cat.percentage}% of your spending. Check if student monthly bus passes or walking shorter distances can reduce costs.`);
    } else {
      suggestions.push(`${CATEGORY_DETAILS[cat.category].emoji} ${cat.category} is your highest expense at ${cat.percentage}%. Keep an eye on non-essential purchases here.`);
    }
  }

  // Check Prediction Burn Rate
  if (metrics.isSufficientData) {
    if (!metrics.isOnTrack) {
      suggestions.push(`⚠️ At your current rate of ₹${metrics.dailySpendingRate}/day, you'll exceed your budget by ₹${metrics.predictionDifference.toLocaleString('en-IN')}. Reduce spending to ₹${metrics.safeDailyLimit}/day to stay on track.`);
    } else if (metrics.safeDailyLimit > 0) {
      suggestions.push(`✓ Great job! If you stick within ₹${Math.floor(metrics.safeDailyLimit)}/day, you'll have ₹${metrics.remainingBudget.toLocaleString('en-IN')} left at the end of the month.`);
    }
  }

  // Check Specific Categories
  const entertainment = metrics.categoryBreakdowns.find(c => c.category === 'Entertainment');
  if (entertainment && entertainment.percentage > 20 && metrics.largestCategory?.category !== 'Entertainment') {
    suggestions.push(`🎮 Entertainment is taking ${entertainment.percentage}% of your spending. Set a weekend budget limit.`);
  }

  // Default fallback if spending is very well managed
  if (suggestions.length === 0) {
    suggestions.push("✓ Your spending is currently well under control. Keep logging every expense!");
  }

  return suggestions;
}
