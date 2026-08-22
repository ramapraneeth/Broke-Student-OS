import { calculateFinancialMetrics, generateSavingSuggestions } from './src/utils/calculations.ts';

console.log('=== RUNNING AUTOMATED SPECIFICATION TEST SUITE (SCENARIOS A - G) ===\n');

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${testName} - ${details}`);
    failed++;
  }
}

// SCENARIO A: Budget ₹1,000, No expenses
{
  const res = calculateFinancialMetrics(1000, [], [], [], '2026-08', 'Chiya');
  assert(res.totalPersonalSpent === 0, 'Scenario A: Spent is ₹0', `Got ${res.totalPersonalSpent}`);
  assert(res.remainingBudget === 1000, 'Scenario A: Remaining is ₹1,000', `Got ${res.remainingBudget}`);
  assert(res.spentPercentage === 0, 'Scenario A: Spent is 0%', `Got ${res.spentPercentage}`);
  assert(res.remainingPercentage === 100, 'Scenario A: Remaining is 100%', `Got ${res.remainingPercentage}`);
  assert(!res.isSufficientData, 'Scenario A: Prediction shows insufficient data', `Got isSufficientData=${res.isSufficientData}`);
}

// SCENARIO B: Add ₹100 expense
{
  const expenses = [
    { id: '1', title: 'Food', amount: 100, category: 'Food', date: '2026-08-22', type: 'personal', createdAt: '' }
  ];
  const res = calculateFinancialMetrics(1000, expenses, [], [], '2026-08', 'Chiya');
  assert(res.totalPersonalSpent === 100, 'Scenario B: Spent is ₹100', `Got ${res.totalPersonalSpent}`);
  assert(res.remainingBudget === 900, 'Scenario B: Remaining is ₹900', `Got ${res.remainingBudget}`);
  assert(res.spentPercentage === 10, 'Scenario B: Spent% is 10%', `Got ${res.spentPercentage}`);
  assert(res.remainingPercentage === 90, 'Scenario B: Remaining% is 90%', `Got ${res.remainingPercentage}`);
}

// SCENARIO C: Add ₹500 more (Total ₹600)
{
  const expenses = [
    { id: '1', title: 'Food', amount: 100, category: 'Food', date: '2026-08-22', type: 'personal', createdAt: '' },
    { id: '2', title: 'Shopping', amount: 500, category: 'Shopping', date: '2026-08-22', type: 'personal', createdAt: '' }
  ];
  const res = calculateFinancialMetrics(1000, expenses, [], [], '2026-08', 'Chiya');
  assert(res.totalPersonalSpent === 600, 'Scenario C: Spent is ₹600', `Got ${res.totalPersonalSpent}`);
  assert(res.remainingBudget === 400, 'Scenario C: Remaining is ₹400', `Got ${res.remainingBudget}`);
  assert(res.spentPercentage === 60, 'Scenario C: Spent% is 60%', `Got ${res.spentPercentage}`);
  assert(res.remainingPercentage === 40, 'Scenario C: Remaining% is 40%', `Got ${res.remainingPercentage}`);
}

// SCENARIO D: Add ₹500 more (Total ₹1,100 -> Overspent)
{
  const expenses = [
    { id: '1', title: 'Food', amount: 100, category: 'Food', date: '2026-08-22', type: 'personal', createdAt: '' },
    { id: '2', title: 'Shopping', amount: 500, category: 'Shopping', date: '2026-08-22', type: 'personal', createdAt: '' },
    { id: '3', title: 'Course', amount: 500, category: 'Education', date: '2026-08-22', type: 'personal', createdAt: '' }
  ];
  const res = calculateFinancialMetrics(1000, expenses, [], [], '2026-08', 'Chiya');
  assert(res.totalPersonalSpent === 1100, 'Scenario D: Spent is ₹1,100', `Got ${res.totalPersonalSpent}`);
  assert(res.remainingBudget === 0, 'Scenario D: Remaining is never negative (₹0)', `Got ${res.remainingBudget}`);
  assert(res.overspentAmount === 100, 'Scenario D: Overspent amount is ₹100', `Got ${res.overspentAmount}`);
  assert(res.isOverspent === true, 'Scenario D: isOverspent flag is true', `Got ${res.isOverspent}`);
}

// SCENARIO E: Split ₹800 among 4 people
{
  const splitBills = [
    {
      id: 's1',
      title: 'Dinner',
      totalAmount: 800,
      paidBy: 'Chiya',
      participants: [
        { name: 'Chiya', share: 200, isUser: true, paid: true },
        { name: 'Rahul', share: 200, isUser: false, paid: false },
        { name: 'Arjun', share: 200, isUser: false, paid: false },
        { name: 'Sai', share: 200, isUser: false, paid: false }
      ],
      splitType: 'equal',
      date: '2026-08-20',
      createdAt: '',
      userShare: 200,
      totalReceivable: 600,
      totalPayable: 0
    }
  ];
  const res = calculateFinancialMetrics(1000, [], splitBills, [], '2026-08', 'Chiya');
  assert(res.totalPersonalSpent === 200, 'Scenario E: Personal spent is only user share (₹200, not ₹800)', `Got ${res.totalPersonalSpent}`);
  assert(res.remainingBudget === 800, 'Scenario E: Remaining is ₹800', `Got ${res.remainingBudget}`);
  assert(res.splitSummary.totalReceivable === 600, 'Scenario E: Receivable is ₹600', `Got ${res.splitSummary.totalReceivable}`);
}

// SCENARIO F: Hostel Bill ₹600 among 4 people
{
  const hostel = [
    {
      id: 'h1',
      title: 'WiFi',
      totalAmount: 600,
      paidBy: 'Chiya',
      members: ['Chiya', 'Rahul', 'Arjun', 'Sai'],
      splitMethod: 'equal',
      shares: { Chiya: 150, Rahul: 150, Arjun: 150, Sai: 150 },
      date: '2026-08-01',
      createdAt: '',
      userShare: 150,
      roomName: 'Room 204'
    }
  ];
  const res = calculateFinancialMetrics(1000, [], [], hostel, '2026-08', 'Chiya');
  assert(res.totalPersonalSpent === 150, 'Scenario F: User share of hostel bill is ₹150', `Got ${res.totalPersonalSpent}`);
  assert(res.remainingBudget === 850, 'Scenario F: Remaining budget is ₹850', `Got ${res.remainingBudget}`);
}

// SCENARIO G: Delete the ₹500 expense
{
  let expenses = [
    { id: '1', title: 'Food', amount: 100, category: 'Food', date: '2026-08-22', type: 'personal', createdAt: '' },
    { id: '2', title: 'Shopping', amount: 500, category: 'Shopping', date: '2026-08-22', type: 'personal', createdAt: '' }
  ];
  let res = calculateFinancialMetrics(1000, expenses, [], [], '2026-08', 'Chiya');
  assert(res.totalPersonalSpent === 600, 'Scenario G (Initial): Spent ₹600');

  // Delete '2'
  expenses = expenses.filter(e => e.id !== '2');
  res = calculateFinancialMetrics(1000, expenses, [], [], '2026-08', 'Chiya');
  assert(res.totalPersonalSpent === 100, 'Scenario G (After Delete): Live recalculation to ₹100', `Got ${res.totalPersonalSpent}`);
  assert(res.remainingBudget === 900, 'Scenario G (After Delete): Live recalculation remaining ₹900', `Got ${res.remainingBudget}`);
}

// Check Rule-Based Saving Suggestions
{
  const expenses = [
    { id: '1', title: 'Biryani', amount: 180, category: 'Food', date: '2026-08-22', type: 'personal', createdAt: '' },
    { id: '2', title: 'Bus', amount: 80, category: 'Transport', date: '2026-08-21', type: 'personal', createdAt: '' },
    { id: '3', title: 'Notes', amount: 70, category: 'Shopping', date: '2026-08-18', type: 'personal', createdAt: '' },
    { id: '4', title: 'Xerox', amount: 40, category: 'Education', date: '2026-08-15', type: 'personal', createdAt: '' },
    { id: '5', title: 'Game', amount: 50, category: 'Entertainment', date: '2026-08-12', type: 'personal', createdAt: '' }
  ];
  const res = calculateFinancialMetrics(1000, expenses, [], [], '2026-08', 'Chiya');
  const suggestions = generateSavingSuggestions(res);
  assert(suggestions.length > 0, 'Saving Suggestions generated');
  assert(suggestions.some(s => s.includes('Food')), 'Identified Food as largest expense category correctly');
}

console.log(`\n=== RESULTS: ${passed} PASSED, ${failed} FAILED ===\n`);
if (failed > 0) process.exit(1);
