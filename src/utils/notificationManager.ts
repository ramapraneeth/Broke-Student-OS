import { AppNotification, NotificationSettings, FinancialMetrics, Expense, SplitBill, HostelExpense, UserProfile } from '../types';

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  browserNotifications: true,
  budgetAlerts: true,
  customThresholdEnabled: false,
  customThresholdAmount: 700,
  spendingAlerts: true,
  predictionAlerts: true,
  splitBillAlerts: true,
  hostelAlerts: true,
  savingTips: true,
};

/**
 * Checks if Browser Notifications are supported
 */
export function isBrowserNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Get current browser notification permission
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isBrowserNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Request notification permission safely
 */
export async function requestBrowserNotificationPermission(): Promise<{
  status: NotificationPermission | 'unsupported';
  message: string;
}> {
  if (!isBrowserNotificationSupported()) {
    return {
      status: 'unsupported',
      message: "Browser notifications aren't supported here. You can still use in-app notifications.",
    };
  }

  try {
    const result = await Notification.requestPermission();
    if (result === 'granted') {
      // Send a welcome verification notification
      sendBrowserNotification(
        '🔔 Broke OS',
        '✓ Notifications enabled. You will receive smart budget & spending alerts.',
        'welcome_init'
      );
      return { status: 'granted', message: '✓ Notifications enabled.' };
    } else if (result === 'denied') {
      return {
        status: 'denied',
        message: 'You can enable notifications later from Profile → Notification Settings.',
      };
    }
    return { status: 'default', message: 'Permission dismissed.' };
  } catch (err) {
    console.error('Notification permission error:', err);
    return { status: 'denied', message: 'Could not request notification permission.' };
  }
}

/**
 * Send real Web Browser notification using ServiceWorker or standard Notification API
 */
export async function sendBrowserNotification(title: string, message: string, tag?: string) {
  if (!isBrowserNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  try {
    // Try service worker notification first (best for PWA / mobile browsers)
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration && registration.showNotification) {
        await registration.showNotification(title, {
          body: message,
          icon: '/pwa-192x192.svg',
          badge: '/favicon.svg',
          tag: tag || `broke_os_${Date.now()}`,
          data: { url: '/' },
        } as NotificationOptions);
        return true;
      }
    }

    // Fallback to Window Notification object
    new Notification(title, {
      body: message,
      icon: '/pwa-192x192.svg',
      tag: tag || `broke_os_${Date.now()}`,
    });
    return true;
  } catch (err) {
    console.warn('Could not display browser notification:', err);
    return false;
  }
}

/**
 * Dispatch 6-digit verification code directly as a system push notification
 */
export async function sendSystemPushOtp(otpCode: string, email?: string): Promise<{ success: boolean; error?: string }> {
  if (!isBrowserNotificationSupported()) {
    return { success: false, error: 'System notifications not supported in this browser.' };
  }

  let permission = Notification.permission;
  if (permission === 'default') {
    try {
      permission = await Notification.requestPermission();
    } catch (e) {
      // ignore
    }
  }

  if (permission !== 'granted') {
    return { success: false, error: 'Please allow notification permissions in your browser to receive your security code.' };
  }

  const title = '🔐 Broke OS Security Code';
  const body = `Your 6-digit verification code is: ${otpCode}\nValid for 1 minute (60s). Enter this code to proceed.`;

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, {
          body,
          icon: '/pwa-192x192.svg',
          badge: '/favicon.svg',
          tag: 'otp_verification',
          data: { url: '/' },
        } as NotificationOptions);
        return { success: true };
      }
    }

    new Notification(title, {
      body,
      icon: '/pwa-192x192.svg',
      tag: 'otp_verification',
    });
    return { success: true };
  } catch (err: any) {
    console.error('System push OTP dispatch failed:', err);
    return { success: false, error: 'Failed to display system notification.' };
  }
}

export interface EvaluateAlertsParams {
  user: UserProfile;
  metrics: FinancialMetrics;
  monthlyBudget: number;
  monthYear: string;
  expenses: Expense[];
  splitBills: SplitBill[];
  hostelExpenses: HostelExpense[];
  settings: NotificationSettings;
  dispatchedKeys: Set<string>;
  onDispatchNotification: (notif: {
    type: AppNotification['type'];
    title: string;
    message: string;
    eventKey: string;
    monthlyCycle: string;
  }) => Promise<void>;
}

/**
 * Checks all financial rules and triggers both browser and in-app notifications
 * with strict duplicate prevention per monthly cycle.
 */
export async function evaluateAndTriggerAlerts({
  user,
  metrics,
  monthlyBudget,
  monthYear,
  expenses,
  splitBills,
  hostelExpenses,
  settings,
  dispatchedKeys,
  onDispatchNotification,
}: EvaluateAlertsParams) {
  if (!user || !user.isLoggedIn || user.role === 'parent') return;

  const alertsToTrigger: Array<{
    type: AppNotification['type'];
    title: string;
    message: string;
    eventKey: string;
    monthlyCycle: string;
  }> = [];

  const totalSpent = metrics.totalPersonalSpent;

  // 1. Custom Spending Threshold Alert
  if (settings.customThresholdEnabled && settings.customThresholdAmount > 0) {
    const threshold = settings.customThresholdAmount;
    const eventKey = `custom_${threshold}_${monthYear}`;
    if (totalSpent >= threshold && !dispatchedKeys.has(eventKey)) {
      alertsToTrigger.push({
        type: 'custom_threshold',
        title: '⚠️ Broke OS',
        message: `You've spent ₹${totalSpent.toLocaleString('en-IN')} of your ₹${monthlyBudget.toLocaleString('en-IN')} monthly budget.`,
        eventKey,
        monthlyCycle: monthYear,
      });
    }
  }

  // 2. 80% Budget Alert
  if (settings.budgetAlerts) {
    const eventKey80 = `budget_80_${monthYear}`;
    if (metrics.spentPercentage >= 80 && !metrics.isOverspent && metrics.spentPercentage < 90 && !dispatchedKeys.has(eventKey80)) {
      alertsToTrigger.push({
        type: 'budget_80',
        title: '🔔 Broke OS',
        message: `You've used 80% of your monthly budget. ₹${totalSpent.toLocaleString('en-IN')} / ₹${monthlyBudget.toLocaleString('en-IN')} spent.`,
        eventKey: eventKey80,
        monthlyCycle: monthYear,
      });
    }

    // 3. 90% Budget Alert
    const eventKey90 = `budget_90_${monthYear}`;
    if (metrics.spentPercentage >= 90 && !metrics.isOverspent && !dispatchedKeys.has(eventKey90)) {
      alertsToTrigger.push({
        type: 'budget_90',
        title: '🚨 Broke OS',
        message: `Only ₹${Math.max(0, metrics.remainingBudget).toLocaleString('en-IN')} remains from your monthly budget.`,
        eventKey: eventKey90,
        monthlyCycle: monthYear,
      });
    }

    // 4. Overspending Alert
    const eventKeyOver = `overspent_${monthYear}`;
    if (metrics.isOverspent && !dispatchedKeys.has(eventKeyOver)) {
      alertsToTrigger.push({
        type: 'overspent',
        title: '🚨 Broke OS',
        message: `You've exceeded your monthly budget by ₹${metrics.overspentAmount.toLocaleString('en-IN')}.`,
        eventKey: eventKeyOver,
        monthlyCycle: monthYear,
      });
    }
  }

  // 5. Spending Prediction Alert
  if (settings.predictionAlerts && metrics.isSufficientData && !metrics.isOnTrack) {
    const eventKeyPred = `prediction_warning_${monthYear}`;
    if (!dispatchedKeys.has(eventKeyPred)) {
      alertsToTrigger.push({
        type: 'prediction',
        title: '🔮 Broke OS',
        message: 'At your current spending rate, you may exceed your monthly budget.',
        eventKey: eventKeyPred,
        monthlyCycle: monthYear,
      });
    }
  }

  // 6. High Daily Spending Alert
  if (settings.spendingAlerts && metrics.safeDailyLimit > 0) {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayExpenses = expenses.filter(e => e.date === todayStr);
    const todaySpent = todayExpenses.reduce((acc, curr) => acc + curr.amount, 0);

    // If today's spending exceeds safeDailyLimit significantly (e.g. >= 100 or >= safeDailyLimit * 1.5)
    if (todaySpent > 0 && (todaySpent >= 100 || todaySpent > metrics.safeDailyLimit * 1.4)) {
      const eventKeyDaily = `daily_high_${todayStr}`;
      if (!dispatchedKeys.has(eventKeyDaily)) {
        alertsToTrigger.push({
          type: 'high_daily',
          title: '⚠️ Broke OS',
          message: `You spent ₹${todaySpent.toLocaleString('en-IN')} today. Your safe daily limit is ₹${Math.floor(metrics.safeDailyLimit)}.`,
          eventKey: eventKeyDaily,
          monthlyCycle: monthYear,
        });
      }
    }
  }

  // 7. Split Bill Notifications (when someone owes user money)
  if (settings.splitBillAlerts) {
    for (const bill of splitBills) {
      if (bill.totalReceivable > 0) {
        for (const p of bill.participants) {
          if (!p.isUser && !p.paid && p.share > 0) {
            const eventKeySplit = `split_bill_${bill.id}_${p.name}`;
            if (!dispatchedKeys.has(eventKeySplit)) {
              alertsToTrigger.push({
                type: 'split_bill',
                title: '👥 Broke OS',
                message: `${p.name} owes you ₹${p.share.toLocaleString('en-IN')} from a split bill.`,
                eventKey: eventKeySplit,
                monthlyCycle: monthYear,
              });
            }
          }
        }
      }
    }
  }

  // 8. Hostel Expense Notifications (when shared hostel expense involves user)
  if (settings.hostelAlerts) {
    for (const hexp of hostelExpenses) {
      if (hexp.userShare > 0) {
        const eventKeyHostel = `hostel_expense_${hexp.id}`;
        if (!dispatchedKeys.has(eventKeyHostel)) {
          alertsToTrigger.push({
            type: 'hostel_expense',
            title: '🏠 Broke OS',
            message: `Your share of the hostel ${hexp.title} bill is ₹${hexp.userShare.toLocaleString('en-IN')}.`,
            eventKey: eventKeyHostel,
            monthlyCycle: monthYear,
          });
        }
      }
    }
  }

  // Dispatch all pending alerts
  for (const alert of alertsToTrigger) {
    // 1. Mark key in dispatchedKeys memory
    dispatchedKeys.add(alert.eventKey);

    // 2. Real Browser Notification
    if (settings.browserNotifications && getNotificationPermission() === 'granted') {
      sendBrowserNotification(alert.title, alert.message, alert.eventKey);
    }

    // 3. In-App Notification save to DB & Context
    await onDispatchNotification(alert);
  }
}
